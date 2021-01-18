<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="GetNav.aspx.cs" Inherits="Outsharked.GetNav" %>
<%@ Register Src="~/Navigation.ascx" TagName="Navigation" TagPrefix="outs" %>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title></title>
</head>
<body>
    <form id="form1" runat="server">
        <outs:Navigation runat="server" ID="NavBar" />
    </form>
</body>
</html>
