using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace System.Web
{
    public class HtmlField : Document
    {
        public string Name { get => GetString(nameof(Name)); set => Push(nameof(Name), value); }
        public string ClassName { get => GetString(nameof(ClassName)); set => Push(nameof(ClassName), value); }
        public string IconName { get => GetString(nameof(IconName)); set => Push(nameof(IconName), value); }
        public string Options { get => GetString(nameof(Options)); set => Push(nameof(Options), value); }
        public string Input { get => GetString(nameof(Input)); set => Push(nameof(Input), value); }
        public bool Required { get => GetValue<bool>(nameof(Required), true); set => Push(nameof(Required), value); }
        public string Caption { get => GetString(nameof(Caption)); set => Push(nameof(Caption), value); }
        public override string ToString()
        {
            var context = new Document();
            foreach (var p in this.GetType().GetProperties())
            {
                var v = p.GetValue(this);
                if (v == null) continue;

                var name = char.ToLower(p.Name[0]) + p.Name.Substring(1);
                context.Add(name, v);
            }
            return context.ToString();
        }
    }
    public class HtmlList<T> : List<T>
    {
        public HtmlString ToHtml()
        {
            return new HtmlString(this.ToString());
        }
        public override string ToString()
        {
            var lst = new List<string>();
            foreach (var field in this)
            {
                lst.Add(field.ToString());
            }
            return '[' + string.Join(",", lst) + ']';
        }
    }
    public class HtmlFieldList : HtmlList<HtmlField>
    {
        public HtmlFieldList SetValues(Document context)
        {
            if (context != null)
            {
                foreach (var field in this)
                {
                    if (field.Value == null)
                    {
                        field.Value = context.GetString(field.Name);
                    }
                }
            }
            return this;
        }
    }
    public class HtmlSection
    {
        public string Text { get; set; } = string.Empty;
        public HtmlFieldList Fields { get; set; } = new HtmlFieldList();
        public override string ToString()
        {
            return ("{ text: '" + Text + "', fields: " + Fields.ToString() + '}');
        }
    }
    public class HtmlSectionList : HtmlList<HtmlSection>
    {
        public HtmlSectionList SetValues(Document context)
        {
            foreach (var section in this)
            {
                section.Fields.SetValues(context);
            }
            return this;
        }
        public void EachField(Action<HtmlField> callback)
        {
            foreach (var section in this)
            {
                foreach (var field in section.Fields)
                {
                    callback.Invoke(field);
                }
            }
        }

        public HtmlString ToHtmlForm()
        {
            string s = "<div>";

            Action<string, string> attr = (name, value) =>
            {
                if (value != null)
                {
                    s += string.Format($" {name}=\"{value}\"");
                }
            };

            foreach (var section in this)
            {
                s += "\n<section><h5>" + section.Text + "</h5>";
                foreach (var field in section.Fields)
                {
                    s += "\n    <input name=\"" + field.Name + "\"";
                    attr("data-caption", field.Caption);
                    attr("class", field.Input);
                    attr("data-options", field.Options);

                    if (field.Required)
                    {
                        s += "required";
                    }

                    var layout = field.ClassName;
                    if (layout != null)
                    {
                        var i = layout.LastIndexOf('-');
                        attr("data-layout", layout.Substring(i + 1));
                    }

                    s += "/>";
                }
                s += "\n</section>";
            }
            s += "</div>";
            return new HtmlString(s);
        }
    }
    public class HtmlTable
    {
        public string Caption { get; set; }
        public HtmlFieldList Columns { get; set; }
    }
}

