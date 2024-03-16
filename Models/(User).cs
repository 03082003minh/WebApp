using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Reflection;

namespace System
{
    public class TokenMap : Dictionary<string, User>
    {
        public User Find(string token)
        {
            User u = null;
            this.TryGetValue(token, out u);

            return u;
        }
    }
}

namespace System
{
    using BsonData;

    public partial class Account
    {
    }
}
