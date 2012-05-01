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

