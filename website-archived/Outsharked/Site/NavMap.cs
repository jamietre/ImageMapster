using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Outsharked.Site
{
    public class NavMap
    {
        public List<NavItem> SiteMenu;
        public NavMap()
        {
            SiteMenu = new List<NavItem>(GetNav());
        }
        public IEnumerable<NavItem> GetNav()
        {

            yield return new NavItem(0, "Home", "/?home");
            yield return new NavItem(1, "About", "/?about");
            yield return new NavItem(2, "Projects", "/?projects");
            yield return new NavItem(3, "More", "/?more");
            yield return new NavItem(2, "ImageMapster2", "/?imagemapster2", false);
            
        }
        public string GetPageName(int pageID)
        {
            string pageName = SiteMenu[0].LinkText;
            foreach (NavItem item in SiteMenu)
            {
                if (item.Index == pageID && item.Visible)
                {
                    pageName = item.LinkText;
                    break;
                }
            }
            return pageName;
        }
    }
    public class NavItem
    {
        public NavItem()
        {

        }
        public NavItem(int index, string linkText, string linkUrl)
        {
            Index = index;
            LinkText = linkText;
            LinkUrl = linkUrl;

        }
        public NavItem(int index, string linkText, string linkUrl, bool visible)
        {
            Index = index;
            LinkText = linkText;
            LinkUrl = linkUrl;
            Visible = visible;
        }
        public string LinkText;
        public string LinkUrl;
        public int Index;
        public bool Visible = true;
    }
}