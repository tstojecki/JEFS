using System;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Web.UI.WebControls.WebParts;
using Microsoft.SharePoint;
using System.Text.RegularExpressions;

namespace JEFS.CONTROLTEMPLATES
{
    public partial class JEFS : UserControl
    {
        protected void Page_Load(object sender, EventArgs e) {
                                    
            var ctx = SPContext.Current;
            if (ctx != null) {
                var web = ctx.Site.RootWeb;
                var list = web.Lists.TryGetList("JEFS");
                
                if (list != null && list.Items.Count > 0) {

                    // TODO: figure out encoding that matches javascript encoding
                    var rawUrlNoQuery = Request.RawUrl.Substring(0, Request.RawUrl.IndexOf("?") > 0 ? Request.RawUrl.IndexOf("?") : Request.RawUrl.Length).Replace(" ", "%20");
                    var query = new SPQuery() { Query = string.Format("<Where><Eq><FieldRef Name='Title' /><Value Type='Text'>{0}</Value></Eq></Where>", rawUrlNoQuery) };
                    var items = list.GetItems(query);
                    if (items != null && items.Count > 0) {
                        var script = items[0]["Content"] as string ?? "";
                        var scriptLibs = items[0]["HeadContent"] as string ?? "";

                        jefsScript.Text += string.Concat(scriptLibs, "\n\n");
                        jefsScript.Text += string.Concat("<script type=\"text/javascript\">", script, "</script>");                        

                        Page.ClientScript.RegisterHiddenField("jefs_script", script);
                        Page.ClientScript.RegisterHiddenField("jefs_script_libs", scriptLibs);
                    }
                }
            }
        }
    }
}
