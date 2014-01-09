(function (jefs, $, window) {

    var editor = {
        sourceUrl: null,
        sourceAbsUrl: null,
        split: 50,
        wrap_js: true,
        wrap_html: true,
        libraries: [],
        htmlView: "html",
        zone: "none",
        validConfig: false,
        close: false
    };

    editor.init = function (window) {
        var query = jefs.parseQuery(window.location.search.substring(1));

        if (("scu" in query) && ("source" in query) && ("wru" in query)) {

            jefs.config.siteCollectionUrl = query.scu;
            jefs.config.webRelativeUrl = query.wru || "";

            if (jefs.config.webRelativeUrl.substring(0, 1) === "/")
                jefs.config.webRelativeUrl = jefs.config.webRelativeUrl.substring(1);

            if (jefs.config.webRelativeUrl.length > 1 && jefs.config.webRelativeUrl.substring(jefs.config.webRelativeUrl.length - 1, jefs.config.webRelativeUrl.length) !== "/")
                jefs.config.webRelativeUrl = jefs.config.webRelativeUrl + "/";

            this.sourceUrl = query.source;
            this.sourceAbsUrl = window.location.protocol + "//" + window.location.hostname
                + slash(jefs.config.siteCollectionUrl, true)
                + slash(this.sourceUrl, false);

            this.validConfig = true;

            this._getSettings();
        }
        else {
            jefs.log("One of the required query string parameters is missing. Parameters: scu=" + query["scu"] + "&source=" + query["source"] + "&wru=" + query["wru"]);
        }

        return this;

        function slash(s, trim) {
            if (s.substring(0, 1) === "/")
                return trim ? "" : s;

            return "/" + s;
        }
    }

    editor.showError = function () {
        jefs.status({ text: "An errror occured while executing this action, see the browser's console for details.", type: "error", timeout: false });
    }

    editor._getSettings = function () {
        var that = this;

        $.ajax({
            url: jefs.config.siteCollectionUrl + "lists/jefs/settings.txt",
            dataType: "text"
        })
        .done(function (data) {
            var obj;
            try {
                obj = JSON.parse ? JSON.parse(data) : $.parseJSON(data);
                that.wrap_js = obj.settings.wrap_js;
                that.wrap_html = obj.settings.wrap_html;
                that.libraries = obj.libraries;

                jefs.publish("jefs/settings/ready", [obj]);
            }
            catch (e) {
                jefs.log("The method jefs.config.get() failed to parse the settings. Make sure the settings.txt file is valid.");
                jefs.showError();
            }
        })
        .fail(function (jqXHR, textStatus, error) {
            jefs.log("The ajax call to get the settings including libraries failed with the following error: " + error.toString());
        });
    }

    editor.run = function () {
        $("#jefs-jseditor")
                .jefs()
                .editor({
                    name: "js",
                    options: {
                        value: jefs.item.js,
                        mode: "javascript",
                        lineNumbers: true,
                        theme: "default"
                    }
                });

        $("#jefs-htmleditor")
                .jefs()
                .editor({
                    name: "html",
                    options: {
                        value: jefs.item.html,
                        mode: "text/html",
                        lineNumbers: true,
                        theme: "default"
                    }
                });

        $(window).resize(function () {
            $(jefs.editors.js.getScrollerElement()).css("height", $(".jefs-js").height() + "px");
            $(jefs.editors.html.getScrollerElement()).css("height", $(".jefs-html").height() + "px");
        });

        $("#jefs-cpanel")
                .jefs()
                .cpanel();

        $("#jefs-editors .jefs-html")
                .jefs()
                .splitter()
                .data("splitter");

        // handle events in the editor or delegate to the manager objects
        jefs.subscribe("jefs/error", function () {
            jefs.editor.close = false;
            jefs.editor.showError();
        });

        jefs.em.content.init();
        jefs.em.webparts.init();

        jefs.subscribe("jefs/views/change", function (value) {

            // store current view's content
            jefs.item[jefs.editor.htmlView] = jefs.editors.html.getValue();

            jefs.editors.html.setValue(jefs.item[value]);
            jefs.editors.html.setOption("mode", "text/" + (value === "css" ? value : "html"));
            jefs.editors.html.setOption("lineWrapping", (value === "lib" ? true : false));

            jefs.editors.html.refresh();

            jefs.editor.htmlView = value;
        });

        jefs.subscribe("jefs/libs/change", function (url) {
            var tag = '<script class="jefs" type="text/javascript" src="' + url + '"></' + 'script>';

            if (!jefs.item.lib.match(tag)) {
                jefs.item.lib += "\n" + tag;
                jefs.editors.html.setValue(jefs.item.lib);
            }
        });

        jefs.sp.getPageZones(this.sourceUrl);

    }

    jefs.editor = editor;

})(this.jefs, jQuery, window);

