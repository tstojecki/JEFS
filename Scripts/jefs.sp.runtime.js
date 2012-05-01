(function (jefs, $, window) {

    $(function () {

        var item,
            sourceUrl = window.location.pathname;

        if (typeof window._spPageContextInfo == "undefined") {
            jefs.log("_spPageContextInfo unavailable (sharepoint global variable missing). JEFS will not run scripts without this mandatory parameter.");
        }
        else {
            $ = jefs.$ = jQuery.noConflict(true);

            jefs.config.siteCollectionUrl = window._spPageContextInfo.siteServerRelativeUrl;
            if (!jefs.config.siteCollectionUrl.match(/\/$/))
                jefs.config.siteCollectionUrl = jefs.config.siteCollectionUrl + "/";

            item = jefs
                .item
                .get(sourceUrl);

            $("head")
                .jefs()
                .load(item);
        }

        jefs.editor = {};
        jefs.editor.launch = function () {

            if (jefs.config.isValid()) {
                window.location.href = jefs.config.siteCollectionUrl + "lists/jefs/jefs.aspx?source=" + sourceUrl + "&scu=" + jefs.config.siteCollectionUrl;
            }
            else {
                jefs.log("JEFS: could not get site collection url.");
            }
        }

    })

})(this.jefs = this.jefs, jQuery, window);

