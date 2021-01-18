using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using CsQuery;
using IQRoute;
using IQRoute.Impl;
using IQRoute.Impl.RouteHandlers;

namespace Outsharked.Framework
{
    public class HtmlContentHandler: IQHttpHandlerBase
    {

        HttpContext Context;
        public override bool TryProcessRequest(IRequestDetail request, out IResponseData response)
        {
            Context = request.Context;
            Template.Select("#content").Append(GetContent().Document.ChildNodes);

            response = HttpStreamer.ResponseDataFromHTML(Template.Render() + System.Environment.NewLine);

            return true;
        }

        public string TemplateFile
        {
            get
            {
                return "template.html";
            }
        }

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
        private CQ _Template = null;
        protected string PageRootPath
        {
            get
            {
                return Context.Server.MapPath("./");
            }
        }

        protected virtual CQ GetContent()
        {
            return null;
        }
        protected virtual CQ OnGetTemplate()
        {
            return CQ.CreateFromFile(PageRootPath + TemplateFile);
        }
        public override bool IsReusable
        {
            get
            {
                return false;
            }
        }
    }
}