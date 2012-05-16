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
                jefs.publish("jefs/content/save");
            });

            $saveClose.on("click", function () {
                jefs.publish("jefs/content/save");
            });

            $views.on("change", function () {
                var val = $(this).attr("value");

                jefs.publish("jefs/views/change", [val]);
            });

            jefs.subscribe("jefs/settings/ready", function (settings) {
                $.each(settings.libraries, function (idx, item) {
                    $lib.append($("<option>", { value: item.url }).text(item.name));
                });
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


            jefs.subscribe("jefs/zones/ready", function (zones) {

                $.each(zones, function (idx, item) {
                    $zones.append($("<option>", { value: item }).text(item));
                });

                if (zones && zones.length > 0) {
                    $zones.removeAttr("disabled");

                    if (!jefs.item.webPartId) {
                        // show this only if the web part hasn't been added yet
                        jefs.status({ text: "Retrieved " + zones.length + " web part zone(s). Selecting a zone will save the html as the content editor webpart.", layout: "topRight" });
                    }
                    else {
                        if (jefs.item.webPartZone) {
                            $zones.val(jefs.item.webPartZone);
                            jefs.editor.webPartZone = jefs.item.webPartZone;
                        }
                    }
                }
                else {
                    jefs.status({ text: "No web part zones have been identified for this url. You can still append the html content stored in jefs.item.html using javascript." });
                }

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

