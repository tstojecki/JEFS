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

        if (("scu" in query) && ("source" in query)) {

            jefs.config.siteCollectionUrl = query.scu;

            this.sourceUrl = query.source;
            this.sourceAbsUrl = window.location.protocol + "//" + window.location.hostname
                + slash(jefs.config.siteCollectionUrl, true)
                + slash(this.sourceUrl, false);

            this.validConfig = true;

            this._getSettings();
        }
        else {
            jefs.log("One of the required query string parameters is missing. Parameters: scu=" + query["scu"] + "&source=" + query["source"]);
        }

        return this;

        function slash(s, trim) {
            if (s.substring(0, 1) === "/")
                return trim ? "" : s;

            return "/" + s;
        }
    }

    editor.showError = function () {
        jefs.status("An errror occured while executing this action, see the browser's console for details.", "error", false);
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

                jefs.publish("jefs/settings/ready");
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

        // handle editor's events

        jefs.subscribe("jefs/save", function (close) {
            jefs.status("Saving content, please wait...", "information");

            jefs.editor.close = close;

            jefs.item.js = jefs.editors.js.getValue();
            jefs.item[jefs.editor.htmlView] = jefs.editors.html.getValue();
            jefs.item.save(jefs.editor.sourceUrl);
        });

        jefs.subscribe("jefs/error", function () {
            jefs.editor.close = false;
            jefs.editor.showError();
        });

        jefs.subscribe("jefs/item/saved", function () {
            var statusText = "Content saved. <br />";

            if (jefs.editor.zone && jefs.editor.zone.toLowerCase() !== "none") {

                // web part already on the page, see if zone changed
                if (jefs.item.webPartId) {
                    if (jefs.editor.zone !== jefs.item.webPartZone) {
                        statusText += "The content editor web part will be moved to a new zone.";
                        jefs.sp.saveWebPart(
                            jefs.editor.sourceUrl,
                            jefs.item.webPartId,
                            jefs.config.siteCollectionUrl + "lists/jefs/attachments/" + jefs.item.id + "/jefs-my.txt",
                            jefs.editor.zone);
                    }
                    else {
                        tryClose();
                    }
                }
                else {
                    statusText += "The content editor web part will be added to the page.";

                    jefs.sp.addWebPart(
                        jefs.editor.sourceUrl,
                        jefs.editor.zone,
                        jefs.config.siteCollectionUrl + "lists/jefs/attachments/" + jefs.item.id + "/jefs-my.txt"
                    );
                }
            }
            else {
                if (jefs.item.webPartId) {
                    statusText += "The content editor web part will be removed from the page.";
                    jefs.sp.deleteWebPart(jefs.editor.sourceUrl, jefs.item.webPartId);
                }
                else {                    
                    tryClose();
                }
            }

            jefs.status(statusText, "information");

            function tryClose() {
                if (jefs.editor.close) {                    
                    window.location.href = jefs.editor.sourceUrl;
                }
            }

        });

        jefs.subscribe("jefs/webparts/deleted", function () {
            jefs.item.webPartId = jefs.item.webPartZone = "";            
            jefs.item.save(jefs.editor.sourceUrl);
        });

        jefs.subscribe("jefs/webparts/added", function (d) {
            var result = $(d).find("*").filter("addwebpartresult");
            if (result.length > 0) {
                jefs.item.webPartId = result.text();
                jefs.item.webPartZone = jefs.editor.zone;
                
                jefs.item.save(jefs.editor.sourceUrl);
            }
        });

        jefs.subscribe("jefs/webparts/saved", function (d) {            
            jefs.item.webPartZone = jefs.editor.zone;
        });

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

        jefs.subscribe("jefs/settings/ready", function () {
            var $sel = $("#jefs-libraries");
            $.each(jefs.editor.libraries, function (idx, item) {
                $sel.append($("<option>", { value: item.url }).text(item.name));
            });
        });

        jefs.subscribe("jefs/zones/ready", function (zones) {
            var $sel = $("#jefs-zones");
            $.each(zones, function (idx, item) {
                $sel.append($("<option>", { value: item }).text(item));
            });

            if (zones && zones.length > 0) {
                $sel.removeAttr("disabled");

                if (!jefs.item.webPartId) {
                    // show this only if the web part hasn't been added yet
                    jefs.status("Retrieved " + zones.length + " web part zone(s). Selecting a zone will save the html as the content editor webpart.",
                       "information");
                }
                else {
                    if (jefs.item.webPartZone) {
                        $sel.val(jefs.item.webPartZone);
                        jefs.editor.webPartZone = jefs.item.webPartZone;
                    }
                }
            }
            else {
                jefs.status("No web part zones have been identified for this url. You can still append the html content stored in jefs.item.html using javascript.",
                    "information");
            }

        });

        jefs.sp.getPageZones(this.sourceUrl);

    }

    jefs.editor = editor;

})(this.jefs, jQuery, window);

