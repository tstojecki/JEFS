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

