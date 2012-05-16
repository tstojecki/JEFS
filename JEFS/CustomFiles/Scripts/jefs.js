(function (jefs, $) {

    jefs.config = {
        siteCollectionUrl: null,
        isValid: function () {
            return this.siteCollectionUrl !== null;
        }
    }

    // utility functions
    // log errors 
    jefs.log = function () {
        if (typeof console !== "undefined" && typeof console.log !== "undefined") {
            console.log(arguments);
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
                jefs.publish("jefs/error", [e]);
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

                jefs.publish("jefs/content/loaded", [jefs.item]);
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
                    jefs.publish("jefs/content/saved", that);
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
                        jefs.publish("jefs/content/saved", that);
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

(function (jefs, $, lab) {

    jefs.plugin("load", function (options) {

        var that = this,
            jsfiles = [],
            opt = $.extend(opt, options);

        // css first, for now will not block until it is loaded
        // will see if timing becomes an issue here
        if (opt.css) {
            // ie 'friendly' technique
            that.append(createStyleTag(opt.css));
        }

        if (opt.lib) {
            $(opt.lib).filter("script").each(function () {
                jsfiles.push($(this).attr("src"));
            });
        }

        if (jsfiles.length > 0) {
            lab.script(jsfiles).wait(function () {
                // wait for all the dependencies to load before loading main
                if (opt.js)                
                    lab.script(jefs.config.siteCollectionUrl + "lists/jefs/attachments/" + opt.id + "/jefs-my.js");
            });
        }
        else {
            if (opt.js) {                
                lab.script(jefs.config.siteCollectionUrl + "lists/jefs/attachments/" + opt.id + "/jefs-my.js");
            }
        }

        function createStyleTag(style) {            
            return '<style type="text/css">' + style + '</style>';
        }
    });

})(this.jefs, jQuery, $LAB);

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

