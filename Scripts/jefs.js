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

