using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using CsQuery;
using CsQuery.Web;
using Outsharked.Helpers;

namespace Outsharked.Framework
{
    public class CsQueryPage: System.Web.UI.Page
    {

        private CQ _Template = null;
        private static IDictionary<string, OffsiteContent> OffsiteRefs = new Dictionary<string, OffsiteContent>(StringComparer.CurrentCultureIgnoreCase)
        {
            {"beginners.html", new OffsiteContent 
                {
                    Url="http://www.dezynetek.com/AbsoluteBeginners/beginner1.htm",
                    Html=null
                }
            }
        };


        public string TemplateFile
        {get;set;}

        public string DefaultPage = "default.html";
        public string CurrentPage = String.Empty;
        public string DefaultErrorPage = "error-404.html";

        protected virtual CQ Template
        {
            get
            {
                if (_Template == null)
                {
                    _Template = OnGetTemplate();
                }
                return _Template;
            }
        }
        
        protected string PageRootPath
        {
            get
            {
                return Server.MapPath("./");
            }
        }
        protected virtual void BeforeRender(CQ dom)
        {

        }
        protected override void Render(HtmlTextWriter writer)
        {
            Template.Select("#content").Append(GetContent());
            BeforeRender(Template);
            writer.Write(Template.Render() + System.Environment.NewLine);
            base.Render(writer);

        }
        protected CQ GetContent()
        {
            return OnGetContent();
        }
        protected virtual CQ OnGetTemplate()
        {
            return CQ.CreateFromFile(PageRootPath + TemplateFile);
        }
        /// <summary>
        /// Noramlly, loads content from a page in the query string. Override to do something else and return a CsQuery object,
        /// its selection will be added to the content placeholder.
        /// </summary>
        /// <param name="content"></param>
        /// <returns></returns>
        protected virtual CQ OnGetContent()
        {

            CQ content;

            OffsiteContent osc;
            if (OffsiteRefs.TryGetValue(CurrentPage, out osc))
            {
                content = osc.Html["body"].Children().Clone();
                return content;
            }

            try
            {
                content = CQ.CreateFromFile(PageRootPath + CurrentPage);
            }
            catch
            {
                content = CQ.CreateFromFile(PageRootPath + DefaultErrorPage);
            }
            return content;
        }
        protected override void OnInit(EventArgs e)
        {
            base.OnInit(e);
            string page = null;
            if (!String.IsNullOrEmpty(CurrentPage))
            {
                page = CurrentPage;
            }
            if (String.IsNullOrEmpty(page))
            {
                // try to just pull it from the default query string if nothing set
                string query = Request.QueryString.ToString();
                CurrentPage = DefaultPage;
                if (query.IndexOf(".html") > 0)
                {
                    CurrentPage = query;
                }
            }
        }
    }
}