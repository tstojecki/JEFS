using System;
using System.Runtime.InteropServices;
using System.Security.Permissions;
using Microsoft.SharePoint;
using Microsoft.SharePoint.Security;
using System.Text;
using System.Text.RegularExpressions;

namespace JEFS.Features.JEFS_Root_List_Feature
{
    /// <summary>
    /// This class handles events raised during feature activation, deactivation, installation, uninstallation, and upgrade.
    /// </summary>
    /// <remarks>
    /// The GUID attached to this class may be used during packaging and should not be modified.
    /// </remarks>

    [Guid("3e1d8ba3-a0b7-4762-bfa3-a77f5066d1fe")]
    public class JEFS_Root_List_FeatureEventReceiver : SPFeatureReceiver
    {
        /// <summary>
        /// JEFS uses this handler to set the site collection relative links on the editor.aspx page
        /// </summary>
        /// <param name="properties"></param>
        public override void FeatureActivated(SPFeatureReceiverProperties properties) {

            base.FeatureActivated(properties);

            var site = properties.Feature.Parent as SPSite;

            var file = site.RootWeb.GetFile("lists/jefs/jefs.aspx");
            var content = Encoding.UTF8.GetString(file.OpenBinary());

            var siteUrl = site.ServerRelativeUrl;
            if (!siteUrl.EndsWith("/"))
                siteUrl = siteUrl + "/";

            content = content.Replace("~sitecollection/", siteUrl);

            file.SaveBinary(Encoding.UTF8.GetBytes(content));
        }        
    }
}
