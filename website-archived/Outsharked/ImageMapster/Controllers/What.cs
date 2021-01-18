using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using CsQuery;
using CsQuery.Web;
using Outsharked.Framework;

namespace Outsharked.ImageMapster.Controllers
{
    public static class What
    {

        private class GithubChange
        {
            public string Date {get;set;}
            public List<string> DescriptionList {get;set;}
        }

        private static CQ LastBlogPostLink;

        private static string devDate;
        private static string devVersion;
        private static IEnumerable<GithubChange> RecentChanges;
        private static CQ RecentChangesTable;
        private static DateTime LastUpdate;
        

        public static void ParsePage(CQ page) {

            RefreshRemoteData();

            // update the code for the current release

            var crc = page["#release"].Attr("data-crc");
            foreach (IHTMLAnchorElement anchor in page["a[href*=\\{crc\\}]"])
            {
                anchor.Href = anchor.Href.Replace("{crc}", crc);

            }

            page["#devVersion"].Text(String.IsNullOrEmpty(devVersion) ? "unforunately not available, please visit github" : devVersion);
            page["#devDate"].Text(String.IsNullOrEmpty(devDate) ? "recently" : devDate);
            
            if (RecentChangesTable != null)
            {
                page["#latestChangesDetail"].Empty().Append(RecentChangesTable);
            }

            var lastLink = page["#lastBlogPostLink"];
            if (LastBlogPostLink != null)
            {
                lastLink.Empty().Append(LastBlogPostLink);
            }
            else
            {
                lastLink.Remove();
            }

            // Bind fields

            var fields = page["[data-field]"];

            if (RecentChanges != null)
            {

                var lastChange = RecentChanges.First();

                foreach (var field in fields)
                {
                    switch (field["data-field"])
                    {
                        case "git-last-date":
                            field.InnerText = lastChange.Date;
                            break;
                        case "git-last-desc":
                            field.InnerHTML = lastChange.DescriptionList.ToHtmlList("ul");
                            break;
                    }

                }
            }
            else
            {
                page["#git-info"].Remove();
            }
        }
        private static void RefreshRemoteData()
        {
            if (devVersion == null || LastUpdate.AddHours(4) < DateTime.Now)
            {
                var promise1 = CQ.CreateFromUrlAsync("https://raw.github.com/jamietre/ImageMapster/master/src/core.js")
                    .Then((Action<ICsqWebResponse>)UpdateVersionNumber);

                var promise2 = CQ.CreateFromUrlAsync("https://github.com/jamietre/ImageMapster")
                    .Then((Action<ICsqWebResponse>)UpdateVersionDate);

                var promise3 = CQ.CreateFromUrlAsync("http://blog.outsharked.com/search/label/imagemapster")
                    .Then((Action<ICsqWebResponse>)UpdateBlogTitle);

                //CQ.WhenAll(promise1, promise2, promise3).Then(FinishGithubUpdate);
            }

        }

        private static void UpdateBlogTitle(ICsqWebResponse response)
        {
            var csq = response.Dom;
            var post = csq[".date-header"].First();
            if (post.Length > 0)
            {
                var content = CQ.Create("<span><b>" + post.Find("span").Text() + "</b>: </span>");
                var link = post.Parent().Find(".post-title a").Attr("target", "_blank");
                content.Append(link);
                LastBlogPostLink = content;
            }
        }
        private static void UpdateVersionNumber(ICsqWebResponse response)
        {
            var js = response.Html;
            var pos = js.IndexOf("version:");
            if (pos >= 0)
            {
                int firstQ = js.IndexOf('"', pos);
                int lastQ = js.IndexOf('"', firstQ + 1);
                devVersion = js.Substring(firstQ + 1, lastQ - firstQ - 1);
            }
            LastUpdate = DateTime.Now;

        }
        
        private static void UpdateVersionDate(ICsqWebResponse response)
        {
            var dom = response.Dom;
            string devDateString = dom[".authorship time"].Attr("title");
            DateTime date;
            if (DateTime.TryParse(devDateString, out date))
            {
                date = DateTime.SpecifyKind(date, DateTimeKind.Utc).ToLocalTime();
                devDate = date.ToString("dddd, MMMM dd, yyyy");
            }

            CQ.CreateFromUrlAsync("https://github.com/jamietre/ImageMapster/commits/master")
                .Then((Action<ICsqWebResponse>)UpdateCommitData);
        }

        private static void UpdateCommitData(ICsqWebResponse response)
        {
            var dom = response.Dom;
            var updates = dom[".commit-group-heading"];
            var output = CQ.Create("<table class=changes><tr><td><b>Date</b></td><td><b>Description</b></td></tr></table>");
            var template = "<tr><td>{0}</td><td>{1}</td></tr>";

            List<GithubChange> recentChanges = new List<GithubChange>();

            int count = 0;
            foreach (var commit in updates)
            {
                if (count++ > 9)
                {
                    break;
                }
                List<string> detail = new List<string>();

                foreach (var item in commit.NextElementSibling.Cq().Find(".commit-title"))
                {
                    string startText = item.Cq().Text().Trim();

                    string endText = item.Cq().Next().Filter(".commit-desc").Text().Trim();
                    if (!String.IsNullOrEmpty(endText)) {
                        startText = startText.Replace((char)8230,' ').Trim();
                        endText = endText.Replace((char)8230,' ').Trim();
                        startText = startText + " " + endText;
                    }
                    detail.Add(startText);

                }

                var current = new GithubChange
                {
                    Date = commit.Cq().Text(),
                    DescriptionList = detail
                };
                recentChanges.Add(current);

                var row = CQ.Create(String.Format(template, 
                    current.Date,
                    current.DescriptionList.ToHtmlList("ul")
                    ));

                output.Append(row);
            }
            RecentChanges = recentChanges;
            RecentChangesTable = output;
            
        }



    }
}