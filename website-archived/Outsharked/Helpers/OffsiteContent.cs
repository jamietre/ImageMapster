using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using CsQuery;
namespace Outsharked.Helpers
{
    public class OffsiteContent
    {
        public OffsiteContent() {
            RefreshTime = TimeSpan.FromHours(4);
        }
        private CQ _Html;

        public TimeSpan RefreshTime { get; set; }
        public string Url { get; set; }
        public DateTime Updated { get; set; }
        public string Error { get; protected set; }

        public CQ Html
        {
            get
            {
                if (_Html == null || Updated.Add(RefreshTime) < DateTime.Now)
                {
                    RefreshContent();
                }
                return _Html;
            }
            set
            {
                _Html = value;
            }
        }
        private void RefreshContent()
        {
            Updated= DateTime.Now;
            if (_Html == null)
            {
                var dom = CQ.CreateFromUrl(Url);
                FixRelativeLinks(Url,dom);
                _Html = dom;

            }
            else
            {
                CQ.CreateFromUrlAsync(Url, (r) =>
                {
                    if (r.Success)
                    {
                        FixRelativeLinks(Url,r.Dom);
                        _Html = r.Dom;
                    }
                    else
                    {
                        Error = r.Error;
                    }
                });
            }
        }

        /// <summary>
        /// Fix relative links.
        /// </summary>
        ///
        /// <param name="what">
        /// The what.
        /// </param>

        private void FixRelativeLinks(string url, CQ dom)
        {
            string baseUrl = url.Substring(0,url.LastIndexOf("/"));

            foreach (var item in dom["img, a"])
            {
                string attr = attributeForEl(item);
                var src = item[attr];
                if (!src.StartsWith("http:", StringComparison.CurrentCultureIgnoreCase))
                {
                    item[attr] = baseUrl + "/" + item[attr];
                }


            }

            // recurse inner content

            //foreach (var item in dom["a"])
            //{
            //    var href = item["href"];

            //    if (!href.StartsWith("http:", StringComparison.CurrentCultureIgnoreCase))
            //    {


            //    }
            //}


        }

        private string attributeForEl(IDomObject el)
        {
            if (el.NodeName == "A")
            {
                return "href";
            }
            else if (el.NodeName == "IMG")
            {
                return "src";
            }
            else
            {
                return "";
            }
        }
    }
}

