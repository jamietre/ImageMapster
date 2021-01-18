using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using CsQuery;
using CsQuery.Web;
using Outsharked.Framework;

namespace Outsharked.ImageMapster
{
    public partial class Default : CsQueryPage
    {
    
        public Default()
        {
            DefaultPage = "what.html";
            TemplateFile = "template.html";
        }
        protected override void OnInit(EventArgs e)
        {
            base.OnInit(e);
            string page = Request.QueryString["page"];
            if (!String.IsNullOrEmpty(page) && page != "default")
            {
                CurrentPage = page;
            }

            if (Request.QueryString["raw"] == "1")
            {
                TemplateFile = "template_raw.html";
            }


            var menu = Template.Select(".menu").Find("a[href*='" + CurrentPage + "']");
            menu.Closest("div").AddClass("selected");

        }
        protected override void BeforeRender(CQ dom)
        {
            switch(CurrentPage) {
                case "what.html":
                    Controllers.What.ParsePage(Template);
                    break;
            } 
            
            if (CQ.Browser.MSIE) {
                if (CQ.Browser.VersionMajor < 9)
                {
                    dom["head"].Append("<meta http-equiv=\"X-UA-Compatible\" content=\"IE=7; IE=8\" />");
                }

            }
        }

    }
}
