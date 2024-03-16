using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace System.Web
{
    public partial class FolderContext : Document
    {
        public FolderContext() { }
        public FolderContext(string text)
        {
            Add("name", text);
        }

        public FolderContext Text(string text)
        {
            Push("name", text);
            return this;
        }
        DocumentList subs;
        DocumentList files;

        public FolderContext Folder(IEnumerable<FolderContext> items)
        {
            foreach (var e in items) Folder(e);
            return this;
        }
        public FolderContext Folder(FolderContext context)
        {
            if (subs == null)
            {
                subs = GetArray<DocumentList>("subs");
                if (subs == null)
                {
                    Add("subs", subs = new DocumentList());
                }    
            }
            subs.Add(context);
            return this;
        }
        public FolderContext Folder(string names)
        {
            foreach (var s in names.Split(';'))
                this.Folder(new FolderContext(s));
            return this;
        }
        public FolderContext File(IEnumerable<Document> items)
        {
            foreach (var e in items) File(e);
            return this;
        }
        public FolderContext File(Document context)
        {
            if (files == null)
            {
                files = GetArray<DocumentList>("files");
                if (files == null)
                {
                    Add("files", files = new DocumentList());
                }
            }
            files.Add(context);
            return this;
        }
        public FolderContext File(string names)
        {
            foreach (var s in names.Split(';'))
                this.File(new FolderContext(s));
            return this;
        }
    }
}