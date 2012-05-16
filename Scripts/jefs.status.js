(function (jefs, $, noty) {

    jefs.status = function (opt) {

        // id, text, type, timeout, append
        var $nel,
            o = {},
            defaults = {
                id: 0,
                text: "",
                type: "information",
                layout: "top",
                timeout: 5000,
                append: false
            };

        o = $.extend(defaults, opt);

        if (o.id) {

            if (o.append) {
                $nel = $.noty.get(o.id);
                if ($nel.length > 0) {
                    o.text = $nel.find('.noty_text').html() + o.text;
                }
            }
            // use with sticky notifications only
            $.noty.setText(o.id, o.text, o.timeout);
            return o.id;
        }
        else {
            return noty({ text: o.text, type: o.type, theme: "noty_theme_twitter", layout: o.layout, closeButton: true, timeout: o.timeout });
        }
    }

})(this.jefs, jQuery, noty);

