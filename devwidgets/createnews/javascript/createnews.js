/*
 * Licensed to the Sakai Foundation (SF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The SF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

/*global $, Config */

var sakai = sakai || {};

/**
 * @name sakai.createnews
 *
 * @class createnews
 *
 * @description
 * createnews widget
 *
 * @version 0.0.1
 * @param {String} tuid Unique id of the widget
 * @param {Boolean} showSettings Show the settings of the widget or not
 */
sakai.createnews = function(tuid, showSettings){

    /////////////////////////////
    // Configuration variables //
    /////////////////////////////

    var MAX_LENGTH = 30;

    // - ID
    var createnews = "#createnews";

    // Container
    var createnewsContainer = createnews + "_container";

    // template containers
    var createnewsAddTemplate = "#noncourse_template_container";

    // Non course
    var createnewsAdd = createnews + "_add";
    var createnewsAddCancel = createnewsAdd + "_cancel";
    var createnewsAddDescription = createnewsAdd + "_description";
    var createnewsAddId = createnewsAdd + "_id";
    var createnewsAddName = createnewsAdd + "_name";
    var createnewsAddProcess = createnewsAdd + "_process";
    var createnewsAddSave = createnewsAdd + "_save";
    var createnewsAddUrl = createnewsAdd + "_url";
    var createnewsAddUrlLength = createnewsAddUrl + "_length";
    var createnewsAddUrlMaxLength = createnewsAddUrl + "_max_length";

    // Error fields
    var createnewsAddNameEmpty = createnewsAddName + "_empty";
    var createnewsAddNameShort = createnewsAddName + "_short";
    var createnewsAddIdEmpty = createnewsAddId + "_empty";
    var createnewsAddIdTaken = createnewsAddId + "_taken";
    var createnewsAddIdShort = createnewsAddId + "_short";
    var errorFields = ".createnews_error_msg";

    // CSS Classes
    var invalidFieldClass = "invalid";

    // Pages to be added to the group
    var pagestemplate = "defaultgroup";

    ///////////////////////
    // Utility functions //
    ///////////////////////

    /**
     * Public function that can be called from elsewhere
     * (e.g. chat and sites widget)
     * It initializes the createnews widget and shows the jqmodal (ligthbox)
     */
    sakai.createnews.initialise = function(){
        $(".description_fields").show();
        $("#createnews_add_container").show();
        $(createnewsAddTemplate).show();
        $(createnewsAddName).val("");
        $(createnewsAddDescription).val("");
        $(createnewsAddId).val("");
        $(createnewsContainer).jqmShow();
    };

    /**
     * Show or hide the process div and hide/shows the buttons
     * @param {Boolean} show
     *     true: show the process div and hide the buttons
     *     false: hide the process div and show the buttons
     */
    var showProcess = function(show){
        if(show){
            $(createnewsAddCancel).hide();
            $(createnewsAddSave).hide();
            $(createnewsAddProcess).show();
        } else {
            $(createnewsAddProcess).hide();
            $(createnewsAddCancel).show();
            $(createnewsAddSave).show();
        }
    };

    /**
     * Replace or remove malicious characters from the string
     * We use this function to modify the groupid
     * String to test against: test :?=&;\/?@+$<>#%'"''{}|\\^[]'
     * @param {Object} input The string where the characters need to be replaced
     */
    var replaceCharacters = function(input){

        input = $.trim(input); // Remove the spaces at the beginning and end of the id

        input = input.toLowerCase().replace(/ /g,"-");
        input = input.toLowerCase().replace(/'/g,"");
        input = input.toLowerCase().replace(/"/g,"");

        var regexp = new RegExp("[^a-z0-9_-]", "gi");
        input = input.replace(regexp,"_");

        return input;
    };


    ////////////////////
    // Error handling //
    ////////////////////

    var resetErrorFields = function(){
        $("input").removeClass(invalidFieldClass);
        $("textarea").removeClass(invalidFieldClass);
        $(errorFields).hide();
    };

    /**
     * Function that will visually mark a form field as an
     * invalid field.
     * @param String field
     *  JQuery selector of the input box we want to show as invalid
     * @param String errorField
     *  JQuery selector of the error message that needs to be shown.
     * @param boolean noReset
     *  Parameter that specifies whether we need to make all of the
     *  fiels valid again first
     */
    var setError = function(field,errorField, noReset){
        if (!noReset) {
            resetErrorFields();
        }
        $(field).addClass(invalidFieldClass);
        $(errorField).show();
    };

    var myClose = function(hash) {
        resetErrorFields();
        hash.o.remove();
        hash.w.hide();
    };


    ///////////////////
    // Create a group //
    ///////////////////

    /**
     * Check if the group is created correctly and exists
     * @param {String} groupid
     */
    var doCheckGroup = function(groupid){
        // Check if the group exists.
        var groupExists = false;

        $.ajax({
            url: "/~" + groupid + ".json",
            type: "GET",
            async: false,
            success: function(data, textStatus){
                groupExists = true;
            }
        });
        return groupExists;
    };

    /**
     * Create the group.
     * @param {String} groupid the id of the group that's being created
     * @param {String} grouptitle the title of the group that's being created
     * @param {String} groupdescription the description of the group that's being created
     * @param {String} groupidManagers the id of the managers group for the group that's being created
    */
    var doSaveGroup = function(groupid, grouptitle, groupdescription){
    // Create a group with the managers group

        $.ajax({
            url: sakai.config.URL.GROUP_CREATE_SERVICE,
            data: {
                "_charset_":"utf-8",
                ":name": groupid,
                ":sakai:manager": sakai.data.me.user.userid,
                "sakai:group-title" : grouptitle,
                "sakai:group-description" : groupdescription,
                "sakai:group-id": groupid,
                "sakai:group-joinable": sakai.config.Permissions.Groups.joinable.manager_add,
                "sakai:group-visible": sakai.config.Permissions.Groups.visible.members,
                ":sakai:pages-template": "/var/templates/site/" + pagestemplate
            },
            type: "POST",
            success: function(data, textStatus){
                //check if the group exists
                if (doCheckGroup(groupid)) {
                    document.location = "/dev/group_edit.html?id=" + groupid;
                }
            },
            error: function(xhr, textStatus, thrownError){
                var groupCheck = doCheckGroup(groupid);
                if (groupCheck){
                    setError(createnewsAddId,createnewsAddIdTaken,true);
                } else {
                    fluid.log("An error has occurred: " + xhr.status + " " + xhr.statusText);
                }
                showProcess(false);
            }
        });
    };


    var saveGroup = function(){
        resetErrorFields();

        // Get the values from the input text and radio fields
        var grouptitle = $(createnewsAddName).val() || "";
        var groupdescription = $(createnewsAddDescription).val() || "";
        var groupid = replaceCharacters($(createnewsAddId).val());
        var inputError = false;

        // Check if there is a group id or group title defined
        if (grouptitle === "")
        {
            setError(createnewsAddName,createnewsAddNameEmpty,true);
            inputError = true;
        } else if (grouptitle.length < 3) {
            setError(createnewsAddName,createnewsAddNameShort,true);
            inputError = true;
        }
        if (!groupid)
        {
            setError(createnewsAddId,createnewsAddIdEmpty,true);
            inputError = true;
        } else if (groupid.length < 3) {
            setError(createnewsAddId,createnewsAddIdShort,true);
            inputError = true;
        }

        if (inputError)
        {
            return;
        }
        else
        {
            // Hide the buttons and show the process status
            showProcess(true);
            groupid = 'g-' + groupid;
            doSaveGroup(groupid, grouptitle, groupdescription);
        }
    };

    ////////////////////
    // Event Handlers //
    ////////////////////

    /*
     * Add jqModal functionality to the container.
     * This makes use of the jqModal (jQuery Modal) plugin that provides support
     * for lightboxes
     */
    $(createnewsContainer).jqm({
        modal: true,
        overlay: 20,
        toTop: true,
        onHide: myClose
    });

    /*
     * Add binding to the save button (create the group when you click on it)
     */
    $(createnewsAddSave).click(function(){
        saveGroup();
    });

    /*
     * When you change something in the name of the group, it first removes the bad characters
     * and then it shows the edited url in the span
     */
    $(createnewsAddName).bind("change", function(ev){
        var entered = replaceCharacters($(this).val());
        $(createnewsAddId).val(entered);
    });


    /////////////////////////////
    // Initialisation function //
    /////////////////////////////

    var doInit = function(){

        // Hide error fields at start
        $(errorFields).hide();

        // Set the text of the span containing the url of the current group
        // e.g. http://celestine.caret.local:8080/~g-
        var url = document.location.protocol + "//" + document.location.host;
        url += "/~g-";
        // get max length value
        var maxLength = parseInt(MAX_LENGTH,10);

        // get length

        // if url is too long greater than 30 character
        // show only first 15 characters +...+ last 15 characters
        // e.g.http://sakai3-demo.uits.indiana.edu:8080/~g-
        // it will change to shorter form:
        // http://sakai3-...diana.edu:8080/~g-
        if (url.length > maxLength) {
            url = url.substr(0,15)+ "..."+ url.substr(url.length-15,url.length-1);
        }

        $(createnewsAddUrl).text(sakai.api.Security.saneHTML(url));
    };

    doInit();
};

sakai.api.Widgets.widgetLoader.informOnLoad("createnews");