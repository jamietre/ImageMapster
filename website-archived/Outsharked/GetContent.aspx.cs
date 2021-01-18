using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Text;
using System.IO;
using Drintl.Support.ExtensionMethods;

namespace Outsharked
{
    public partial class GetContent : System.Web.UI.Page
    {
        protected override void OnInit(EventArgs e)
        {
            if (!String.IsNullOrEmpty(Request.QueryString["page"]))
            {
                int contentID;
                if (int.TryParse(Request.QueryString["page"], out contentID)) {
                    Content.ContentID = Global.NavMap.GetPageName(contentID);
                }
            }

            base.OnInit(e);
        }
        protected override void OnLoad(EventArgs e)
        {

            base.OnLoad(e);

        }


    }
}