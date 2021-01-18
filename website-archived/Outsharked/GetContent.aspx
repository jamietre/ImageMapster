<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="GetContent.aspx.cs" Inherits="Outsharked.GetContent" %>
<%@ Register Src="~/Content.ascx" TagName="Content" TagPrefix="outs" %>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title></title>
</head>
<body>
    <form id="form1" runat="server">
        <JTC:ContextScriptManager runat="server" MinimizeScripts="true"></JTC:ContextScriptManager>
        <outs:Content id="Content" runat="server" />
    </form>
</body>
</html>
