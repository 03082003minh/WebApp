using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace System.Web
{
    public class HtmlHeadRazor : MyRazor
    {
        static public HtmlString Help(string title)
        {
            var doc = new HtmlHeadRazor(null);
            var node = doc.Root.FirstChild;
            if (node.TagName == "head")
            {
                node = node.FirstChild;
                while (node != null)
                {
                    if (node.TagName == "title")
                    {
                        node.InnerHTML = title;
                        break;
                    }
                    node = node.NextSibling;
                }
            }
            return doc.Render();
        }
        public HtmlHeadRazor(string name)
        {
            Root = Load(TemplatePath, "html/" + (name ?? "shared-layout")).Root;
        }
        static public void UpdateVersion(string name)
        {
            var v = string.Format("?v={0:yyyyMMddHHmm}", DateTime.Now);
            Load(TemplatePath, "html/" + (name ?? "shared-layout"),
                (path, root) => {
                    root.ForNodes(node => {
                        var pn = node.TagName == "link" ? "href" : "src";
                        var fn = node.GetAttribute(pn);
                        var i = fn.IndexOf('?');
                        if (i > 0) { fn = fn.Substring(0, i); }

                        node.SetAttribute(pn, fn + v);
                    });
                    using (var sw = new System.IO.StreamWriter(path)) {
                        sw.WriteLine(root.InnerHTML);
                    }
            });
            
        }
    }

    partial class MyRazor
    {
        public static HtmlString HtmlHead()
        {
            return HtmlHead(null);
        }
        public static HtmlString HtmlHead(string name)
        {
            return new HtmlHeadRazor(name).Render();
        }
    }
}