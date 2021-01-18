<%@ Control Language="C#" AutoEventWireup="true" CodeBehind="Navigation.ascx.cs" Inherits="Outsharked.Navigation" %>

<div id="Div1" runat="server" class="navigation">
    <asp:HiddenField runat="server" ID="LoadPage" Visible="true" ClientIDMode="Static" />
    <asp:PlaceHolder runat="server" ID="NavPlaceholder"></asp:PlaceHolder>
</div>