namespace System.Web
{
    using System.Xml;
    public class HtmlNode
    {
        List<string> _classes;
        HtmlNodeList _childs;
        public XmlElement Element { get; }
        public HtmlNodeList Childs
        {
            get
            {
                if (_childs == null)
                {
                    _childs = new HtmlNodeList();
                    var node = FirstChild;
                    while (node != null)
                    {
                        _childs.Add(node);
                        node = node.NextSibling;
                    }
                }
                return _childs;
            }
        }
        public string Id => Element.GetAttribute("id");
        public string TagName => Element.Name;
        public string InnerHTML { get => Element.InnerXml; set => Element.InnerXml = value; }
        public string OuterHTML => Element.OuterXml;
        HtmlNode GoDown(XmlNode start)
        {
            XmlNode child = start;
            while (child != null)
            {
                if (child.NodeType == XmlNodeType.Element)
                {
                    return new HtmlNode(child);
                }
                child = child.NextSibling;
            }
            return null;

        }
        HtmlNode GoUp(XmlNode start)
        {
            XmlNode child = start;
            while (child != null)
            {
                if (child.NodeType == XmlNodeType.Element)
                {
                    return new HtmlNode(child);
                }
                child = child.PreviousSibling;
            }
            return null;

        }
        public HtmlNode FirstChild => GoDown(Element.FirstChild);
        public HtmlNode LastChild => GoUp(Element.LastChild);
        public HtmlNode NextSibling => GoDown(Element.NextSibling);
        public HtmlNode PreviousSibling => GoUp(Element.PreviousSibling);
        public HtmlNode Parent => new HtmlNode(Element.ParentNode);
        public List<string> ClassList
        {
            get
            {
                if (_classes == null)
                {
                    var s = Element.GetAttribute("class");

                    _classes = new List<string>();
                    if (!string.IsNullOrEmpty(s))
                    {
                        _classes.AddRange(s.Split(' '));
                    }
                }
                return _classes;
            }
        }
        public string GetAttribute(string name)
        {
            return Element.GetAttribute(name);
        }
        public HtmlNode SetAttribute(string name, object value)
        {
            if (value == null || value.Equals(string.Empty))
            {
                Element.RemoveAttribute(name);
            }
            else
            {
                Element.SetAttribute(name, value.ToString());
            }
            return this;
        }
        public string GetData(string name)
        {
            return Element.GetAttribute("data-" + name);
        }
        public HtmlNode SetData(string name, object value)
        {
            return SetAttribute("data-" + name, value);
        }
        public void ForNodes(Action<HtmlNode> callback)
        {
            XmlNode child = Element.FirstChild;
            while (child != null)
            {
                if (child.NodeType == XmlNodeType.Element)
                {
                    var node = new HtmlNode(child);
                    callback?.Invoke(node);

                    node.ForNodes(callback);
                }
                child = child.NextSibling;
            }
        }
        public HtmlNode Remove()
        {
            Element.ParentNode.RemoveChild(Element);
            return this;
        }
        public HtmlNode Append(HtmlNode node)
        {
            this.Element.AppendChild(node.Element);
            return node;
        }
        public HtmlNode Append(string tagName)
        {
            var node = new HtmlNode(Element.OwnerDocument.CreateElement(tagName));
            return Append(node);
        }
        public HtmlNode(XmlNode e)
        {
            Element = (XmlElement)e;
        }
        public HtmlString ToHtml() => new HtmlString(OuterHTML);
    }
    public class HtmlNodeList : List<HtmlNode>
    {
    }
    public partial class MyRazor
    {
        Dictionary<string, HtmlNodeList> _selectClass;
        Dictionary<string, HtmlNode> _selectId;
        static public string TemplatePath { get; set; }
        static public string Path(string path)
        {
            return TemplatePath + path;
        }
        static public MyRazor Load(string name) => Load(TemplatePath, name);
        static public MyRazor Load(string folder, string name) => Load(folder, name, null);
        static public MyRazor Load(string folder, string name, Action<string, HtmlNode> completed)
        {
            var path = $"{folder}/{name}.cshtml";
            var razor = new MyRazor();
            var doc = new XmlDocument {
                InnerXml = "<div></div>"
            };
            try
            {
                var file = new System.IO.FileInfo(path);
                if (file.Exists)
                {
                    using (var sr = file.OpenText()) 
                    {
                        doc.DocumentElement.InnerXml = sr.ReadToEnd();
                    }
                }
            }
            catch
            {
            }
            razor.Root = new HtmlNode(doc.DocumentElement);
            completed?.Invoke(path, razor.Root);

            return razor;
        }
        static public void Update(string folder, string name, string content)
        {
            using (var sw = new System.IO.StreamWriter(string.Format($"{folder ?? TemplatePath}/{name}.cshtml")))
            {
                sw.Write(content.Replace("<br>", "<br/>"));
            }
        }
        static public void Update(string name, string content) => Update(null, name, content);
        public HtmlNode Root { get; set; }
        public MyRazor Append(string name)
        {
            Root.InnerHTML += MyRazor.Load(name).Root.OuterHTML;
            return this;
        }
        public HtmlNodeList GetElementsByClassName(string name, Action<HtmlNode> callback)
        {
            if (_selectClass == null)
            {
                _selectClass = new Dictionary<string, HtmlNodeList>();
            }
            HtmlNodeList list;
            if (_selectClass.TryGetValue(name, out list) == false)
            {
                _selectClass.Add(name, list = new HtmlNodeList());
                Root.ForNodes(node =>
                {
                    if (node.ClassList.Contains(name))
                    {
                        list.Add(node);
                    }
                });
            }
            if (callback != null)
            {
                foreach (var node in list)
                {
                    callback(node);
                }
            }
            return list;
        }
        public HtmlNode GetElementById(string id)
        {
            HtmlNode res = null;
            if (_selectId == null)
            {
                _selectId = new Dictionary<string, HtmlNode>();
                Root.ForNodes(node =>
                {
                    var key = node.Id;
                    if (!string.IsNullOrEmpty(key))
                    {
                        _selectId.Add(key, node);
                    }
                });
            }
            _selectId.TryGetValue(id, out res);
            return res;
        }
        public override string ToString()
        {
            return Root.InnerHTML;
        }
        public MyRazor SetValue(Document context)
        {
            GetElementsByClassName("field", node =>
            {
                var name = node.GetData("name");
                object v = context.GetValue<object>(name);

                if (node.TagName == "a")
                {
                    node.SetAttribute("href", (string)v ?? "#");
                    return;
                }

                if (node.TagName == "img")
                {
                    node.SetAttribute("src", (string)v ?? "");
                    return;
                }

                if (v == null)
                {
                    node.InnerHTML = node.GetData("default");
                    return;
                }

                string f = node.GetData("format");
                if (!string.IsNullOrEmpty(f))
                {
                    switch (f)
                    {
                        case "date":
                        case "datetime":
                            bool t = f.Length > 4;
                            if (v is string)
                            {
                                v = DateTime.Parse((string)v);
                            }
                            f = "dd/MM/yyyy";
                            if (t) { f += " HH:mm"; }
                            break;

                        case "upper":
                            v = ((string)v).ToUpper();
                            break;

                        case "lower":
                            v = ((string)v).ToLower();
                            break;
                    }
                    f = "{0:" + f + '}';
                    v = string.Format(f, v);
                }
                else
                {
                    //string s = v as string;
                    //if (s != null)
                    //{
                    //    v = s.Replace("<br>", "<br/>").Replace("<hr>", "<hr/>").Replace("&", "&amp;");
                    //}
                }
                node.InnerHTML = v.ToString();
            });
            return this;
        }
        public virtual HtmlString Render()
        {
            return new HtmlString(ToString());
        }
        public virtual HtmlString Render(Document context)
        {
            if (context == null)
            {
                return null;
            }
            return new HtmlString(SetValue(context).ToString());
        }

        static public HtmlString Read(string path)
        {
            try
            {
                using (var sr = new System.IO.StreamReader(path))
                {
                    var content = sr.ReadToEnd();
                    return (new HtmlString(content));
                }
            }
            catch
            {
            }
            return new HtmlString("");
        }
        static public HtmlString Read(string folder, object name)
        {
            if (name == null)
            {
                return new HtmlString("");
            }    
            return Read($"{folder ?? TemplatePath}/{name}.cshtml");
        }
    }
}