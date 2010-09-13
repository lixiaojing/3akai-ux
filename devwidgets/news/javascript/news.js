var sakai = sakai || {};

/**
 * @name sakai.news
 *
 * @class news
 *
 * @description
 * List the news in this widget
 *
 * @version 0.0.1
 * @param {String} tuid Unique id of the widget
 * @param {Boolean} showSettings Show the settings of the widget or not
 */
sakai.news = function(tuid, showSettings){
    var $newsList = $("#news_list");
    var $newsListTemplate = $("#news_list_template");
    
    var loadData = function(){
        $.ajax({
            url: "/devwidgets/news/data/news.json",
            type: "GET",
            success: function(data){
                $newsList.html($.TemplateRenderer($newsListTemplate, data));
                $newsList.show();
            },
            error: function(){
                
            }
        });
    };
    
    var init = function(){
        loadData();
    };
    
    init();
};

sakai.api.Widgets.widgetLoader.informOnLoad("news");