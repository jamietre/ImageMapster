using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using Drintl.Support.ExtensionMethods;
using Outsharked.Site;
namespace Outsharked
{
    public partial class Content : System.Web.UI.UserControl, IContent
    {
        protected string DefaultPanelID = "home";
        public string ContentID 
        {
            get
            {
                if (String.IsNullOrEmpty(_ContentID))
                {
                    return DefaultPanelID;
                }
                else
                {
                    return _ContentID;
                }
            }
            set
            {
                _ContentID = String.IsNullOrEmpty(value) ? String.Empty : value.ToLower();
            }
        } protected string _ContentID= null;
        protected override void OnLoad(EventArgs e)
        {
            Panel panel = this.FindControl<Panel>(ContentID);
            if (panel == null)
            {
                panel = this.FindControl<Panel>(DefaultPanelID);

            }
            panel.Visible = true;
            base.OnLoad(e);
        }

    }
}