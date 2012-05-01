(function (jefs, $) {

    jefs.config = {
        siteCollectionUrl: null,
        isValid: function () {
            return this.siteCollectionUrl !== null;
        }
    }

    // utility functions
    // log errors 
    jefs.log = function (args) {
        if (typeof console !== "undefined" && typeof console.log !== "undefined") {
            console.log(args);
        }
    }

    jefs.parseQuery = function (query) {
        var urlParams = {},
            e,
            a = /\+/g,  // Regex for replacing addition symbol with a space
            r = /([^&=]+)=?([^&]*)/g,
            d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
            q = window.location.search.substring(1);

        while (e = r.exec(q))
            urlParams[d(e[1])] = d(e[2]);

        return urlParams;
    }

    // plugin utility 
    $.fn.jefs = function () {
        var name,
            methods = $.fn.jefs.methods;

        for (name in methods) {
            if (methods.hasOwnProperty(name) && typeof methods[name] == "function") {
                this[name] = methods[name];
            }
        }

        return this; // returns jQuery modified object
    }
    $.fn.jefs.methods = {};

    jefs.plugin = function (name, method) {
        if (typeof method == "function") {
            $.fn.jefs.methods[name] = method;
        }
    }

    /**
    CREDITS: http://blogs.sitepointstatic.com/examples/tech/json-serialization/json-serialization.js
    **/

    jefs.stringify = function stringify(obj) {
        var t = typeof (obj);
        if (t != "object" || obj === null) {
            // simple data type
            if (t == "string") obj = '"' + obj + '"';
            return String(obj);
        } else {
            // recurse array or object
            var n, v, json = [], arr = (obj && obj.constructor == Array);

            for (n in obj) {
                v = obj[n];
                t = typeof (v);
                if (obj.hasOwnProperty(n)) {
                    if (t == "string") v = '"' + v + '"'; else if (t == "object" && v !== null) v = jQuery.stringify(v);
                    json.push((arr ? "" : '"' + n + '":') + String(v));
                }
            }
            return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
        }
    }

    /*	

    jQuery pub/sub plugin by Peter Higgins (dante@dojotoolkit.org)

    Loosely based on Dojo publish/subscribe API, limited in scope. Rewritten blindly.

    Original is (c) Dojo Foundation 2004-2010. Released under either AFL or new BSD, see:
    http://dojofoundation.org/license for more information.

    JEFS: Modified to store the methods on the jefs object to avoid namespace collisions

    */

    // the topic/subscription hash
    var cache = {};

    jefs.publish = function (/* String */topic, /* Array? */args) {
        // summary: 
        //		Publish some data on a named topic.
        // topic: String
        //		The channel to publish on
        // args: Array?
        //		The data to publish. Each array item is converted into an ordered
        //		arguments on the subscribed functions. 
        //
        // example:
        //		Publish stuff on '/some/topic'. Anything subscribed will be called
        //		with a function signature like: function(a,b,c){ ... }
        //
        //	|		jefs.publish("/some/topic", ["a","b","c"]);        
        cache[topic] && $.each(cache[topic], function () {

            try {
                this.apply(this, args || []);
            } catch (e) {
                jefs.log("Callback error. Topic: " + topic, "Error details: " + e);
                if (typeof jefs.errorNoty != "undefined") 
                    jefs.errorNoty();
            }
        });
    };

    jefs.subscribe = function (/* String */topic, /* Function */callback) {
        // summary:
        //		Register a callback on a named topic.
        // topic: String
        //		The channel to subscribe to
        // callback: Function
        //		The handler event. Anytime something is $.publish'ed on a 
        //		subscribed channel, the callback will be called with the
        //		published array as ordered arguments.
        //
        // returns: Array
        //		A handle which can be used to unsubscribe this particular subscription.
        //	
        // example:
        //	|	jefs.subscribe("/some/topic", function(a, b, c){ /* handle data */ });

        if (!cache[topic]) {
            cache[topic] = [];
        }
        cache[topic].push(callback);
        return [topic, callback]; // Array
    };

    jefs.unsubscribe = function (/* Array */handle) {
        // summary:
        //		Disconnect a subscribed function for a topic.
        // handle: Array
        //		The return value from a $.subscribe call.
        // example:
        //	|	var handle = $.subscribe("/something", function(){});
        //	|	jefs.unsubscribe(handle);

        var t = handle[0];
        cache[t] && $.each(cache[t], function (idx) {
            if (this == handle[1]) {
                cache[t].splice(idx, 1);
            }
        });
    };


})(this.jefs = this.jefs || {}, jQuery);

