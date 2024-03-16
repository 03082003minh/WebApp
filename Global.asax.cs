using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;

namespace System
{
    public static class AppKeys
    {
        public const string User = "user";
        public const string UserMenu = "user-menu";
        public const string CDP = "cong-doan-phi";
        public const string HoSo = "ho-so";
        public const string LoginInfo = "logged";
        public const string Restful = "Restful";

    }

}

namespace WebApp
{
    public static class Config
    {
        static public string ApplicationName { get; set; }
    }
    public class WebApiApplication : System.Web.HttpApplication
    {
        protected void Application_Start()
        {
            AreaRegistration.RegisterAllAreas();
            GlobalConfiguration.Configure(WebApiConfig.Register);
            FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
            RouteConfig.RegisterRoutes(RouteTable.Routes);
            BundleConfig.RegisterBundles(BundleTable.Bundles);

            MyRazor.TemplatePath = Server.MapPath("/views/_template/");
            DB.Start(Server.MapPath("/app_data"));
        }
    }
}
