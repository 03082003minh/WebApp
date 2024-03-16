using BsonData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace System
{
    partial class Document
    {
        public string UserName { get => ObjectId; set => ObjectId = value; }
        public string Password { get => GetString(nameof(Password)); set => Push(nameof(Password), value); }
        public string Role { get => GetString(nameof(Role)); set => Push(nameof(Role), value); }
        public string Token { get { return GetString("token"); } set => Push("token", value); }
        public DateTime? Timeout { get { return GetDateTime(nameof(Timeout)); } set => Push(nameof(Timeout), value); }
        public string LastLogin
        {
            get => GetString(nameof(LastLogin));
            set => SetString(nameof(LastLogin), value);
        }

        public static Document Error100 => new Document { Code = 100, Message = "Action Invalid" };
        public static Document ErrorInsert => new Document { Code = 1, Message = "Entity exists" };
        public static Document Error400 => new Document { Code = 400, Message = "Not Found" };
        #region API RESPONSE
        public Document CallAPI(string url, System.Document context, Func<string, Document> parse)
        {
            var request = WebRequest.Create(url);
            try
            {
                request.Method = "POST";
                request.ContentType = "application/json";


                using (var sw = new System.IO.StreamWriter(request.GetRequestStream()))
                {
                    sw.Write(context.ToString());
                }

                var response = request.GetResponse() as HttpWebResponse;
                using (var stream = response.GetResponseStream())
                {
                    using (var reader = new System.IO.StreamReader(stream, Encoding.UTF8))
                    {
                        var content = reader.ReadToEnd();
                        if (parse != null)
                        {
                            return parse(content);
                        }
                        return Parse<Document>(content);
                    }
                }
            }
            catch (Exception e)
            {
                return Error(400, e.Message);
            }
        }
        protected Document CreateApiResponse(int code, string message, object value)
        {
            var context = new Document
            {
                Code = code,
                Message = message,
                Value = value,
            };
            return context;
        }
        public Document Result(object value)
        {
            return value == null ? Error(400, "Not found") : Ok(value);
        }
        public virtual Document Ok(object value)
        {
            return CreateApiResponse(0, null, value);
        }
        public virtual Document Ok()
        {
            return Ok(null);
        }
        public virtual Document Error(int code, string message)
        {
            return CreateApiResponse(code, message, null);
        }
        #endregion

        #region Account
        public void UpateAccount(Action<Document> action)
        {
            DB.Accounts.FindAndUpdate(SoDT, e => action(e));
        }
        #endregion
    }
}

namespace System
{
    using BsonData;
    public static class ActionCode
    {
        public const int Delete = -1;
        public const int Default = 0;
        public const int Insert = 1;
        public const int Refresh = 2;
        public const int Find = 3;
        public const int Filter = 4;
        public const int Detail = 5;
        public const int Update = 100;
        public const int History = 500;
        public const int Download = 1000;

        public static object Manage(Collection db, Document context)
        {
            var code = context.Code;
            var id = context.ObjectId;

            if (code == Default)
            {
                if (id != null)
                {
                    return db.Find(id);
                }
                return new DocumentList(db.Select());
            }

            if (code == Delete)
            {
                if (id == null)
                {
                    var items = context.GetArray<List<string>>("items");
                    if (items == null)
                    {
                        db.DeleteAll();
                    }
                    else
                    {
                        foreach (var s in items)
                        {
                            db.Delete(s);
                        }
                    }
                    return items;
                }

                db.Delete(id);
                return id;
            }

            context = context.ValueContext;
            if (id != null)
            {
                context.ObjectId = id;
                db.InsertOrUpdate(context);
                return id;
            }

            db.Insert(null, context);
            return context.ObjectId;
        }
    }
}

namespace System
{

    public partial class Account : Document
    {
        #region Attributes
        #endregion

        public Account() { }
        public Account(string userName, string password)
        {
            var u = userName.ToLower();
            if (password != null)
            {
                password = u.JoinMD5(password);
            }
            UserName = u;
            Password = password;
        }
        public Account(string userName, string password, string role)
            : this(userName, password)
        {
            Role = role;
        }

        public virtual bool IsPasswordValid(string original, string encriped)
        {
            var epw = this.Password;
            if ((epw == null && UserName != original)
                || (epw != null && epw != encriped))
            {
                return false;
            }
            return true;
        }
        public static Type GetAccountType(string role)
        {
            return Type.GetType("Actors." + role);
        }
    }
}

#region API
namespace System
{
    partial class Account
    {
        Document CreateToken(Account acc)
        {
            var role = acc.Role;
            var type = Type.GetType("Actors." + role);
            var o = Activator.CreateInstance(type) as User;
            o.Copy(acc);

            var token = acc.UserName.JoinMD5(DateTime.Now);
            o.Token = token;
            o.Password = null;
            o.Role = role;

            if (DB.Users.ContainsKey(token) == false)
            {
                DB.Users.Add(token, o);
            }

            return o;
        }
        static public Account FindOne(string id)
        {
            if (string.IsNullOrEmpty(id))
            {
                return null;
            }    

            var e = DB.Accounts.Find<Account>(id);
            return e;
        }
        public object FindOne(Document context)
        {
            var un = context.UserName;
            var e = FindOne(un);
            if (e == null)
            {
                return Error(-1, "User not found");
            }

            var pw = e.Password;
            if (string.IsNullOrWhiteSpace(pw))
            {
                return Ok(CreateToken(e));
            }    
            return Ok(e);
        }
        public virtual Document TryLogin()
        {
            var e = FindOne(UserName);
            if (e == null)
            {
                return Error(-1, "User not found");
            }
            var pw = e.Password;
            if (!string.IsNullOrEmpty(pw))
            {
                var ps = Password;
                if (string.IsNullOrEmpty(ps))
                {
                    return Error(1, "Password required");
                }
                var a = new Account(e.ObjectId, ps);
                if (pw != a.Password)
                {
                    return Error(2, "Password invalid");
                }
            }
            return Ok(CreateToken(e));
        }
        public object ChangePassword(Document context)
        {
            var db = DB.Accounts;
            var un = this.UserName;
            var ps = context.Password;

            if (!string.IsNullOrEmpty(ps))
            {
                var acc = new Account(un, ps);
                ps = acc.Password;
            }

            db.FindAndUpdate(un, doc => doc.Password = ps);
            return Ok();
        }
    }
    public partial class User : Account
    {
    }

}
#endregion

namespace System
{
    using Actors;
    partial class DB
    {
        static Collection _accounts;
        public static Collection Accounts
        {
            get
            {
                if (_accounts == null)
                {
                    _accounts = Main.GetCollection(nameof(Accounts));
                }
                return _accounts;
            }
        }

        static TokenMap _users;
        static public TokenMap Users
        {
            get
            {
                if (_users == null)
                {
                    _users = new TokenMap();
                }
                return _users;
            }
        }
    }
}
