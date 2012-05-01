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

