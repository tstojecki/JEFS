(function (jefs, $) {

    jefs.sp = {

        getPageZones: function (url) {
            var env = '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetWebPartPage xmlns="http://microsoft.com/sharepoint/webpartpages"><documentName>' + url + '</documentName><behavior>Version3</behavior></GetWebPartPage></soap:Body></soap:Envelope>';

            $.ajax({
                url: jefs.config.siteCollectionUrl + '_vti_bin/webpartpages.asmx',
                type: 'POST',
                contentType: 'text/xml;charset="utf-8"',
                dataType: 'xml',
                data: env
            })
            .done(function (d) {
                var e = document.createElement("div"),
                    zones = [];

                e.innerHTML = $(d).find("*").filter("getwebpartpageresult").text();

                $.each(e.getElementsByTagName("WebPartPages:WebPartZone"), function () {
                    zones.push($(this).attr("id"));
                });

                jefs.publish("jefs/zones/ready", [zones]);
            })
            .error(function (jqXHR, status, err) {
                jefs.log("Could not retrieve the zones in the page you're editing");
                jefs.log(err);

                // don't publish an error event here
            });
        },

        addWebPart: function (pageUrl, zone, contentUrl, successCallback) {
            var wpXml = '&lt;?xml version=&quot;1.0&quot; encoding=&quot;utf-16&quot;?&gt;&lt;WebPart xmlns:xsd=&quot;http://www.w3.org/2001/XMLSchema&quot; xmlns:xsi=&quot;http://www.w3.org/2001/XMLSchema-instance&quot; xmlns=&quot;http://schemas.microsoft.com/WebPart/v2&quot;&gt;&lt;Title&gt;JEFS Content Editor Web Part&lt;/Title&gt;&lt;FrameType&gt;None&lt;/FrameType&gt;&lt;Description&gt;JEFS HTML Content&lt;/Description&gt;&lt;IsIncluded&gt;true&lt;/IsIncluded&gt;&lt;ZoneID&gt;' + zone + '&lt;/ZoneID&gt;&lt;PartOrder&gt;0&lt;/PartOrder&gt;&lt;FrameState&gt;Normal&lt;/FrameState&gt;&lt;Height /&gt;&lt;Width /&gt;&lt;AllowRemove&gt;true&lt;/AllowRemove&gt;&lt;AllowZoneChange&gt;true&lt;/AllowZoneChange&gt;&lt;AllowMinimize&gt;true&lt;/AllowMinimize&gt;&lt;IsVisible&gt;true&lt;/IsVisible&gt;&lt;DetailLink /&gt;&lt;HelpLink /&gt;&lt;Dir&gt;Default&lt;/Dir&gt;&lt;PartImageSmall /&gt;&lt;MissingAssembly /&gt;&lt;PartImageLarge&gt;/_layouts/images/mscontl.gif&lt;/PartImageLarge&gt;&lt;IsIncludedFilter /&gt;&lt;Assembly&gt;Microsoft.SharePoint, Version=12.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c&lt;/Assembly&gt;&lt;TypeName&gt;Microsoft.SharePoint.WebPartPages.ContentEditorWebPart&lt;/TypeName&gt;&lt;ContentLink xmlns=&quot;http://schemas.microsoft.com/WebPart/v2/ContentEditor&quot;&gt;' + contentUrl + '&lt;/ContentLink&gt;&lt;Content xmlns=&quot;http://schemas.microsoft.com/WebPart/v2/ContentEditor&quot;&gt;&lt;/Content&gt;&lt;PartStorage xmlns=&quot;http://schemas.microsoft.com/WebPart/v2/ContentEditor&quot; /&gt;&lt;/WebPart&gt;',
                env = '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><AddWebPart xmlns="http://microsoft.com/sharepoint/webpartpages"><pageUrl>' + pageUrl + '</pageUrl><webPartXml>' + wpXml + '</webPartXml><storage>Shared</storage></AddWebPart></soap:Body></soap:Envelope>';

            this.postWebPartPageWebService(
                env,
                "http://microsoft.com/sharepoint/webpartpages/AddWebPart",
                successCallback,
                "Could not add the content editor web part to: " + pageUrl
            );
        },

        saveWebPart: function (pageUrl, wpKey, contentUrl, zone, successCallback) {
            var wpXml = '&lt;?xml version=&quot;1.0&quot; encoding=&quot;utf-16&quot;?&gt;&lt;WebPart xmlns:xsd=&quot;http://www.w3.org/2001/XMLSchema&quot; xmlns:xsi=&quot;http://www.w3.org/2001/XMLSchema-instance&quot; xmlns=&quot;http://schemas.microsoft.com/WebPart/v2&quot;&gt;&lt;Title&gt;JEFS Content Editor Web Part&lt;/Title&gt;&lt;FrameType&gt;None&lt;/FrameType&gt;&lt;Description&gt;JEFS HTML Content&lt;/Description&gt;&lt;IsIncluded&gt;true&lt;/IsIncluded&gt;&lt;ZoneID&gt;' + zone + '&lt;/ZoneID&gt;&lt;PartOrder&gt;0&lt;/PartOrder&gt;&lt;FrameState&gt;Normal&lt;/FrameState&gt;&lt;Height /&gt;&lt;Width /&gt;&lt;AllowRemove&gt;true&lt;/AllowRemove&gt;&lt;AllowZoneChange&gt;true&lt;/AllowZoneChange&gt;&lt;AllowMinimize&gt;true&lt;/AllowMinimize&gt;&lt;IsVisible&gt;true&lt;/IsVisible&gt;&lt;DetailLink /&gt;&lt;HelpLink /&gt;&lt;Dir&gt;Default&lt;/Dir&gt;&lt;PartImageSmall /&gt;&lt;MissingAssembly /&gt;&lt;PartImageLarge&gt;/_layouts/images/mscontl.gif&lt;/PartImageLarge&gt;&lt;IsIncludedFilter /&gt;&lt;Assembly&gt;Microsoft.SharePoint, Version=12.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c&lt;/Assembly&gt;&lt;TypeName&gt;Microsoft.SharePoint.WebPartPages.ContentEditorWebPart&lt;/TypeName&gt;&lt;ContentLink xmlns=&quot;http://schemas.microsoft.com/WebPart/v2/ContentEditor&quot;&gt;' + contentUrl + '&lt;/ContentLink&gt;&lt;Content xmlns=&quot;http://schemas.microsoft.com/WebPart/v2/ContentEditor&quot;&gt;&lt;/Content&gt;&lt;PartStorage xmlns=&quot;http://schemas.microsoft.com/WebPart/v2/ContentEditor&quot; /&gt;&lt;/WebPart&gt;',
                env = '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><AddWebPart xmlns="http://microsoft.com/sharepoint/webpartpages"><pageUrl>' + pageUrl + '</pageUrl><webPartXml>' + wpXml + '</webPartXml><storage>Shared</storage></AddWebPart></soap:Body></soap:Envelope>';

            this.postWebPartPageWebService(
                env,
                "http://microsoft.com/sharepoint/webpartpages/SaveWebPart",
                successCallback,
                "Could not update the content editor web part on: " + pageUrl
            );
        },

        deleteWebPart: function (pageUrl, wpKey, successCallback) {
            var env = '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><DeleteWebPart xmlns="http://microsoft.com/sharepoint/webpartpages"><pageUrl>' + pageUrl + '</pageUrl><storageKey>' + wpKey + '</storageKey><storage>Shared</storage></DeleteWebPart></soap:Body></soap:Envelope>'

            this.postWebPartPageWebService(
                env,
                "http://microsoft.com/sharepoint/webpartpages/DeleteWebPart",
                successCallback,
                "Could not delete the content editor web part on: " + pageUrl
            );
        },

        postWebPartPageWebService: function (env, soapActionValue, successCallback, errorMessage) {
            $.ajax({
                url: jefs.config.siteCollectionUrl + '_vti_bin/webpartpages.asmx',
                type: 'POST',
                contentType: 'text/xml;charset="utf-8"',
                dataType: 'xml',
                data: env,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('SOAPAction', soapActionValue);
                }
            })
            .done(function (d) {
                successCallback(d);
            })
            .error(function (jqXHR, status, err) {
                jefs.log(errorMessage, err);
                jefs.publish("jefs/error", err);
            });
        }

    }

})(this.jefs, jQuery);

