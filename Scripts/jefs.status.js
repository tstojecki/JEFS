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

