(function (jefs, $) {

    var manager,
        notificationId,
        saving,
        saved;

    manager = {
        init: function () {

            jefs.subscribe("jefs/content/save", saving);
            jefs.subscribe("jefs/content/saved", saved);
        }
    }

    saving = function (suppressNotification) {
        if (!suppressNotification)
            notificationId = jefs.status({ id: notificationId, text: "Saving changes, please wait...", timeout: false });

        jefs.editor.close = close;

        jefs.item.js = jefs.editors.js.getValue();
        jefs.item[jefs.editor.htmlView] = jefs.editors.html.getValue();
        jefs.item.save(jefs.editor.sourceUrl);
    }

    saved = function () {

        // publish additional web part events if necessary
        if (jefs.editor.zone && jefs.editor.zone.toLowerCase() !== "none") {
            if (jefs.item.webPartId) {
                if (jefs.editor.zone !== jefs.item.webPartZone) {
                    jefs.publish("jefs/webparts/update", [notificationId]);
                    return;
                }
            }
            else {
                jefs.publish("jefs/webparts/add", [notificationId]);
                return;
            }
        }
        else {

            if (jefs.item.webPartId) {
                jefs.publish("jefs/webparts/delete", [notificationId]);
                return;
            }
        }

        jefs.status({ id: notificationId, text: "<b> Done! </b>", timeout: 3000, append: true });
        notificationId = null;
    }

    jefs.em = jefs.em || {};
    jefs.em.content = manager;

})(this.jefs, jQuery);

