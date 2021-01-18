using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using CsQuery;
using CsQuery.Web;

namespace Outsharked.ImageMapster
{
    public partial class ServeRaw : Outsharked.Framework.CsQueryPage
    {
        public ServeRaw()
        {
            DefaultPage = "what.html";
            TemplateFile = "template_raw.html";
        }

    }
}
