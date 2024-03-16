using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace System.Web
{
    partial class MyRazor
    {
        static public MyRazor Menu(string name)
        {
            return Load("menu/" + name);
        }
        static public HtmlString HtmlMenu(string name)
        {
            return Menu(name).Render();
        }
    }
}