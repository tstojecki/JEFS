/*  JEFS - Javascript Editor for SharePoint, MIT License, (c) Tomek Stojecki */
var JEFS = JEFS || {};
JEFS.$ = jQuery.noConflict(true);
JEFS.script = '';
JEFS.includes = '<!-- jefs script references -->';
JEFS.siteServerRelativeUrl = null;

(function ($, window, document) {
    
    $(document).ready(function() {
        
        var siteServerRelativeUrl,            
            codeMirrorSrc,
            applied = false,
            inc = [];

        if (_spPageContextInfo) { 
            siteServerRelativeUrl = _spPageContextInfo.siteServerRelativeUrl;            
        }
        
        
        // does it end with a /
        if (!siteServerRelativeUrl.match(/\/$/)) siteServerRelativeUrl = siteServerRelativeUrl + '/';
        JEFS.siteServerRelativeUrl = siteServerRelativeUrl;

        loadScriptByUrl();

        // add codemirror stylesheet first, so they get applied despite of error further down
        $('<link>').appendTo('head').attr({
            rel: 'stylesheet',
            type: 'text/css',
            href: siteServerRelativeUrl + 'lists/JEFS/codemirror.css'
        });

        if (JEFS.includes !== '') {
            
            $(JEFS.includes).filter('script').each(function() {
                inc.push($(this).attr('src'));
            });

            if (inc.length > 0) {
                $LAB.script(inc).wait(function() {
                    if (JEFS.script !== '') {
                        // ie doesn't allow for: $('<script>').text(JEFS.script);
                        // concatenate the string into a script tag, then append
                        appendScript();
                    }
                });
            }
            else {
                appendScript();
            }
        }

        function appendScript() {
            $('head').append('<script type="text/javascript">' + JEFS.script + '</script>');
        }
    });

    function loadScriptByUrl() {

        var soapEnv = '<?xml version="1.0" encoding="utf-8"?> \
            <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"> \
            <soap:Body> \
                <GetListItems xmlns="http://schemas.microsoft.com/sharepoint/soap/"> \
                    <listName>JEFS</listName> \
                    <viewFields> \
                    <ViewFields> \
                        <FieldRef Name="Title" /> \
                        <FieldRef Name="Content" /> \
                        <FieldRef Name="HeadContent" /> \
                    </ViewFields> \
                    </viewFields> \
                    <query> \
                    <Query> \
                        <Where><Eq><FieldRef Name="Title"/><Value Type="Text">' + (location.pathname.indexOf('%20') > 0 ? location.pathname : encodeURI(location.pathname)) + '</Value></Eq></Where> \
                    </Query> \
                    </query> \
                    <QueryOptions> \
                    <queryOptions> \
                        <IncludeMandatoryColumns>FALSE</IncludeMandatoryColumns> \
                    </queryOptions> \
                    </QueryOptions> \
                </GetListItems> \
            </soap:Body> \
        </soap:Envelope>';        

        $.ajax({
            url: JEFS.siteServerRelativeUrl + '_vti_bin/lists.asmx',
            type: 'POST',            
            contentType: 'text/xml;charset="utf-8"',            
            dataType: 'xml',
            data: soapEnv,
            async: false
        })
        .done(function(doc) {                                
            var rows = $(doc).find('*').filter('z\\:row');
            if (rows.length > 0) {
                JEFS.script = rows.first().attr('ows_Content');
                JEFS.includes = rows.first().attr('ows_HeadContent');
            }
        })
        .fail(function (jqXHR, textStatus, error) {
            throw 'The SOAP call to GetListItems failed with the error of: ' + error.toString();
        });
    }
    
})(JEFS.$, window, document);

