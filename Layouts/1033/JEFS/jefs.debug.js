var JEFS = JEFS || {};
JEFS.editor = (function (window, document, undefined) {

    var editor;
    initEditor();

    // get the child elements and hook up event handlers
    function initEditor() {

        var dlgDiv;

        // content of the modal dialog with all the child elements    
        // resizing textarea with the dialog needs work
        dlgDiv = document.createElement('div');
        dlgDiv.setAttribute('id', 'jefs_dialog');
        dlgDiv.setAttribute('style', 'font-size:10pt;');
        dlgDiv.innerHTML = '<form><textarea id="jefs_editor"></textarea><textarea id="jefs_includes"></textarea><div style="float:left;width:150px;margin-top: 15px;font-size:10px;color:#000;margin-right:15px;"><input type="checkbox" id="jefs_wrap" /> wrap lines<br /><input type="checkbox" id="jefs_reload" checked="checked" /> reload after save</div><div style="text-align:right;margin-top:5px; width:300px;float:right;font-size: 11px;">include: <select id="jefs_libs_select"><option value="none">None</option></select><a id="jefs_head" href="javascript:void(0);" style="margin:0 10px 0 5px;">show html</a><button type="button" id="jefs_save" style="border: solid 1px #c3c3c3;background-color:#f1f1f1;padding: 3px;width: 85px;margin-right:8px;margin-top:15px;color: #21374C;font-size:11px;font-weight: bold;font-family: verdana;">save</button></div><div style="clear:both;"></div></form>';

        editor = {};
        editor.elem = {
            div: dlgDiv,
            form: dlgDiv.childNodes[0],
            mainEditorArea: dlgDiv.childNodes[0].childNodes[0],
            libsEditorArea: dlgDiv.childNodes[0].childNodes[1],
            wrap: dlgDiv.childNodes[0].childNodes[2].childNodes[0],
            reload: dlgDiv.childNodes[0].childNodes[2].childNodes[3],
            rightPanel: dlgDiv.childNodes[0].childNodes[3],
            libraries: dlgDiv.childNodes[0].childNodes[3].childNodes[1],
            swap: dlgDiv.childNodes[0].childNodes[3].childNodes[2],
            save: dlgDiv.childNodes[0].childNodes[3].childNodes[3]
        };

        bind(editor.elem.save, 'click', save);
        bind(editor.elem.swap, 'click', swapEditors);
        bind(editor.elem.wrap, 'click', wrap);
        bind(editor.elem.libraries, 'change', populateIncludes);

        editor.mainEditor = initCMEditor(editor.elem.mainEditorArea,
            { value: getValue('jefs_script', ''), mode: 'javascript', lineNumbers: true, theme: 'night', lineWrapping: editor.elem.wrap.checked });
        editor.libsEditor = initCMEditor(editor.elem.libsEditorArea,
            { value: getValue('jefs_script_libs', '<!-- jefs script references -->'), mode: 'text/html', theme: 'default' });

        // hidden initially
        setStyleProperty(editor.libsEditor.getWrapperElement(), 'display', 'none');
        editor.mainVisible = true;

        getLibraries();
    }

    function initCMEditor(textArea, options) {
        return CodeMirror(function (elt) {
            textArea.parentNode.replaceChild(elt, textArea);
        }, options);
    }

    function getValue(valElementId, defaultValue) {
        var el = document.getElementById(valElementId);
        return el !== null && el.value.length > 0 ? el.value : defaultValue;
    }

    // saves the content of the editor into a list
    function save() {
        var ctx = new SP.ClientContext.get_current();
        var web = ctx.get_site().get_rootWeb();
        var list = web.get_lists().getByTitle('JEFS');

        // todo: figure out how to recognize encoded/decoded strings
        var qry = '<View><Query><Where><Eq><FieldRef Name="Title" /><Value Type="Text">' + (location.pathname.indexOf('%20') > 0 ? location.pathname : encodeURI(location.pathname)) + '</Value></Eq></Where></Query><ViewFields><FieldRef Name="Title" /></ViewFields></View>';
        var camlQry = new SP.CamlQuery();
        camlQry.set_viewXml(qry);
        var items = list.getItems(camlQry);
        ctx.load(items);

        ctx.executeQueryAsync(
            function () {
                var enu = items.getEnumerator();
                var li = null;
                while (enu.moveNext()) {
                    li = enu.get_current();
                }

                if (li == null) {
                    var listItemCreationInfo = new SP.ListItemCreationInformation();
                    li = list.addItem(listItemCreationInfo);
                    li.set_item('Title', location.pathname);
                }

                li.set_item('Content', editor.mainEditor.getValue());
                li.set_item('HeadContent', editor.libsEditor.getValue());
                li.update();
                var notifyId = SP.UI.Notify.addNotification('Saving content...', true);

                ctx.executeQueryAsync(
                    function () {
                        SP.UI.Notify.removeNotification(notifyId);
                        SP.UI.Status.addStatus('Javascript Editor content saved!');

                        if (editor.elem.reload.checked) {
                            window.location.reload(true);
                            return;
                        }
                    },
                    function (sender, args) {
                        var statusId = SP.UI.Status.addStatus('Javascript Editor failed while saving content. Message:' + args.get_message());
                        SP.UI.Status.setStatusPriColor(statusId, 'red');
                    });
            },
            function (sender, args) {
                var statusId = SP.UI.Status.addStatus('Javascript Editor failed while getting content. Message:' + args.get_message());
                SP.UI.Status.setStatusPriColor(statusId, 'red');
            });

        SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.cancel, 'Save clicked');
    }

    function populateIncludes() {

        // for now simply append to the end
        // will likely require improvements
        var code = editor.libsEditor.getValue() || '',
            val = editor.elem.libraries.options[editor.elem.libraries.selectedIndex].value,
            tag = '<script class="jefs" type="text/javascript" src="' + editor.elem.libraries.options[editor.elem.libraries.selectedIndex].value + '"></script>';

        if (val === 'none') {
            code = '<!-- JEFS script includes -->';
        } else if (!code.match(tag)) {
            code = code + '\n' + tag;
        }

        editor.libsEditor.setValue(code);
        if (editor.mainVisible) {
            swapEditors();
        }
    }

    function wrap() {
        editor.mainEditor.setOption('lineWrapping', editor.elem.wrap.checked);        
    }

    function swapEditors() {
        if (editor.mainVisible) {
            setStyleProperty(editor.mainEditor.getWrapperElement(), 'display', 'none');
            setStyleProperty(editor.libsEditor.getWrapperElement(), 'display', 'block');
            editor.elem.wrap.setAttribute('disabled', 'disabled');
            editor.elem.swap.innerHTML = 'show js';
            editor.libsEditor.refresh();

            editor.mainVisible = false;
        } else {
            setStyleProperty(editor.mainEditor.getWrapperElement(), 'display', 'block');
            setStyleProperty(editor.libsEditor.getWrapperElement(), 'display', 'none');
            editor.elem.wrap.removeAttribute('disabled');
            editor.elem.swap.innerHTML = 'show html';
            editor.mainEditor.refresh();

            editor.mainVisible = true;
        }
    }

    // reads json content of a file stored in the list containing external libraries included in the editor
    function getLibraries() {
        ensureXHR();

        var xhr = new XMLHttpRequest(),
                loc = '/lists/JEFS/libraries.txt';

        xhr.onreadystatechange = process;
        xhr.open('GET', loc, true);
        xhr.send(null);

        function process() {
            var i;

            try {
                if (xhr.readyState == 4) {
                    var libs = JSON.parse(xhr.responseText);
                    for (i = 0; i < libs.length; i++) {
                        editor.elem.libraries.options[i + 1] = new Option(libs[i].name, libs[i].url);
                    }
                }
            }
            catch (ex) {
                if (window.console && console.warn) {
                    console.warn('Failed to load external libraries from the file located at: ' + loc + '. Make sure the file is located in that location and contains the list of libraries in JSON format.');
                }
            }
        }
    }

    function bind(element, eventName, handler) {
        if (element.addEventListener) {
            element.addEventListener(eventName, handler, false);
        }
        else if (element.attachEvent) {
            element.attachEvent('on' + eventName, handler);
        }
    }

    function setStyleProperty(element, key, value) {
        if (element.style) {
            if (element.style.setProperty) {
                element.style.setProperty(key, value, null);
            }
            else if (element.style.setAttribute) {
                element.style.setAttribute(key, value);
            }
        }
    }

    function ensureXHR() {
        if (!window.XMLHttpRequest) {
            window.XMLHttpRequest = function windowXMLHttpRequest() {
                var progIDs = ['Msxml2.XMLHTTP.3.0', 'Msxml2.XMLHTTP'];
                for (var i = 0, l = progIDs.length; i < l; i++) {
                    try {
                        return new ActiveXObject(progIDs[i]);
                    }
                    catch (ex) {
                    }
                }
                return null;
            }
        }
    }

    return {
        maximized: false,
        launch: function () {
            var options = {
                html: editor.elem.div,
                autoSize: true,
                allowMaximize: true,
                title: 'Type your javascript here',
                showClose: true
            };

            var prevDialog = SP.UI.ModalDialog.get_childDialog();
            if (prevDialog != null) {
                var cont = confirm('Due to an issue with displaying multiple dialogs at once, the editor will close the dialog and open the form in a full page mode. The javascript you save will work either in a dialog or a full page mode. Do you want to continue?');
                if (!cont) return;
                else {
                    var idx = window.location.href.indexOf('?');
                    window.parent.location.href = idx > 0 ? window.location.href.substring(0, idx) : window.location.href;
                    return;
                }
            }

            var dialog = SP.UI.ModalDialog.showModalDialog(options);

            // must refresh once a dialog is shown:
            // http://groups.google.com/group/codemirror/browse_thread/thread/56fa6e266544c42a
            editor.mainEditor.refresh();

            // there doesn't seem to be an event for dialog maximize, so this is a workaround that resizes the inner editor along with the dialog
            var jefs_dialog = document.getElementById('jefs_dialog');
            var btnMax = jefs_dialog.parentNode.previousSibling.childNodes[1].childNodes[0];
            var divInnerEditor = jefs_dialog.childNodes[0].childNodes[0].childNodes[1];
            var divInnerEditorLibs = jefs_dialog.childNodes[0].childNodes[1].childNodes[1];

            bind(btnMax, 'click', resizeEditor);

            function resizeEditor() {
                if (!this.maximized) {
                    var dlgInnHeight = parseInt(jefs_dialog.parentNode.parentNode.style.height.replace('px', ''));
                    var editorHeight = (dlgInnHeight - 95).toString() + 'px';
                    if (divInnerEditor.style.setProperty) {
                        divInnerEditor.style.setProperty('height', editorHeight, null);
                        divInnerEditorLibs.style.setProperty('height', editorHeight, null);
                        editor.elem.rightPanel.style.removeProperty('width');
                    }
                    else if (divInnerEditor.style.setAttribute) {
                        // this doesn't have the same effect in IE, what else is new???
                        // need to calculate off of something like the clientHeight property
                        var cHeight = 600;
                        if (document.documentElement.clientHeight) {
                            cHeight = document.documentElement.clientHeight;
                        }
                        if (document.body.clientHeight) {
                            cHeight = document.body.clientHeight;
                        }

                        divInnerEditor.style.setAttribute('height', (cHeight - 115).toString() + 'px');
                        divInnerEditorLibs.style.setAttribute('height', (cHeight - 115).toString() + 'px');
                        editor.elem.rightPanel.style.removeAttribute('width');
                    }
                    this.maximized = true;
                }
                else {
                    if (divInnerEditor.style.removeProperty) {
                        divInnerEditor.style.removeProperty('height');
                        divInnerEditorLibs.style.removeProperty('height');
                        editor.elem.rightPanel.style.setProperty('width', '300px');
                    }
                    else if (divInnerEditor.style.removeAttribute) {
                        divInnerEditor.style.removeAttribute('height');
                        divInnerEditorLibs.style.removeAttribute('height');
                        editor.elem.rightPanel.style.setAttribute('width', '300px');
                    }

                    this.maximized = false;
                }

                editor.mainEditor.refresh();
            }
        }
    }
})(window, document);