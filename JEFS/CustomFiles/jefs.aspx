<%@ Page Language="C#" %>

<!DOCTYPE html>
<html lang="en">
<head>
        
    <link href="~sitecollection/lists/jefs/jefs.css" rel="stylesheet" type="text/css" />
    
    <script src="~sitecollection/lists/jefs/codemirror-compressed.js" type="text/javascript"></script>
    <script src="~sitecollection/lists/jefs/jquery-1.7.1.min.js" type="text/javascript"></script>    
    <script src="~sitecollection/lists/jefs/jquery.noty.js" type="text/javascript"></script>

    <script src="~sitecollection/lists/jefs/jefs.editor.js" type="text/javascript"></script>            
   
    <title>Jefs - Javascript editor for SharePoint</title>
</head>
<body>

    <div id="jefs-cpanel" class="jefs-stretch">        
        <div class="jefs-cpanel-left">
            <button type="button" id="jefs-save" class="jefs-btn jefs-btn-primary">Save</button>
            <button type="button" id="jefs-save-close" class="jefs-btn">Save & Close</button>             
        </div>
        <div id="jefs-cpanel-source">editing: </div>
        <div class="jefs-cpanel-right">
            include: <select id="jefs-libraries" class="jefs"><option value="none">None</option></select>
            view: <select id="jefs-views" class="jefs"><option value="html">HTML</option><option value="css">CSS</option><option value="lib">LIB</option></select>
            zone: <select id="jefs-zones" class="jefs" disabled="disabled"><option value="none">None</option></select>
        </div>
    </div> 
    <div id="jefs-editors" class="jefs-stretch">                
        <div class="jefs-stretch jefs-js">
            <div class="jefs-editbox">
                <textarea id="jefs-jseditor"></textarea>
            </div>
        </div>            
        <div class="jefs-stretch jefs-html">
            <div class="jefs-editbox">
                <textarea id="jefs-htmleditor"></textarea>                
            </div>
        </div>        
    </div>
</body>
</html>

