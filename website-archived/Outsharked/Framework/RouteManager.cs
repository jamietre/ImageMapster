using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Routing;
using Drintl.Support.Scripting;
using Drintl.Support.Scripting.Implementation;
using CsQuery;

namespace Outsharked.Framework
{
    public class RouteManager: IRouteHandler
    {

        public virtual IHttpHandler GetHttpHandler(RequestContext requestContext)
        {
            return new RouteHandler (requestContext.RouteData);           
        }
    }

    public class ContentRouteManager: RouteManager
    {
        
        public override IHttpHandler GetHttpHandler(RequestContext requestContext)
        {
            return new HtmlContentHandler(requestContext.RouteData);           
        }

    }

}