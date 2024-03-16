using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace WebApp
{
    public abstract class BaseController : Controller
    {
        public string ControllerName
        {
            get
            {
                var name = this.GetType().Name;
                return name.Substring(0, name.Length - 10);
            }
        }
        protected object ProcessPostData(string json, Func<Document, object> func)
        {
            return func(Document.Parse(json));
        }
        protected virtual object GoFirst() => Redirect($"/{ControllerName}");
        protected virtual object GoHome() => Redirect("/home");

        public virtual object Index(string id, string view, string data)
        {
            if (view != null)
            {
                view = $"~/views/{ControllerName}/{view}.cshtml";
            }    
            return View(view);
        }
    }
}