// js editor inside the dialog
JEFS.editor = (function ($, window, document, undefined) {

    var $editor = null,
        cmMain = null,
        cmRes = null;

    function init() {

        var $t = $('<div id="jefs_dialog" style="font-size:10pt"><form><textarea id="jefs_editor"></textarea><textarea id="jefs_resources"></textarea><div style="float:left;width:150px;margin-top: 15px;font-size:10px;color:#000;margin-right:15px;"><input type="checkbox" id="jefs_wrap" /> wrap lines<br /><input type="checkbox" id="jefs_reload" checked="checked" /> reload after save</div><div id="jefs_rpanel" style="text-align:right;margin-top:5px; width:300px;float:right;font-size: 11px;">include: <select id="jefs_libraries"><option value="none">None</option></select><a id="jefs_swap" href="javascript:void(0);" style="margin:0 10px 0 5px;">resources</a><button type="button" id="jefs_save" style="border: solid 1px #c3c3c3;background-color:#f1f1f1;padding: 3px;width: 85px;margin-right:8px;margin-top:15px;color: #21374C;font-size:11px;font-weight: bold;font-family: verdana;">save</button></div><div style="clear:both;"></div></form></div>');
        $editor = {
            main: $t,
            editorMainArea: $t.find('#jefs_editor'),
            editorResArea: $t.find('#jefs_resources'),
            optionWrap: $t.find('#jefs_wrap'),
            optionReload: $t.find('#jefs_reload'),
            buttonSwap: $t.find('#jefs_swap'),
            buttonSave: $t.find('#jefs_save'),
            selectLibraries: $t.find('#jefs_libraries'),
            rightPanel: $t.find('#jefs_rpanel')
        };

        bindEvents();

        cmMain = codeMirror($editor.editorMainArea.get(0),
            { value: JEFS.script, mode: 'javascript', lineNumbers: true, theme: 'night', lineWrapping: $editor.optionWrap.is(':checked') });
        $editor.editorMainWrapper = $(cmMain.getWrapperElement());

        cmRes = codeMirror($editor.editorResArea.get(0),
            { value: JEFS.includes, mode: 'text/html', theme: 'default' });
        $editor.editorResWrapper = $(cmRes.getWrapperElement());

        // hide resource editor on init
        $editor.editorResWrapper.hide();

        getLibraries();
    }

    function bindEvents() {
        $editor.buttonSave.click(save);
        $editor.buttonSwap.click(swapEditors);
        $editor.optionWrap.click(wrap);
        $editor.selectLibraries.change(populateIncludes);
    }

    function codeMirror(textArea, options) {
        return CodeMirror(function (elt) {
            textArea.parentNode.replaceChild(elt, textArea);
        }, options);
    }

    function isMainVisible() {
        return $editor.editorMainWrapper.is(':visible');
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

                li.set_item('Content', cmMain.getValue());
                li.set_item('HeadContent', cmRes.getValue());
                li.update();
                var notifyId = SP.UI.Notify.addNotification('Saving content...', true);

                ctx.executeQueryAsync(
                    function () {
                        SP.UI.Notify.removeNotification(notifyId);
                        SP.UI.Status.addStatus('Javascript Editor content saved!');

                        if ($editor.optionReload.is(':checked')) {
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
        var code = cmRes.getValue() || '',
            val = $editor.selectLibraries.val(),
            tag = '<script class="jefs" type="text/javascript" src="' + $editor.selectLibraries.val() + '"></script>';

        if (val === 'none') code = '<!-- JEFS script includes -->';
        else if (!code.match(tag)) code = code + '\n' + tag;

        cmRes.setValue(code);

        if (isMainVisible()) swapEditors();
    }

    function wrap() {
        cmMain.setOption('lineWrapping', $editor.optionWrap.is(':checked'));
    }

    function swapEditors() {
        if (isMainVisible()) {
            $editor.editorMainWrapper.hide();
            $editor.editorResWrapper.show();
            $editor.optionWrap.attr({ disabled: 'disabled' });
            $editor.buttonSwap.html('back to js');

            cmRes.refresh();
        } else {
            $editor.editorMainWrapper.show();
            $editor.editorResWrapper.hide();
            $editor.optionWrap.removeAttr('disabled');
            $editor.buttonSwap.html('resources');

            cmMain.refresh();
        }
    }

    // list of libraries is stored in /lists/jefs/includes.txt in json format
    function getLibraries() {

        $.ajax({
            url: JEFS.siteServerRelativeUrl + 'lists/jefs/libraries.txt',
            dataType: 'text'
        })
        .done(function (data) {
            var options = '<option value="none">None</option>',
                idx = 0,
                json = JSON.parse ? JSON.parse(data) : $.parseJSON(data);

            for ( ; idx < json.length; idx++) {
                options += '<option value="' + json[idx].url + '">' + json[idx].name + '</option>';
            }
            $editor.selectLibraries.html(options);
        })
        .fail(function (jqXHR, textStatus, error) {
            throw 'The ajax call to get the list of libraries failed call with the following error: ' + error.toString();
        });
    }

    return {
        maximized: false,
        launch: function () {

            var options,
                dialog,                
                prevDialog,
                cont = false,
                idx = 0;

            init();

            options = {
                html: $editor.main.get(0),
                autoSize: true,
                allowMaximize: true,
                title: 'Type your javascript here',
                showClose: true
            };

            prevDialog = SP.UI.ModalDialog.get_childDialog();
            if (prevDialog != null) {
                cont = confirm('Due to an issue with displaying multiple dialogs at once, the editor will close the dialog and open the form in a full page mode. The javascript you save will work either in a dialog or a full page mode. Do you want to continue?');
                if (!cont) return;
                else {
                    idx = window.location.href.indexOf('?');
                    window.parent.location.href = idx > 0 ? window.location.href.substring(0, idx) : window.location.href;
                    return;
                }
            }

            dialog = SP.UI.ModalDialog.showModalDialog(options);

            // must refresh once a dialog is shown:
            // http://groups.google.com/group/codemirror/browse_thread/thread/56fa6e266544c42a
            cmMain.refresh();                        
            
            // there doesn't seem to be an event for dialog maximize, so this is a workaround that resizes the inner editor along with the dialog                        
            $('.ms-dlgCloseBtn[title=Maximize]').click(function () {
                
                var $jefsDialog,
                    $divInnerEditor,
                    $divInnerEditorRes,
                    dlgInnHeight,
                    editorHeight,
                    cHeight = 600;
                
                $jefsDialog = $('#jefs_dialog');
                $divInnerEditor = $jefsDialog.find('div.CodeMirror-scroll:eq(0)'); 
                $divInnerEditorRes = $jefsDialog.find('div.CodeMirror-scroll:eq(1)');

                if (!this.maximized) {

                    if (!$.browser.msie) {
                        dlgInnHeight = parseInt($jefsDialog.parent().parent().css('height').replace('px', ''));
                        editorHeight = (dlgInnHeight - 95).toString() + 'px';
                    }
                    else {
                        // this doesn't have the same effect in IE
                        // need to calculate off of something like the clientHeight property
                        if (document.documentElement.clientHeight) cHeight = document.documentElement.clientHeight;
                        if (document.body.clientHeight) cHeight = document.body.clientHeight;
                        editorHeight = (cHeight - 115).toString() + 'px';
                    }
                                        
                    $divInnerEditor.css('height', editorHeight);
                    $divInnerEditorRes.css('height', editorHeight);
                    $editor.rightPanel.css('width', '');

                    this.maximized = true;                    
                }
                else {                    
                    $divInnerEditor.css('height', '');
                    $divInnerEditorRes.css('height', '');
                    $editor.rightPanel.css('width', '300px');                    

                    this.maximized = false;
                }

                cmMain.refresh();
            });
        }
    }
})(JEFS.$, window, document);