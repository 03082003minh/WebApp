using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace System
{
    partial class Document
    {
        public HtmlString ToHtml()
        {
            return new HtmlString(this.ToString());
        }
    }

    public static class DocumentExtension
    {
        public static HtmlString ToHtml(this IEnumerable<Document> list)
        {
            var s = new List<string>();
            foreach (var item in list)
            {
                var v = item?.ToString();
                s.Add(v ?? "null");
            }
            return new HtmlString('[' + string.Join(",", s) + ']');
        }
    }
}