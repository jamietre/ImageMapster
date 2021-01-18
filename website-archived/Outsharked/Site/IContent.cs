using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Outsharked.Site
{
    /// <summary>
    /// A content provider
    /// </summary>
    public interface IContent
    {
        string ContentID
        { get; set; }
    }
}