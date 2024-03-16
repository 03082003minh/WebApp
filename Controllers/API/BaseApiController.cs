using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Reflection;
using System.Threading;
using System.Web.Http;
using BsonData;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace System.Web
{
    public class App
    {
        public static string Domain { get; set; }
    }
}

namespace System
{
    public abstract class BaseApiRestful
    {
        protected Document RequestContext { get; set; }
        protected User User { get; set; }

        protected object _value;
        protected object Value
        {
            get
            {
                if (_value == null) _value = RequestContext.Value;
                return _value;
            }
        }
        Document _context;
        protected Document ValueContext
        {
            get
            {
                if (_context == null)
                {
                    _context = Value == null ? new Document() : Document.FromObject(_value);
                }
                return _context;
            }
            set => _context = value;
        }

        protected virtual bool CheckRoleCore() => User != null;
        public virtual bool CheckRole(string method, Document context)
        {
            RequestContext = context;
            if (method != "GET")
            {
                var token = context.Token;
                if (token != null)
                {
                    User u = null;
                    if (DB.Users.TryGetValue(token, out u))
                        User = u;
                }
            }
            else
            {
                _value = context;
                User = new User();
            }    

            return CheckRoleCore();
        }

        static public object ActionNotFound() => Error(404, "Action not found");
        static public object TokenError() => Error(100, "Token Error");
        static public object Error(int code, string message) => new Document { Code = code, Message = message };
        static public object Error(int code) => new Document { Code = code };
        static public object Success() => "{}";
        static public object Success(object model) => new Document { Value = model };
        static public object Success(object model, string message) => new Document { Value = model, Message = message };
    }
    public class AllController : ApiController
    {
        static Dictionary<string, Type> _map;
        object Exec(string method, Document context)
        {
            var url = context.Url;
            if (string.IsNullOrWhiteSpace(url))
            {
                return BaseApiRestful.Error(404, "ACTION");
            }
            
            if (_map == null)
            {
                _map = new Dictionary<string, Type>();
                foreach (var type in Assembly.GetAssembly(typeof(BaseApiRestful)).GetTypes())
                {
                    var name = type.Name;
                    if (name.EndsWith(AppKeys.Restful))
                    {
                        name = name.Substring(0, name.Length - AppKeys.Restful.Length).ToLower();
                        if (name != string.Empty && _map.ContainsKey(name) == false)
                            _map.Add(name, type);
                    }
                }
            }

            Func<string, string> get_name = (inp) => {
                var r = "";
                foreach (var c in inp)
                {
                    if (c == '-') continue;
                    r += char.ToLower(c);
                }
                return r;
            };
            
            var s = url.Split('/');
            var cname = get_name(s[0]);

            Type ctype;
            if (_map.TryGetValue(cname, out ctype) == false)
            {
                return BaseApiRestful.ActionNotFound();
            }

            var action = (s.Length > 1 ? get_name(s[1]) : method.ToLower());
            foreach (var func in ctype.GetMethods())
            {
                if (func.GetParameters().Length == 0 && func.Name.ToLower() == action)
                {
                    var controller = (BaseApiRestful)Activator.CreateInstance(ctype);
                    if (controller.CheckRole(method, context) == false)
                    {
                        return BaseApiRestful.Error(-1, "SESSION");
                    }
                    return func.Invoke(controller, new object[] { });
                }
            }
            return BaseApiRestful.ActionNotFound();
        }

        public object Get(string id)
        {
            return Exec("GET", Document.Parse(id.FromBase64()));
        }
        public object Post(Document context)
        {
            return Exec("POST", context);
        }
    }
}
namespace WebApp
{
    
    using Actors;
    using System.Web;

    public class BaseApiController : ApiController
    {
        Document _context;
        protected Document ValueContext
        {
            get
            {
                if (_context == null)
                {
                    _context = Document.FromObject(Value);
                }
                return _context;
            }
        }
        new public User User { get; set; }

        string _url;
        string _token;
        object _value;
        new protected string Url
        {
            get
            {
                if (_url == null) _url = RequestContext.Url;
                return _url;
            }
        }

        protected string Token
        {
            get
            {
                if (_token == null) _token = RequestContext.Token;
                return _token;
            }
        }
        protected object Value
        {
            get
            {
                if (_value == null) _value = RequestContext.Value;
                return _value;
            }
        }
        new protected Document RequestContext { get; set; }

        protected object CheckToken(Document context, Func<object> func)
        {
            User = DB.Users.Find(context.Token);
            if (User == null)
            {
                return TokenError();
            }
            return func();
        }
        protected object TryDelete<T>(Document context, Func<string, object> func)
        {
            return CheckToken(context, () => {
                if (User is T)
                    return func((string)context.Value);
                return TokenError();
            });
        }
        protected object TryUpdate<T>(Document context, Func<Document, object> func)
        {
            return CheckToken(context, () => {
                if (User is T)
                    return func(context.ValueContext);
                return TokenError();
            });
        }
        protected object ActionNotFound() => Error(404, "ACTION");
        protected object TokenError() => Error(100, "TOKEN");
        protected object Error(int code, string message) => new Document { Code = code, Message = message };
        protected object Error(int code) => new Document { Code = code };
        protected object Success() => "{}";
        protected object Success(object model) => new Document { Value = model };
        protected object Success(object model, string message) => new Document { Value = model, Message = message };
    }
}
