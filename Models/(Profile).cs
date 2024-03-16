using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace System
{
    partial class Document
    {
        public string Avatar { get => GetString(nameof(Avatar)); set => Push(nameof(Avatar), value); }
        public string Email { get => GetString(nameof(Email)); set => Push(nameof(Email), value); }
        public string Ten { get => GetString(nameof(Ten)); set => Push(nameof(Ten), value); }
        public string NgaySinh { get => GetString(nameof(NgaySinh)); set => Push(nameof(NgaySinh), value); }
        public string TrangThai { get => GetString(nameof(TrangThai)); set => Push(nameof(TrangThai), value); }
        public string DanToc { get => GetString(nameof(DanToc)); set => Push(nameof(DanToc), value); }
        public string GioiTinh { get => GetString(nameof(GioiTinh)); set => Push(nameof(GioiTinh), value); }
        public string HoTen { get => GetString(nameof(HoTen)); set => Push(nameof(HoTen), value); }
        public string SoDT { get => GetString(nameof(SoDT)); set => Push(nameof(SoDT), value); }
    }
}

namespace System
{
    public class ProfileCollection : BsonData.Collection
    {
        public ProfileCollection() : base(nameof(DB.Profiles), DB.Main)
        {
        }

        public bool Add(Document context, string id, string role, Action<Account> accountAction)
        {
            if (!Insert(id, context)) return false;
            if (role != null)
            {
                var acc = new Account(id, id.Substring(id.Length - 4), role);
                accountAction?.Invoke(acc);

                DB.Accounts.Insert(acc);
            }
            return true;
        }
        public void Remove(string id, bool removeAccount)
        {
            Delete(id);
            if (removeAccount)
            {
                DB.Accounts.Delete(id);
            }
        }

        public T FindOne<T>(Document source) where T: Document, new()
        {
            var e = Find(source.ObjectId);
            if (e != null)
            {
                return (T)source.ChangeType<T>().Copy(e);
            }
            return null;
        }    
        public DocumentList Select<T>(IEnumerable<string> keys)
            where T: Document, new()
        {
            var lst = new DocumentList();
            foreach (var k in keys)
            {
                var e = Find<T>(k);
                if (e != null)
                {
                    lst.Add(e);
                }    
            }
            return lst;
        }
        public DocumentList Select<T>(IEnumerable<Document> source)
            where T : Document, new()
        {
            var lst = new DocumentList();
            foreach (var o in source)
            {
                var e = FindOne<T>(o);
                if (e != null) lst.Add(e);
            }
            return lst;
        }
    }
    partial class DB
    {

        static ProfileCollection _prof;
        static public ProfileCollection Profiles
        {
            get
            {
                if (_prof == null)
                {
                    _prof = new ProfileCollection();
                }
                return _prof;
            }
        }
    }
}