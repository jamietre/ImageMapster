using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.IO;
using System.Reflection;
using System.Text;
using JTC.Web.UI;
using JTC.Support;
using JTC.ExtensionMethods;
using Drintl.Support.Scripting;
using Drintl.Support.Scripting.Implementation;

namespace Outsharked
{
    /// <summary>
    /// Pass a ScriptReference name as a single parameter. Can also be passed a path for a local file, which should have slashes encoded as ~.
    /// It should be identified by ~ at the start.
    /// </summary>
    public class Resource : Drintl.Support.Scripting.WebServiceBase
    {
        public Resource()
            : base()
        {
            base.IsDebug = Global.IsDebug;
        }
        public override IResponseData OnProcessRequest(HttpContext context, IRequestInfo info)
        {
            IResponseData data = null;
            try
            {
                switch (info.FirstMethod)
                {
                    case "emb":
                        info.MethodCount = 1;
                        data = ResponseDataFromScriptReference(context, info.Resource);
                        data.CompressJavascript = data.CompressCss = Global.MinimizeScripts;
                        
                        break;
                    default:
                        info.MethodCount = 0;
                        string path = info.Resource;
                        // Assume trailing numbers are a version for preventing browser caching. Strip them.
                        long version = 0;
                        if (long.TryParse(path.AfterLast("."), out version))
                        {
                            path = path.BeforeLast(".");
                        }
                        data = HttpStreamer.ResponseDataFromFile(context, HttpStreamer.ResolveRelativePath(path));
                        data.ContentDisposition = ContentDisposition.Inline;
                        // Don't minimize scripts marked with .min.
                        data.CompressJavascript = data.CompressCss = Global.MinimizeScripts && info.Resource.IndexOf(".min.") == -1;
                        break;
                }
            }
            catch (Exception e)
            {
                data = ErrorResponse(HttpStatus.FileNotFound);
                if (Global.IsDebug)
                {
                    data.SetErrorResponse(e.Message);
                }
            }


            data.ParseCss = Global.ParseCss;
            return data;
        }
        protected IResponseData ResponseDataFromScriptReference(HttpContext context, string resourceName)
        {
            IResponseData data;
            ScriptDefinition def = ContextScriptManager.ScriptResourceMapping.GetDefinition(resourceName);

            string mimeExt = "";
            switch (def.ResourceType)
            {
                case ResourceType.Css:
                    mimeExt = "css";
                    break;
                case ResourceType.Javascript:
                    mimeExt = "js";
                    break;
                default:
                    data = ErrorResponse(HttpStatus.FileNotFound);
                    break;
            }



            if (def.ObjectType != null)
            {
                data = new ResponseData();
                data.FileTypeInfo = HttpStreamer.GetMimeType(mimeExt);
                // Invoke it from a proscribed method
                Assembly.Load(def.Assembly);
                object obj = Activator.CreateInstance(def.Assembly, def.ObjectType).Unwrap();
                Type t = obj.GetType();
                MethodInfo mi = t.GetMethod(def.Method);
                object[] methodParms = new object[1];
                methodParms[0] = def.Path;
                data.InputStream = (Stream)mi.Invoke(null, methodParms);
            }
            else if (def.Assembly != null)
            {
                data = new ResponseData();
                // Try to get a .NET embedded resource 
                data.FileTypeInfo = HttpStreamer.GetMimeType(mimeExt);
                data.InputStream= Utils.EmbeddedResources.GetResourceStream(def.Path, def.Assembly);
            }
            else
            {
                string path = Utils.ResolveRelativePath(def.Path);
                data = HttpStreamer.ResponseDataFromFile(context, path);
            }
            return data;
        }

    }
}