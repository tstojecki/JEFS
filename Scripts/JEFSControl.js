/// <reference path="file://C:/Program Files/Common Files/Microsoft Shared/Web Server Extensions/14/TEMPLATE/LAYOUTS/MicrosoftAjax.js" />
/// <reference path="file://C:/Program Files/Common Files/Microsoft Shared/Web Server Extensions/14/TEMPLATE/LAYOUTS/SP.core.debug.js" />
/// <reference path="file://C:/Program Files/Common Files/Microsoft Shared/Web Server Extensions/14/TEMPLATE/LAYOUTS/SP.debug.js" />

var JEFSControl = {};

$(document).ready(function () {

    AddJEFSCSS();

    ExecuteOrDelayUntilScriptLoaded(LoadJEFS, "sp.js");

    AddJEFSButton();

});

function AddJEFSCSS() {

    var headID = document.getElementsByTagName("head")[0]; 

    var fileref = document.createElement("link");
    fileref.setAttribute("rel", "stylesheet");
    fileref.setAttribute("type", "text/css");
    fileref.setAttribute("href", "/JEFS/Scripts/codemirror/codemirror.css");

    headID.appendChild(fileref);

    var fileref1 = document.createElement("link");
    fileref1.setAttribute("rel", "stylesheet");
    fileref1.setAttribute("type", "text/css");
    fileref1.setAttribute("href", "/JEFS/Scripts/codemirror/theme/night.css");
    headID.appendChild(fileref1);

}

function AddJEFSButton() {

    var JEFSbutton = $("<a id='JEFSbutton' href='#' onclick='JEFS.editor.launch()'>JavaScript Editor</a>");

    $("#s4-ribbonrow").after(JEFSbutton);

}

function LoadJEFS() {

    JEFSControl.pagePath = window.location.pathname;

    JEFSControl.context = new SP.ClientContext.get_current();

    JEFSControl.list = JEFSControl.context.get_site().get_rootWeb().get_lists().getByTitle("JEFS");

    var query = new SP.CamlQuery();
    query.set_viewXml("<View><Query><Where><Eq><FieldRef Name='Title' /><Value Type='Text'>" + JEFSControl.pagePath + "</Value></Eq></Where></Query></View>");

    JEFSControl.items = JEFSControl.list.getItems(query);

    JEFSControl.context.load(JEFSControl.items);

    JEFSControl.context.executeQueryAsync(Function.createDelegate(this,LoadJEFSsuccess),Function.createDelegate(this,LoadJEFSfailure));
}

function LoadJEFSsuccess(sender, args) {

    var itemEnumerator = JEFSControl.items.getEnumerator();

    while (itemEnumerator.moveNext()) {

        var currentItem = itemEnumerator.get_current();
        var pageHead = $("head");

        var contentScript = $("<script></script>");
        contentScript.html(currentItem.get_item("Content"));
        pageHead.append(contentScript);

        var hiddenCS = $("<input id='jefs_script' type='hidden'></input>");
        hiddenCS.attr("value", currentItem.get_item("Content"));
        pageHead.append(hiddenCS);

        var contentHead = $("<script></script>")
        contentHead.attr("src", currentItem.get_item("HeadContent"));
        pageHead.append(contentHead);

        var hiddenCE = $("<input id='jefs_script_libs' type='hidden'></input>");
        hiddenCE.attr("value", currentItem.get_item("HeadContent"));
        pageHead.append(hiddenCE);


    }
}

function LoadJEFSfailure(sender, args) {
    alert("failed." + args.get_message());
}