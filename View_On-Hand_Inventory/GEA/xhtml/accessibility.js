(function(){
	if (window.addEventListener) {
		window.addEventListener('load', function(){loaded();});
	}
	else {
		window.attachEvent("onload", function(){loaded();});
	}
	
	this.loaded = function(){
		//If the document has a different hash tag set, redirect the user to the top.  We don't want to always do this since
		//it causes problems on the end user website.  To allow a user to link directly to a portion of the document, remove this code
		if(document.location.hash!="")
		{
		  document.location.hash="top";
		  setFocus("top");
		}
		hiddenBreakTag();
		setDefaultStyles();
		
		var intraLinks = document.getElementsByTagName('a');
		for(i = 0; i < intraLinks.length; i++)
		{
			var intraLink = intraLinks[i];
			if(intraLink.getAttribute('linktype') == 'intralink' && window.location.href.indexOf('Roaming/ANCILE/uPerform') == -1)
			{
				if (intraLink.addEventListener) {
					intraLink.addEventListener('click', function(e){gotoIntraLink(e);});
				}
				else {
					intraLink.attachEvent("onclick", function(e){gotoIntraLink(e);});
				}				
			}
		}
	}
	
	this.gotoIntraLink=function(e){
		var gotoElement = document.getElementById('block-' + e.target.getAttribute('gotoblockid'));
		if(gotoElement != null)
		{
		    if (window.location.href.indexOf('cc/xhtml') != -1 && gotoElement.parentElement != null)
		    {
		        if (gotoElement.parentElement.nodeName == 'NOTE' && gotoElement.parentElement.parentElement != null && gotoElement.parentElement.parentElement.className != null
                    && gotoElement.parentElement.parentElement.className.indexOf('fd-table-desc-cell') != -1)
		        {
		            gotoElement = gotoElement.parentElement.parentElement.parentElement;
		        }

		        if (gotoElement.parentElement != null && gotoElement.parentElement.parentElement != null && gotoElement.parentElement.parentElement.style.display == 'none')
		        {
		            var hyperLink = gotoElement.parentElement.parentElement.nextSibling.nextSibling.getElementsByTagName('a')[0];
		            if(hyperLink != null)
		            {
		                ShowFieldDescriptionTable(hyperLink);
		            }
		        }
		    }
		    var scrollLeft = (window.parent.pageXOffset !== undefined) ? window.parent.pageXOffset : (window.parent.document.documentElement || window.parent.document.body.parentNode || window.parent.document.body).scrollLeft;
		    if (gotoElement.offsetTop > 0) {
		        window.parent.scrollTo(scrollLeft, gotoElement.offsetTop);
		    }
			gotoElement.focus();							
		}
	}
	this.hiddenBreakTag=function()
	{
		var breakTags = document.getElementsByTagName("br");
		if(breakTags){
			for(i=0; i < breakTags.length; i++)
			{
				var style = breakTags[i].getAttribute("style");
				if(style)
				{
          if(typeof style == "string")
          {
            var styleAttr = style;
          }
          else if(typeof style == "object")
          {
            var styleAttr = style.cssText;
          }
            
          if(styleAttr.indexOf("always") != -1)
          {
            breakTags[i].style.display = 'none';
          }					
				}
			}
		}
	};
  // Patches TOC nav and Section nav DIV styles if dir is RTL
  this.setDefaultStyles=function()
  {
    var htmlEl = document.getElementsByTagName("html")[0];
    var toc = document.getElementById("toc");
	toc.style.width = "1px";
    toc.style.height = "1px";

    var sectionNavEls = document.querySelectorAll(".section-nav");
    var len = sectionNavEls.length;
    for (var i = len - 1; i >= 0; i--)
    {
        var el = sectionNavEls[i];
		el.style.width = "1px";
        el.style.height = "1px";
		el.style.overflow = "hidden"; 
		el.style.padding = 0;
		el.style.clip = "rect(0 0 0 0)";
		el.style.border = 0;
		el.style.position = "absolute";
		el.style.margin = "-1px";	
	};
  };
	this.setFocus=function(id)
	{
		var el = document.getElementById(id.toLowerCase());
		if(el)
		{
			document.location.hash=id.toLowerCase();
			el.focus();
		}
	};
	this.handleKeyDown=function(e,id)
	{
		if(!e) var e = window.event;
		if(e.keyCode == 13)
		{
			setFocus(id);
		}
	};
	this.showParentOnFocus=function(id)
	{
		var el = document.getElementById(id);
		var htmlEl = document.getElementsByTagName("html")[0];
		if(el)
		{
			if(htmlEl.dir.toLowerCase() === "rtl")
			{
				el.style.right = 0;
				el.style.width = "auto";
				el.style.height = "auto";
			} else {
				el.style.left = 0;
			}
			
			el.style.position = 'static';
			el.style.display = 'inline';
		}
	};
	this.hideParentOnBlur=function(link, id)
	{
		var el = document.getElementById(id);
		var htmlEl = document.getElementsByTagName("html")[0];
		if(el)
		{
			el.style.width = "1px";
			el.style.height = "1px";
				
			var x = el.getElementsByTagName('a').length - 1;
			if (link == el.getElementsByTagName('a')[x]){
				el.style.width = "1px";
				el.style.height = "1px";
				el.style.overflow = "hidden"; 
				el.style.padding = 0;
				el.style.clip = "rect(0 0 0 0)";
				el.style.border = 0;
				el.style.position = "absolute";
				el.style.margin = "-1px";
			} else {
				el.style.position = 'absolute';
				el.style.display = 'block';
			}
		}
	};
})();

