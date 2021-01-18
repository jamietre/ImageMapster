using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using CsQuery;

namespace Outsharked.Framework
{
    public static class ExtensionMethods
    {
        /// <summary>
        /// Return all text appearing before first occurrentce of Find
        /// </summary>
        /// <param name="text"></param>
        /// <param name="find"></param>
        /// <returns></returns>
        public static string Before(this string text, string find)
        {
            int index = text.IndexOf(find);
            if (index < 0 || index == text.Length)
            {
                return (String.Empty);
            }
            else
            {
                return (text.Substring(0, index));
            }
        }
        public static string After(this string text, string find)
        {
            int index = text.IndexOf(find);
            if (index < 0 || index + find.Length >= text.Length)
            {
                return (String.Empty);
            }
            else
            {
                return (text.Substring(index + find.Length));
            }
        }
        public static string AfterLast(this string text, string find)
        {
            int index = text.LastIndexOf(find);
            if (index < 0 || index + find.Length >= text.Length)
            {
                return (String.Empty);
            }
            else
            {
                return (text.Substring(index + find.Length));
            }
        }
        public static string BeforeLast(this string text, string find)
        {
            int index = text.LastIndexOf(find);
            if (index >= 0)
            {
                return (text.Substring(0, index));
            }
            else
            {
                return String.Empty;
            }
        }

        /// <summary>
        /// Format a sequence of strings as an HTML list.
        /// </summary>
        ///
        /// <param name="sequence">
        /// The sequence to act on.
        /// </param>
        /// <param name="wrapperTag">
        /// (optional) When present, will be used as the wrapper for the LI list.
        /// </param>
        ///
        /// <returns>
        /// The given data converted to a CQ.
        /// </returns>

        public static string ToHtmlList(this IEnumerable<string> sequence, string wrapperTag=null)
        {
            string template = !String.IsNullOrEmpty(wrapperTag) ?
                "<" + wrapperTag + ">{0}</"+wrapperTag+">" : 
                "{0}";

            return String.Format(template,
                String.Join("",sequence.Select(item => String.Format("<li>{0}</li>", item)))
                );
        }
    }
}