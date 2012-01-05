<%@ Assembly Name="$SharePoint.Project.AssemblyFullName$" %>
<%@ Assembly Name="Microsoft.Web.CommandUI, Version=14.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Register Tagprefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=14.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Register Tagprefix="Utilities" Namespace="Microsoft.SharePoint.Utilities" Assembly="Microsoft.SharePoint, Version=14.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Register Tagprefix="asp" Namespace="System.Web.UI" Assembly="System.Web.Extensions, Version=3.5.0.0, Culture=neutral, PublicKeyToken=31bf3856ad364e35" %>
<%@ Import Namespace="Microsoft.SharePoint" %> 
<%@ Register Tagprefix="WebPartPages" Namespace="Microsoft.SharePoint.WebPartPages" Assembly="Microsoft.SharePoint, Version=14.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Control Language="C#" AutoEventWireup="true" CodeBehind="JEFS.ascx.cs" Inherits="JEFS.CONTROLTEMPLATES.JEFS" %>

<script src="/_layouts/1033/JEFS/json/json2-min.js" type="text/javascript"></script>
<script src="/_layouts/1033/JEFS/codemirror/codemirror-compressed.js" type="text/javascript"></script>
<link rel="stylesheet" href="/_layouts/1033/JEFS/codemirror/codemirror.css" />
<link rel="stylesheet" href="/_layouts/1033/JEFS/codemirror/theme/default.css" />
<link rel="stylesheet" href="/_layouts/1033/JEFS/codemirror/theme/night.css" />

<asp:Literal runat="server" ID="jefsScript" EnableViewState="false" />

<SharePoint:ScriptLink ID="jefsScriptLink" runat="server" Name="JEFS/jefs.js" LoadAfterUI="true" OnDemand="false" />