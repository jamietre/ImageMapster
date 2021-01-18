using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using Outsharked.Site;

namespace Outsharked
{
    public partial class Default : System.Web.UI.Page, IContent 
    {
        protected override void OnInit(EventArgs e)
        {
            Response.Redirect("http://blog.outsharked.com");
            base.OnInit(e);
        }
        protected IContent Content
        {
            get
            {
                if (_Content == null)
                {
                    _Content = Page.LoadControl("~/Content.ascx");
                    MainContent.Controls.Add(_Content);
                }
                return (IContent)_Content;
            }
        } protected Control _Content;

        #region IContent Members

        public string ContentID
        {
            get
            {
                return Content.ContentID ;
            }
            set
            {
                Content.ContentID=value;
            }
        }

        #endregion
    }
}