/* 
 * This function is used to scroll to the help content
 * This will be invoked in server, in function finalizeIframeForUperform, in viewContent.js
 */
function scrollToHelpContent() {
	var primaryValue = getParameterByName('primaryCSH');
	var secondaryValue = getParameterByName('secondaryCSH');
	var tertiaryValue = getParameterByName('tertiaryCSH');
	var application = getParameterByName('application');

	// generic csh
	if (primaryValue == null || primaryValue == "") {
		primaryValue = getParameterByName('csh');
	}
	if (primaryValue != null && primaryValue != "") {
		var firstFound = searchElementByCSHs(primaryValue, secondaryValue, tertiaryValue, application);
		if (firstFound)	{
			firstFound.scrollIntoView();
		}
	}
}

/*
 * This function is used to search element by CSH values
 */
function searchElementByCSHs(primaryValue, secondaryValue, tertiaryValue, application) {
	// all CSH values are in <div> tags
	var allTableElements = document.getElementsByTagName('div');
	
	// the space can be double encoded -> decode once
	if (primaryValue != null && primaryValue != "") {
		primaryValue = primaryValue.replace(/%2520/g, "%20");
	}
	
	// the space can be double encoded -> decode once
	if (secondaryValue != null && secondaryValue != "") {
		secondaryValue = secondaryValue.replace(/%2520/g, "%20");
	}
	
	// the space can be double encoded -> decode once
	if (tertiaryValue != null && tertiaryValue != "") {
		tertiaryValue = tertiaryValue.replace(/%2520/g, "%20");
	}
	
	//! ( ) is manually encoded by uP server but not uP client
	// Because uP client using URI.EscapeDataString(), and this function doesn't encode those character
	try
	{
		primaryValue = decodeURIComponent(primaryValue);
	}
	catch(e)
	{}
	
	try
	{
		secondaryValue = decodeURIComponent(secondaryValue);
	}
	catch(e)
	{}
	
	try
	{
		tertiaryValue = decodeURIComponent(tertiaryValue);
	}
	catch(e)
	{}
	
	var partialMatchElement;
	
	for (var i = 0; i < allTableElements.length; i++) {
		var primary = allTableElements[i].getAttribute('primaryCSH');
		var secondary = allTableElements[i].getAttribute('secondaryCSH');
		var tertiary = allTableElements[i].getAttribute('tertiaryCSH');
		
		if (primary != null && primary != "" && secondary != null && tertiary != null) {
			// the space can be double encoded -> decode once
			primary = primary.replace(/%2520/g, "%20");
			secondary = secondary.replace(/%2520/g, "%20");
			tertiary = tertiary.replace(/%2520/g, "%20");
			
			//! ( ) is manually encoded by uP server but not uP client
			// Because uP client using URI.EscapeDataString(), and this function doesn't encode those character
			
			try
			{
				primary = decodeURIComponent(primary);
			}
			catch(e){}
			
			try
			{
				secondary = decodeURIComponent(secondary);
			}
			catch(e){}
			
			try
			{
				tertiary = decodeURIComponent(tertiary);
			}
			catch(e){}
			
			if (application == "Generic" && 
			    (primary.indexOf("http_//") == 0 || primary.indexOf("https_//") == 0 || primary.indexOf("file_///") == 0)) 
			{
				//For generic CSH (the csh in help call contains 3 csh, separated by "_" character
				var genericCSH = primary;
				if(tertiary == null || tertiary == "")
				{
					if(secondary != null && secondary != "")
					{
						genericCSH = primary + "_" + secondary;
					}
				}
				else
				{
					genericCSH = primary + "_" + secondary + "_" + tertiary;
				}
				
				if (genericCSH == primaryValue) 
				{
					// return first found
					return allTableElements[i];
				}
			}
			else if (application == "SAP+Portal") 
			{
				//SAP Portal: CE captures multiple iViewID, but help call only has 1 iViewID
				//Use method search in
				if ((primary.indexOf(primaryValue)!=-1) 
					&& (secondary.indexOf(secondaryValue)!=-1) 
					&& (tertiary.indexOf(tertiaryValue))!=-1) 
				{
					// return first found
					return allTableElements[i];
				}
			}
			else if (application == "ANCILE+Help+Launchpad") {
				//WEBSAP7, SAPWINGUI COMPLEX CSH
				if (secondary != "" && tertiary != "") {
					var complexCSH = primary + ":" + secondary + ":" + tertiary;
					if (complexCSH == primaryValue) 
					{
						//1. SAP SERVER: "XXXX:YYYYYY:ZZZZ" | DOCUMENT: { pri="XXXX", sec="YYYYYY", ter="ZZZZ" }
						// return first found
						return allTableElements[i];
					}
					else if (partialMatchElement == null
						&& complexCSH.indexOf(primaryValue) == 0) 
					{
						//2. SAP SERVER: "XXXX" | DOCUMENT: { pri=XXXX, sec=YYYYYY, ter=ZZZZ }
						// return first found
						partialMatchElement = allTableElements[i];
					}
				}				
				else if (secondary == "" && tertiary == "") 
				{
					if (primary == primaryValue) 
					{
						//4. SAP SERVER: "XXXX" | DOCUMENT: { pri=XXXX }
						// return first found
						return allTableElements[i];
					}
					else if (partialMatchElement == null
						&& primaryValue.indexOf(primary) == 0) 
					{
						//3. SAP SERVER: "XXXX:YYYYYY:ZZZZ" | DOCUMENT: { pri=XXXX }
						// return first found
						partialMatchElement = allTableElements[i];
					}
				}
			}
			else 
			{
				//Others => Use compare method
				if (primary == primaryValue && secondary == secondaryValue && tertiary == tertiaryValue) 
				{
					// return first found
					return allTableElements[i];
				}
				else if((secondaryValue == null || secondaryValue == "") && (tertiaryValue == null || tertiaryValue == ""))
				{
					//For some application, the profile is used as Web which is similar as Generic.
					var genericCSH = primary;
					if(tertiary == null || tertiary == "")
					{
						if(secondary != null && secondary != "")
						{
							genericCSH = primary + "_" + secondary;
						}
					}
					else
					{
						genericCSH = primary + "_" + secondary + "_" + tertiary;
					}
					
					if (genericCSH == primaryValue) 
					{
						// return first found
						return allTableElements[i];
					}
				}
			}
		}
	}
	
	return partialMatchElement;
}

/*
 * This function is used to get value in URL by parameter name
 */
function getParameterByName(parameterName) {
    var iStart;
    var iEnd;
	var queryStr = window.location.search.substr(1);

    if (queryStr.indexOf(parameterName)!=-1) { 
        iStart = queryStr.indexOf(parameterName + "=") + parameterName.length + 1;
        iEnd = queryStr.indexOf("&", iStart)
		
        if (iEnd==-1) {
            iEnd = queryStr.length;
        }
		
        return queryStr.substring(iStart, iEnd);
    }
    else {
        return ""
    }
}
