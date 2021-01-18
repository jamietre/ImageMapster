using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Routing;
using Drintl.Support;
using Drintl.Support.Scripting;
using Drintl.Support.Scripting.Implementation;
using CsQuery;

namespace Outsharked.Framework
{
 

    public class RouteHandler : IHttpHandler
    {
        public static IRoute Routes = new Drintl.Support.Scripting.Implementation.RouteNode();

        #region constructors

        public RouteHandler(RouteData routeData)
        {
            RouteData = routeData;
        }

        #endregion

        #region private properties

        protected RouteData RouteData;
        protected HttpStreamer Streamer;
        protected bool IsDebug
        {
            get
            {
                return false;
            }
        }
        #endregion

        /// <summary>
        /// Implementation of IHttphandler
        /// </summary>
        /// <param name="context"></param>
        public virtual void ProcessRequest(HttpContext context)
        {
            Streamer = new HttpStreamer(context);
            IResponseData data = null;

            try
            {
                data = ProcessRequest(context, new RequestInfo(context));

            }
            catch (WebServiceException e)
            {
                if (data != null)
                {
                    data.Dispose();
                }
                data = Streamer.ErrorResponse(e.HttpStatus, e.Message);
            }
            catch (Exception e)
            {
                if (data != null)
                {
                    data.Dispose();
                }

                if (IsDebug)
                {
                    data = Streamer.ErrorResponse(HttpStatus.InternalServerError, e.Message);
                }
                else
                {
                    data = Streamer.ErrorResponse(HttpStatus.InternalServerError);
                }
            }
            if (data != null)
            {
                try
                {
                    Streamer.WriteOutput(data);
                }
                finally
                {
                    data.Dispose();

                }
            }

        }
        protected virtual IResponseData ProcessRequest(HttpContext context, IRequestInfo info)
        {

            IResponseData response = null;
            string path = info.PathInfo;

            IRouteTarget route = Routes.Get(path);
            if (route == null)
            {
                throw new Exception("The route '" + path + "' is not valid.");
            }
            info.MethodCount = route.Depth();

            object data = null;

            if (route.InputType != typeof(void))
            {
                if (info.Parameters.Count > 1)
                {
                    object[] objectArr = new object[info.Parameters.Count];
                    for (int i = 0; i < info.Parameters.Count; i++)
                    {
                        objectArr[i] = Objects.Coerce(info.Parameters[i]);

                    }
                    data = objectArr;
                    // TODO map to bool, string, numeric
                    // call 
                }
                else
                {

                    // if there was data passed directly on the REST string, get it. Otherwise, get POST data.
                    // This is hacky. We should distinguish between get and post.
                    if (!String.IsNullOrEmpty(info.Resource))
                    {
                        if (!Types.TryConvert(info.Resource, out data, route.InputType, null))
                        {
                            throw new WebServiceException("Could not parse data passed to service into type '" + route.InputType.ToString() + "'");
                        }

                    }
                    else
                    {
                        data = info.GetRequestData(route.InputType);
                    }
                }

                HttpStreamer streamer = new HttpStreamer(context);

                if (typeof(IResponseData).IsAssignableFrom(route.OutputType))
                {
                    response = (IResponseData)route.Invoke(data);
                }
                else
                {
                    response = streamer.ResponseDataJSON(route.Invoke(data));
                }
                return response;
            }
            else
            {
                route.Invoke();
                return null;
            }

        }

        /// <summary>
        /// Remove the application root part of the pathinfo
        /// </summary>
        /// <param name="context"></param>
        /// <param name="pathInfo"></param>
        /// <returns></returns>
        protected string RemoveApplicationPath(HttpContext context, string pathInfo)
        {
            string appBase = RelativePathBase(context);
            if (!string.IsNullOrEmpty(appBase) && pathInfo.StartsWith(appBase))
            {
                return pathInfo.Substring(appBase.Length);
            }
            else
            {
                return pathInfo;
            }
        }

        protected static string RelativePathBase(HttpContext context)
        {
            string basePath = context.Request.ApplicationPath;
            return basePath == "/" ? "" : basePath;
        }

        public bool IsReusable
        {
            get { return false; }
        }

    }
    
}