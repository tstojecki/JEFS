using System;
using System.Text;
using Microsoft.SharePoint;

namespace JEFS.EventReceiver
{
    /// <summary>
    /// List Item Events
    /// </summary>
    public class EventReceiver : SPItemEventReceiver
    {
       /// <summary>
       /// An item was added.
       /// </summary>
       public override void ItemAdded(SPItemEventProperties properties)
       {
           var item = properties.ListItem;

           string js = item["JS"] as string,
                  html = item["HTML"] as string,
                  css = item["CSS"] as string;
                     
           AddAttachment(item, js, "jefs-my.js", false);
           AddAttachment(item, html, "jefs-my.txt", false);
           AddAttachment(item, css, "jefs-my.css", false);
       }

       /// <summary>
       /// An item was updated
       /// </summary>
       public override void ItemUpdated(SPItemEventProperties properties) {
           var item = properties.ListItem;

           string js = item["JS"] as string,
                  html = item["HTML"] as string,
                  css = item["CSS"] as string;

           AddAttachment(item, js, "jefs-my.js", true);
           AddAttachment(item, html, "jefs-my.txt", true);
           AddAttachment(item, css, "jefs-my.css", true);
       }

        void AddAttachment(SPListItem item, string content, string leafName, bool deleteBefore) {

            base.EventFiringEnabled = false;

            try {
                if (!string.IsNullOrEmpty(content)) {

                    var bytes = new UTF8Encoding().GetBytes(content);

                    if (deleteBefore) {
                        item.Attachments.DeleteNow(leafName);
                        item.Update();
                    }

                    item.Attachments.Add(leafName, bytes);                    
                    item.Update();
                }
            }
            finally {
                base.EventFiringEnabled = true;
            }
        }        
    }
}
