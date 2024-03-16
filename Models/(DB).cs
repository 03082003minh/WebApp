using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;
using BsonData;

namespace System
{
    public partial class DB
    {
        static public MainDatabase Main { get; set; }
        static public Database Start(string path)
        {
            Main = new MainDatabase("MainDB");
            Main.Connect(path);

            return Main;
        }
        //static public Database Add(string name) => Add(new Database(name));
        
        static public Collection GetCollection<T>()
        {
            return AsyncGetCollection<T>(0);
        }
        static public Collection AsyncGetCollection<T>(int wait)
        {
            if (wait != 0)
            {
                System.Threading.Thread.Sleep(wait);
            }
            var data = Main.GetCollection(typeof(T).Name);
            if (wait == 0)
            {
                data.Wait(null);
            }
            return data;
        }

        static public DocumentList Select(string name, string[] fields)
        {
            var s = name.Split('.');
            var db = Main.Childs[s[0]];

            return db == null ? null : db.Select(s[1], fields);
        }

        public class Query
        {
            public string Command { get; set; }
            public List<string> Columns { get; set; }
            public string TableName { get; set; }
            public DocumentList Result { get; set; }
            public bool Valid => Command != null && Columns != null && TableName != null;
            public Query()
            {
                Command = "SELECT";
            }
            public Query(string query) : this()
            {
                var Q = query.ToUpper();
                var i = query.IndexOf(' ');
                var k = Q.IndexOf(" FROM ", i + 1);
                if (k < 0) { return; }

                var fields = query.Substring(i, k - i).Trim();
                if (fields == string.Empty) { return; }

                k += 6;
                if (k >= Q.Length) { return; }

                Columns = new List<string>();
                if (fields != "*")
                {
                    foreach (var s in fields.Split(','))
                    {
                        var v = s.Trim();
                        if (v == string.Empty) continue;
                        if (v[0] == '[') v = v.Substring(1, v.Length - 2).Trim();

                        Columns.Add(v);
                    }
                }
                Command = Q.Substring(0, i);
                TableName = Q.Substring(k).Trim();
            }

            public Query Run()
            {
                Result = DB.Select(TableName, Columns.ToArray());
                return this;
            }
        }

    }
}