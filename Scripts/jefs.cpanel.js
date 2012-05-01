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

