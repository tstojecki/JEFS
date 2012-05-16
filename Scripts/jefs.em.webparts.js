(function (jefs, $) {

    var manager,
        notificationId,
        add,
        added,
        update,
        updated,
        remove,
        removed;

    manager = {
        init: function () {

            jefs.subscribe("jefs/webparts/add", add);
            jefs.subscribe("jefs/webparts/update", update);
            jefs.subscribe("jefs/webparts/delete", remove);
        }
    };

    add = function (notificationId) {

        jefs.sp.addWebPart(
            jefs.editor.sourceUrl,
            jefs.editor.zone,
            jefs.config.siteCollectionUrl + "lists/jefs/attachments/" + jefs.item.id + "/jefs-my.txt",
            function (d) {
                var result = $(d).find("*").filter("addwebpartresult");

                if (result.length > 0) {
                    jefs.status({ id: notificationId, text: "Your content has been saved and a new web part has been added. <br />Please wait while web part changes are being saved...", timeout: false });

                    jefs.item.webPartId = result.text();
                    jefs.item.webPartZone = jefs.editor.zone;

                    jefs.publish("jefs/content/save", [true]);
                }
            }
        );
    }

    update = function (notificationId) {

        jefs.sp.saveWebPart(
            jefs.editor.sourceUrl,
            jefs.item.webPartId,
            jefs.config.siteCollectionUrl + "lists/jefs/attachments/" + jefs.item.id + "/jefs-my.txt",
            jefs.editor.zone,
            function (d) {
                var result = $(d).find("*").filter("addwebpartresult");

                if (result.length > 0) {
                    jefs.status({ id: notificationId, text: "Your content has been saved and the web part has been moved to a new zone. <br />Please wait while web part changes are being saved...", timeout: false });

                    jefs.item.webPartId = result.text();
                    jefs.item.webPartZone = jefs.editor.zone;

                    jefs.publish("jefs/content/save", [true]);
                }
            });
    }

    remove = function (notificationId) {
        jefs.status({ id: notificationId, text: "Removing the content editor web part from the page...", timeout: false });

        jefs.sp.deleteWebPart(
            jefs.editor.sourceUrl,
            jefs.item.webPartId,
            function () {
                jefs.status({ id: notificationId, text: "Your content has been saved and the web part been removed form the page. <br />Please wait while web part changes are being saved...", timeout: false });

                jefs.item.webPartId = jefs.item.webPartZone = "";
                jefs.publish("jefs/content/save", [true]);
            }
        );
    }

    jefs.em = jefs.em || {};
    jefs.em.webparts = manager;

})(this.jefs, jQuery);