(function (jefs, $) {

    jefs.status = function (text, type, timeout) {

        var id = this["noty-" + type];
        if (typeof id != "undefined") {
            $.noty.setText(id, text);
        }

        if (typeof timeout == "undefined") timeout = 5000;

        this["noty-" + type] = noty({ text: text, type: type, theme: "noty_theme_twitter", layout: "topRight", closeButton: true, timeout: timeout });
    }    

})(this.jefs, jQuery);

(function (jefs, $) {

    // get and save sp content
    jefs.item = {

        id: 0,
        siteCollectionUrl: "",
        js: "",
        html: "",
        css: "",
        lib: "",
        webPartId: "",
        webPartZone: "",

        init: function (d) {

            if (d != null) {
                this.js = d.js;
                this.html = d.html;
                this.css = d.css;
                this.lib = d.lib;
            }

            return this;
        },

        get: function (url) {

            // using REST api as of v2.0 
            var dataUrl = jefs.config.siteCollectionUrl + "_vti_bin/listdata.svc/JEFS()?$filter=Title eq '" + url + "'&$top=1",
                that = this;

            $.ajax({
                url: dataUrl,
                dataType: "json",
                async: false
            })
            .done(function (data) {
                var items = data.d,
                    item;

                if (items.length > 0) {
                    item = items[0];
                    that.id = item.Id;
                    that.js = item.JS || that.js;
                    that.html = item.HTML || that.html;
                    that.css = item.CSS || that.css;
                    that.lib = item.LIB || that.lib;
                    that.webPartId = item.WebPartID || that.webPartId;
                    that.webPartZone = item.WebPartZone || that.webPartZone;
                }

                jefs.publish("jefs/item/loaded", [jefs.item]);
            })
            .error(function (jqXHR, status, err) {
                jefs.log("JEFS encountered an error while retrieving content. Make sure the list exists at the top of the site collection and that you have enough permissions to access it.");
                jefs.log(err);

                jefs.publish("jefs/error", [err]);
            });

            return this;
        },

        toJson: function (url) {
            var o = {
                "Title": url,
                "JS": quote(this.js),
                "HTML": quote(this.html),
                "CSS": quote(this.css),
                "LIB": quote(this.lib),
                "WebPartID": this.webPartId,
                "WebPartZone": this.webPartZone
            };

            return jefs.stringify(o);

            function quote(str) {
                return str.replace(/[\"]/g, '\\\"');
            };
        },

        add: function (url) {
            var that = this;

            $.ajax({
                type: "POST",
                url: jefs.config.siteCollectionUrl + "_vti_bin/listdata.svc/JEFS",
                contentType: "application/json",
                processData: false,
                data: this.toJson(url)
            })
            .done(function (doc) {
                var $id = $(doc).find("*").filter("d\\:id");
                if ($id.length > 0) {
                    that.id = parseInt($id.text());
                    jefs.publish("jefs/item/saved", that);
                }
            })
            .error(function (jqXHR, status, err) {
                jefs.log("JEFS ecountered an error while adding content to the list.");
                jefs.log(err);

                jefs.publish("jefs/error", [err]);
            });

        },

        save: function (url) {
            var that = this;

            if (this.id == 0) {
                this.add(url);
            }
            else {
                $.ajax({
                    type: "POST",
                    url: jefs.config.siteCollectionUrl + "_vti_bin/listdata.svc/JEFS(" + this.id + ")",
                    contentType: "application/json; charset=utf-8",
                    processData: false,
                    beforeSend: beforeSendFunction,
                    data: this.toJson(url),
                    dataType: "json",
                    success: function () {
                        jefs.publish("jefs/item/saved", that);
                    },
                    error: function (jqXHR, status, err) {
                        jefs.log("JEFS ecountered an error while saving content to the list.");
                        jefs.log(err);

                        jefs.publish("jefs/error", [err]);
                    }
                });
            }

            function beforeSendFunction(xhr) {
                xhr.setRequestHeader("If-Match", "*");
                // Using MERGE so that the entire entity doesn't need to be sent over the wire.
                xhr.setRequestHeader("X-HTTP-Method", "MERGE");
            }
        }
    };

})(this.jefs, jQuery);

(function (jefs, $) {

    jefs.sp = {

        getPageZones: function (url) {
            var env = '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetWebPartPage xmlns="http://microsoft.com/sharepoint/webpartpages"><documentName>' + url + '</documentName><behavior>Version3</behavior></GetWebPartPage></soap:Body></soap:Envelope>';

            $.ajax({
                url: jefs.config.siteCollectionUrl + '_vti_bin/webpartpages.asmx',
                type: 'POST',
                contentType: 'text/xml;charset="utf-8"',
                dataType: 'xml',
                data: env
            })
            .done(function (d) {
                var e = document.createElement("div"),
                    zones = [];

                e.innerHTML = $(d).find("*").filter("getwebpartpageresult").text();

                $.each(e.getElementsByTagName("WebPartPages:WebPartZone"), function () {
                    zones.push($(this).attr("id"));
                });

                jefs.publish("jefs/zones/ready", [zones]);
            })
            .error(function (jqXHR, status, err) {
                jefs.log("Could not retrieve the zones in the page you're editing");
                jefs.log(err);
            });
        },

        addWebPart: function (pageUrl, zone, contentUrl) {
            var wpXml = '&lt;?xml version=&quot;1.0&quot; encoding=&quot;utf-16&quot;?&gt;&lt;WebPart xmlns:xsd=&quot;http://www.w3.org/2001/XMLSchema&quot; xmlns:xsi=&quot;http://www.w3.org/2001/XMLSchema-instance&quot; xmlns=&quot;http://schemas.microsoft.com/WebPart/v2&quot;&gt;&lt;Title&gt;JEFS Content Editor Web Part&lt;/Title&gt;&lt;FrameType&gt;None&lt;/FrameType&gt;&lt;Description&gt;JEFS HTML Content&lt;/Description&gt;&lt;IsIncluded&gt;true&lt;/IsIncluded&gt;&lt;ZoneID&gt;' + zone + '&lt;/ZoneID&gt;&lt;PartOrder&gt;0&lt;/PartOrder&gt;&lt;FrameState&gt;Normal&lt;/FrameState&gt;&lt;Height /&gt;&lt;Width /&gt;&lt;AllowRemove&gt;true&lt;/AllowRemove&gt;&lt;AllowZoneChange&gt;true&lt;/AllowZoneChange&gt;&lt;AllowMinimize&gt;true&lt;/AllowMinimize&gt;&lt;IsVisible&gt;true&lt;/IsVisible&gt;&lt;DetailLink /&gt;&lt;HelpLink /&gt;&lt;Dir&gt;Default&lt;/Dir&gt;&lt;PartImageSmall /&gt;&lt;MissingAssembly /&gt;&lt;PartImageLarge&gt;/_layouts/images/mscontl.gif&lt;/PartImageLarge&gt;&lt;IsIncludedFilter /&gt;&lt;Assembly&gt;Microsoft.SharePoint, Version=12.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c&lt;/Assembly&gt;&lt;TypeName&gt;Microsoft.SharePoint.WebPartPages.ContentEditorWebPart&lt;/TypeName&gt;&lt;ContentLink xmlns=&quot;http://schemas.microsoft.com/WebPart/v2/ContentEditor&quot;&gt;' + contentUrl + '&lt;/ContentLink&gt;&lt;Content xmlns=&quot;http://schemas.microsoft.com/WebPart/v2/ContentEditor&quot;&gt;&lt;/Content&gt;&lt;PartStorage xmlns=&quot;http://schemas.microsoft.com/WebPart/v2/ContentEditor&quot; /&gt;&lt;/WebPart&gt;',
                env = '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><AddWebPart xmlns="http://microsoft.com/sharepoint/webpartpages"><pageUrl>' + pageUrl + '</pageUrl><webPartXml>' + wpXml + '</webPartXml><storage>Shared</storage></AddWebPart></soap:Body></soap:Envelope>';

            this.postWebPartPageWebService(
                env,
                "http://microsoft.com/sharepoint/webpartpages/AddWebPart",
                "jefs/webparts/added",
                "Could not add the content editor web part to: " + pageUrl
            );
        },

        saveWebPart: function (pageUrl, wpKey, contentUrl, zone) {
            var wpXml = '&lt;?xml version=&quot;1.0&quot; encoding=&quot;utf-16&quot;?&gt;&lt;WebPart xmlns:xsd=&quot;http://www.w3.org/2001/XMLSchema&quot; xmlns:xsi=&quot;http://www.w3.org/2001/XMLSchema-instance&quot; xmlns=&quot;http://schemas.microsoft.com/WebPart/v2&quot;&gt;&lt;Title&gt;JEFS Content Editor Web Part&lt;/Title&gt;&lt;FrameType&gt;None&lt;/FrameType&gt;&lt;Description&gt;JEFS HTML Content&lt;/Description&gt;&lt;IsIncluded&gt;true&lt;/IsIncluded&gt;&lt;ZoneID&gt;' + zone + '&lt;/ZoneID&gt;&lt;PartOrder&gt;0&lt;/PartOrder&gt;&lt;FrameState&gt;Normal&lt;/FrameState&gt;&lt;Height /&gt;&lt;Width /&gt;&lt;AllowRemove&gt;true&lt;/AllowRemove&gt;&lt;AllowZoneChange&gt;true&lt;/AllowZoneChange&gt;&lt;AllowMinimize&gt;true&lt;/AllowMinimize&gt;&lt;IsVisible&gt;true&lt;/IsVisible&gt;&lt;DetailLink /&gt;&lt;HelpLink /&gt;&lt;Dir&gt;Default&lt;/Dir&gt;&lt;PartImageSmall /&gt;&lt;MissingAssembly /&gt;&lt;PartImageLarge&gt;/_layouts/images/mscontl.gif&lt;/PartImageLarge&gt;&lt;IsIncludedFilter /&gt;&lt;Assembly&gt;Microsoft.SharePoint, Version=12.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c&lt;/Assembly&gt;&lt;TypeName&gt;Microsoft.SharePoint.WebPartPages.ContentEditorWebPart&lt;/TypeName&gt;&lt;ContentLink xmlns=&quot;http://schemas.microsoft.com/WebPart/v2/ContentEditor&quot;&gt;' + contentUrl + '&lt;/ContentLink&gt;&lt;Content xmlns=&quot;http://schemas.microsoft.com/WebPart/v2/ContentEditor&quot;&gt;&lt;/Content&gt;&lt;PartStorage xmlns=&quot;http://schemas.microsoft.com/WebPart/v2/ContentEditor&quot; /&gt;&lt;/WebPart&gt;',
                env = '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><AddWebPart xmlns="http://microsoft.com/sharepoint/webpartpages"><pageUrl>' + pageUrl + '</pageUrl><webPartXml>' + wpXml + '</webPartXml><storage>Shared</storage></AddWebPart></soap:Body></soap:Envelope>';

            this.postWebPartPageWebService(
                env,
                "http://microsoft.com/sharepoint/webpartpages/SaveWebPart",
                "jefs/webparts/saved",
                "Could not update the content editor web part on: " + pageUrl
            );
        },

        deleteWebPart: function (pageUrl, wpKey) {
            var env = '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><DeleteWebPart xmlns="http://microsoft.com/sharepoint/webpartpages"><pageUrl>' + pageUrl + '</pageUrl><storageKey>' + wpKey + '</storageKey><storage>Shared</storage></DeleteWebPart></soap:Body></soap:Envelope>'

            this.postWebPartPageWebService(
                env,
                "http://microsoft.com/sharepoint/webpartpages/DeleteWebPart",
                "jefs/webparts/deleted",
                "Could not delete the content editor web part on: " + pageUrl
            );
        },

        postWebPartPageWebService: function (env, soapActionValue, successPubEventName, errorMessage) {
            $.ajax({
                url: jefs.config.siteCollectionUrl + '_vti_bin/webpartpages.asmx',
                type: 'POST',
                contentType: 'text/xml;charset="utf-8"',
                dataType: 'xml',
                data: env,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('SOAPAction', soapActionValue);
                }
            })
            .done(function (d) {
                jefs.publish(successPubEventName, [d]);
            })
            .error(function (jqXHR, status, err) {
                jefs.log(errorMessage, err);                
                jefs.publish("jefs/error", err);
            });
        }

    }

})(this.jefs, jQuery);

(function (jefs, $, CodeMirror) {

    // store each editor for reference
    jefs.editors = {
        add: function (name, cm) {
            this[name] = cm;
        }        
    }

    jefs.plugin("editor", function (options) {

        var elem = this.get(0),
            editor,
            opt = $.extend(opt, options);

        editor = CodeMirror(
            function (elt) {
                elem.parentNode.replaceChild(elt, elem);
            },
            opt.options);

        jefs.editors.add(opt.name, editor);

        // resize to stretch across the parent element
        // TODO: see if this can be done with css
        $(jefs.editors[opt.name].getScrollerElement()).css("height", $(".jefs-" + opt.name).height() + "px");
    });



})(this.jefs, jQuery, CodeMirror);

(function (jefs, $) {

    jefs.plugin("cpanel", function (options) {

        var $save, $views, $lib, opt = {};
        opt = $.extend(opt, options);

        $save = this.find("#jefs-save");
        $saveClose = this.find("#jefs-save-close");
        $views = this.find("#jefs-views");
        $lib = this.find("#jefs-libraries");
        $zones = this.find("#jefs-zones");
        $source = this.find("#jefs-cpanel-source");

        if (jefs.config.isValid() && jefs.editor.validConfig) {
            $source.append($("<a>").attr({ href: jefs.editor.sourceUrl, target: "_blank" }).html(jefs.editor.sourceAbsUrl));

            $save.on("click", function () {
                jefs.publish("jefs/save", [false]);                
            });

            $saveClose.on("click", function () {
                jefs.publish("jefs/save", [true]);                
            });

            $views.on("change", function () {
                var val = $(this).attr("value");

                jefs.publish("jefs/views/change", [val]);
            });

            $lib.on("change", function () {

                var val = $(this).attr("value");

                // switch to lib view
                if ($views.val() !== "lib") {
                    $views.val("lib").trigger("change");
                }

                if (val !== "none")
                    jefs.publish("jefs/libs/change", [val]);
            });

            $zones.on("change", function () {
                jefs.editor.zone = $(this).attr("value");
            });
        }
        else {
            $source.html($source.html() + "<span class='jefs-red'>Missing configuration settings, check the console in your browser for details.</span>");
            $save.attr("disabled", "disabled");
        }
    });


})(this.jefs, jQuery);

// courtesy of: jsbin, see http://jsbin.com
// github repo: https://github.com/remy/jsbin

(function (jefs, $) {

    jefs.plugin("splitter", function (options) {

        var $document = $(document),
            $blocker = $('<div class="jefs-block"></div>'),
            settings = {};

        return this.each(function () {
            var $el = $(this),                
                $parent = $el.parent(),
                $prev = $el.prev(),                
                $handle = $('<div class="jefs-resize"></div>'),
                dragging = false,
                width = $parent.width(),
                left = $parent.offset().left,
                refreshTimer = null;            

            function moveSplitter(posX) {
                var i = 0,
                    x = posX - left,
                    split = 100 / width * x;

                if (split > 10 && split < 90) {
                    $el.css('left', split + '%');
                    $prev.css('right', (100 - split) + '%');
                    $handle.css({
                        left: split + '%'
                    });
                    settings.x = posX;
                    clearTimeout(refreshTimer);
                    refreshTimer = setTimeout(function () {
                        // refresh the editors left and right
                        jefs.editors.js.refresh();
                        jefs.editors.html.refresh();
                    }, 100);
                }
            }

            $document.bind('mouseup', function () {
                dragging = false;
                $blocker.remove();
                $handle.css('opacity', '0');
            }).bind('mousemove', function (event) {
                if (dragging) {
                    moveSplitter(event.pageX);
                }
            });

            $blocker.bind('mousemove', function (event) {
                if (dragging) {
                    moveSplitter(event.pageX);
                }
            });

            $handle.bind('mousedown', function (e) {
                dragging = true;
                $('body').append($blocker);

                // blockiframe.contentDocument.write('<title></title><p></p>');

                // TODO layer on div to block iframes from stealing focus
                width = $parent.width();
                left = $parent.offset().left;
                e.preventDefault();
            }).hover(function () {
                $handle.css('opacity', '1');
            }, function () {
                if (!dragging) {
                    $handle.css('opacity', '0');
                }
            });

            function init(event, x) {
                $handle.css({
                    top: 0,
                    // left: (100 / width * $el.offset().left) + '%',
                    bottom: 0,
                    width: 4,
                    opacity: 0,
                    position: 'absolute',
                    'border-left': '1px solid rgba(218, 218, 218, 0.5)',
                    'z-index': 99999
                });

                if ($el.is(':hidden')) {
                    $handle.hide();
                } else {
                    moveSplitter(x || $el.offset().left);
                }
            }

            init(settings.x || $el.offset().left);

            $prev.css('width', 'auto');
            $el.data('splitter', $handle);
            $el.before($handle);
        });
    });

})(this.jefs, jQuery);

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
                    statusText += ". Redirecting back to the page...";
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

(function (jefs, $, window) {

    $(function () {

        var item, editor;

        editor = jefs.editor.init(window);

        if (editor.validConfig) {
            item = jefs.item.init({
                js: "// javascript code",
                html: "<!-- html code -->",
                css: ".bold { font-weight: bold; }",
                lib: "<!-- jefs libraries - loaded before the main script runs -->"
            })
            .get(jefs.editor.sourceUrl);
        }

        jefs.editor.run();        
    })

})(this.jefs, jQuery, window);

