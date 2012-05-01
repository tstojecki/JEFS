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

