using System;
using System.Collections.Generic;
using System.Linq;

namespace System.Web
{
    partial class MyRazor
    {
        public static MyRazor Service(string path, string name)
        {
            var rz = Load(path, name);
            rz.GetElementsByClassName("content", node => {
                name = node.GetData("name");
                if (string.IsNullOrEmpty(name) == false)
                {
                    var r = Load(path, name).Root;
                    node.InnerHTML = r.InnerHTML;
                }    
            });

            return rz;
        }
    }
}