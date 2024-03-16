using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Xml;
using System.IO;

namespace System.Web
{
    public class HtmlDocument : XmlDocument
    {
        HtmlNode _body;
        HtmlNode _head;
        void LoadContent()
        {
            if (_body == null)
            {
                foreach (XmlNode node in this.DocumentElement)
                {
                    var e = node as XmlElement;
                    if (e != null)
                    {
                        _body = new HtmlNode(e);
                        switch (e.Name[0])
                        {
                            case 'h': _head = _body; continue;
                        }
                    }
                }
            }
        }
        public HtmlNode Head
        {
            get
            {
                LoadContent();
                return _head;
            }
        }
        public HtmlNode Body
        {
            get
            {
                LoadContent();
                return _body;
            }
        }

        public byte[] ToBytes()
        {
            return System.Text.Encoding.UTF8.GetBytes(this.DocumentElement.OuterXml);
        }
    }
}