using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace WebApp.Controllers
{
    public class HomeController : BaseController
    {
        public override object Index(string id, string view, string data)
        {
            return View(null, null, id);
        }
        public object Login() => View();

        [HttpPost]
        public object Login(Document doc)
        {
            doc.Code = 1;
            return View(doc);
        }
    }
}
