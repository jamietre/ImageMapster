using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Security;
using System.Web.SessionState;
using System.Web.Routing;
using System.Dynamic;
using Outsharked.Site;
using Outsharked.Framework;
using IQRoute;
using IQMap;

namespace Outsharked
{
    public class Global : System.Web.HttpApplication
    {
        static Global()
        {
            IQ.Config.DefaultConnectionString = System.Configuration.ConfigurationManager.ConnectionStrings["siteData"].ConnectionString;
            IQ.Config.DataStorageController = new IQMap.Impl.EngineSpecific.SQLCompactEditionController();
            // best place to static init - will always run once
            IQRoutes.Initialize();
            IQRoutes.Config.MapType<object,ExpandoObject>();
            IQRoutes.MapRoutes("Outsharked.CsQueryTest.Controllers");
            IQRoutes.AliasMap = MapPathAlias;

            RouteTable.Routes.RouteExistingFiles = false;
        }

        private static void MapPathAlias(IRequestDetail request)
        {
            //string result;
            //string path = request.RelativePath;
            //string basePath = request.RelativePath.BeforeLast("/");


            string rewrite = null;
            //switch (filePart)
            //{
            //    case "/getfile.ashx":
            //        rewrite = "/content/cmsfile/" + request.QueryString;
            //        break;
            //    case "/image.ashx":
            //        rewrite = "/content/cmsimage/" + request.QueryString;
            //        break;
            //    default:
            //        if (Aliases.TryGetValue(path, out result))
            //        {
            //            rewrite = request.RelativePath = result;
            //        }
            //        break;
            //}
            if (request.RelativePath.EndsWith("/"))
            {
                rewrite = request.RelativePath + "default.aspx";
            } 
            if (rewrite != null)
            {
                request.RelativePath = rewrite;
                request.Query.Clear();
                request.Rewrite();
            }
        }

        public static NavMap NavMap;
        public static bool IsDebug
        {
            get
            {
                return false;
            }
        }
        public static bool MinimizeScripts
        {
            get
            {
                return false;
            }
        }
        public static bool ParseCss
        {
            get
            {
                return false;
            }
        }

        void Application_Start(object sender, EventArgs e)
        {

            NavMap = new NavMap();

           // ContextScriptManager.ScriptResourceMapping.AddResourceLoader(new ResourceLoaderDefinition("~/Resource.ashx"));

            

        }

        void Application_End(object sender, EventArgs e)
        {
            //  Code that runs on application shutdown

        }

        void Application_Error(object sender, EventArgs e)
        {
            // Code that runs when an unhandled error occurs

        }

        void Session_End(object sender, EventArgs e)
        {
            // Code that runs when a session ends. 
            // Note: The Session_End event is raised only when the sessionstate mode
            // is set to InProc in the Web.config file. If session mode is set to StateServer 
            // or SQLServer, the event is not raised.

        }

    }
}
