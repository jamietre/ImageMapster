using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Web.UI.HtmlControls;
using System.Text;
using System.IO;

using Drintl.Support.ExtensionMethods;
using Outsharked.Site;

namespace Outsharked
{
//<ul id="source" >
//    <li id="nav1" data-id="home" class="square1 fade" altimage="/images/square1-plastic.gif"><a href="/about.aspx">Home</a></li>
//    <li id="nav2" data-id="about" class="square2 fade" altimage="/images/square2-plastic.gif">About</li>
//    <li id="nav3" data-id="winmo" class="square3 fade" altimage="/images/square3-plastic.gif">Projects</li>
//    <li id="nav4" data-id="winmo" class="square4 fade" altimage="/images/square4-plastic.gif">More</li>
//</ul>
    public partial class Navigation : System.Web.UI.UserControl
    {
        public List<NavItem> NavItems
        {
            get
            {
                return Global.NavMap.SiteMenu;
            }
        }
        protected int ActiveItem = 0;
        protected int ActiveListIndex = 0;

        protected bool AsyncUpdate = false;
        protected string ContentID;
        protected override void OnInit(EventArgs e)
        {
            // Logic: check for "page=" first for an ID. If not use default query string.
            if (!int.TryParse(Request.QueryString["page"], out ActiveListIndex))
            {

                ContentID = Request.QueryString.Count == 0 ? String.Empty : Request.QueryString[0];
                if (!String.IsNullOrEmpty(ContentID))
                {
                    string menuID = (ContentID + "_").Before("_");
                    for (int i = 0; i < NavItems.Count; i++)
                    {
                        if (NavItems[i].LinkUrl == "/?" + menuID)
                        {
                            ActiveListIndex = i;
                            ActiveItem = NavItems[i].Index;
                            break;
                        }
                    }
                }
            }
            else
            {
                ActiveItem = NavItems[ActiveListIndex].Index;
            }
            // set a form field value for js to use to reload a dynamically loaded page
            LoadPage.Value = ActiveListIndex.ToString();

            if (Request.QueryString["async"] != null)
            {
                AsyncUpdate = true;
            }
           
                                                   
            Page.PreRenderComplete += new EventHandler(Page_PreRenderComplete);
            base.OnInit(e);
        }
        protected override void OnLoad(EventArgs e)
        {
            if (Page is IContent)
            {
                ((IContent)Page).ContentID = ContentID;
            }
            base.OnLoad(e);
        }
        protected void Page_PreRenderComplete(object sender, EventArgs e)
        {
            if (AsyncUpdate)
            {
                RenderNavOnly();
            }
        }

        protected override void CreateChildControls()
        {
            base.CreateChildControls();
            HtmlGenericControl ctl = new HtmlGenericControl();
            ctl.TagName = "ul";
            if (AsyncUpdate)
            {
                ctl.Style["display"] = "none";
            }
            NavPlaceholder.Controls.Add(ctl);

            if (ActiveItem >=0)
            {
                foreach (NavItem item in NavItems) {
                    if (item.Index == ActiveItem && item.Visible) {
                        ctl.Controls.Add(NavControl(item,true));
                    }
                }
            }
            foreach  (NavItem item in NavItems) {
                if (item.Index != ActiveItem && item.Visible)
                {
                    ctl.Controls.Add(NavControl(item,false));
                }
            }
        }
        protected void RenderNavOnly()
        {
            EnsureChildControls();

            StringBuilder sb = new StringBuilder();
            StringWriter sw = new StringWriter(sb);

            using (HtmlTextWriter myWriter = new HtmlTextWriter(sw))
            {
                base.Render(myWriter);
            }
            Page.Response.Write(sb.ToString());
            Page.Response.Flush();
            Page.Response.End();

        }
        protected Control NavControl(NavItem item, bool active)
        {
            string imageIndex = (item.Index+1).ToString();
            HtmlGenericControl ctl;
            ctl = new HtmlGenericControl("li");
            ctl.Attributes["qsid"] = "nav" + item.Index.ToString();
            ctl.Attributes["id"] = item.Index.ToString();
            ctl.Attributes["class"] = "fade";

            HtmlGenericControl div = new HtmlGenericControl("div");
            ctl.Controls.Add(div);

            HyperLink lnk = new HyperLink();
            lnk.Text = item.LinkText;
            if (!active)
            {
                lnk.NavigateUrl = item.LinkUrl;
                lnk.Attributes["altimage"] = "~/images/square" + imageIndex + "-plastic.gif";
            }

            //lnk.Attributes["selimage"] = JTC.Support.Utils.ResolveRelativePath("~/images/square" + imageIndex + "-selected.gif");
            //lnk.Attributes["class"] = "square" + imageIndex.ToString();
            //lnk.Style["background-image"] = "url(" + Utils.ResolveRelativePath("~/images/square" + imageIndex + (active ? "-selected":String.Empty) +  ".gif") + ")";
            lnk.Attributes["id"] = "lnk" + item.Index.ToString();
            lnk.Attributes["cpage"] = item.Index.ToString();

            div.Controls.Add(lnk);
            return ctl;
            
        }
        protected override void Render(HtmlTextWriter writer)
        {
            EnsureChildControls();
            base.Render(writer);
        }
    }

}
