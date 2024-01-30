/** 
* Defines the main Action class for all action types to extend
* @constructor
*/
var Action = new Class({
    
	initialize: function(o){
        for(var prop in o)
		{
			this[prop] = o[prop];
		}
		this.alphas = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
		this.context = null;
		this.interactionsType = 'true-false';
    },

	getCorrectResponse: function()
	{
		return this.correctResponse;
	},

	getStudentResponse: function()
	{
		return this.studentResponse;
	},

	flashAction: function(c)
	{
		var self = this;
		c.style.display = (c.style.display == "block") ? "none" : "block";

		var func = function()
		{
			self.flashAction(c);
		}
		setTimeout(func,1000);
	},

	markCorrect: function()
	{
		this.step.markCorrect();
	},

	markIncorrect: function()
	{
		this.step.markIncorrect();
	},

	getRectangle: function()
	{
		try
		{
			if(this.rectangle)
			{
				return this.rectangle;
			}
			else if(this.dragTarget.rectangle)
			{
				return this.dragTarget.rectangle;
			}
		}
		catch(e){}
	},
	
	isMatchCsh: function(primaryCsh, secondaryCsh, tertiaryCsh, application, pSearchTempData)
	{
		var primary = this['primaryCsh'];
		var secondary = this['secondaryCsh'];
		var tertiary = this['tertiaryCsh'];
		if (primary != null 
			&& primary != "" 
			&& secondary != null 
			&& tertiary != null)
		{
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
			    (primary.indexOf("http_//") == 0 
				|| primary.indexOf("https_//") == 0 
				|| primary.indexOf("file_///") == 0)) 
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
				
				if (genericCSH == primaryCsh) 
				{
					return true;
				}
			}
			else if (application == "SAP+Portal") 
			{
				//SAP Portal: CE captures multiple iViewID, but help call only has 1 iViewID
				//Use method search in
				if ((primary.indexOf(primaryCsh)!=-1) 
					&& (secondary.indexOf(secondaryCsh)!=-1) 
					&& (tertiary.indexOf(tertiaryCsh))!=-1) 
				{
					return true;
				}
			}
			else if (application == "ANCILE+Help+Launchpad") 
			{
				//WEBSAP7, SAPWINGUI COMPLEX CSH
				if (secondary != "" && tertiary != "") 
				{
					//Step has full csh
					var complexCSH = primary + "_" + secondary + "_" + tertiary;
					if (complexCSH == primaryCsh) 
					{
						//1. SAP SERVER: "XXXX_YYYYYY_ZZZZ" | DOCUMENT: { pri="XXXX", sec="YYYYYY", ter="ZZZZ" }
						// FULL MATCH -> return first found
						pSearchTempData.partialMatchElement = null;//Reset
						pSearchTempData.partialMatchLength = 0;//Reset
						return true;
					}
					else if (pSearchTempData.partialMatchElement == null && complexCSH.indexOf(primaryCsh) == 0) 
					{
						//2. SAP SERVER: "XXXX" | DOCUMENT: { pri=XXXX, sec=YYYYYY, ter=ZZZZ }
						// PARTIAL MATCH (DONT CARE) -> return first found
						pSearchTempData.partialMatchElement = this;
						return true;
					}
				}
				else if (secondary != "" && tertiary == "")
				{
					//Step missing tertiary csh (dynpro)
					var complexCSH = primary + "_" + secondary;
					if ((pSearchTempData.partialMatchLength < 2) && primaryCsh.indexOf(complexCSH) == 0) 
					{
						//3. SAP SERVER: "XXXX_YYYYYY_ZZZZ" | DOCUMENT: { pri="XXXX", sec="YYYYYY" }
						// PARTIAL MATCH WITH LENGTH 2 -> wait for FULL MATCH
						pSearchTempData.partialMatchElement = this;
						pSearchTempData.partialMatchLength = 2;
						return true;
					}
					else if (pSearchTempData.partialMatchElement == null && complexCSH.indexOf(primaryCsh) == 0) 
					{
						//4. SAP SERVER: "XXXX" | DOCUMENT: { pri=XXXX, sec=YYYYYY }
						// PARTIAL MATCH (DONT CARE) -> return first found
						pSearchTempData.partialMatchElement = this;
						return true;
					}
				}
				else if (secondary == "" && tertiary == "")
				{
					//Step only has primary
					if (primary == primaryCsh) 
					{
						//5. SAP SERVER: "XXXX" | DOCUMENT: { pri=XXXX }
						// FULL MATCH -> return first found
						return true;
					}
					else if ((pSearchTempData.partialMatchLength < 1) && primaryCsh.indexOf(primary) == 0) 
					{
						//6. SAP SERVER: "XXXX_YYYYYY_ZZZZ" | DOCUMENT: { pri=XXXX }
						// PARTIAL MATCH WITH LENGTH 1 -> WAIT FOR PARTIAL MATCH LENGTH 2 or FULL MATCH
						pSearchTempData.partialMatchElement = this;
						pSearchTempData.partialMatchLength = 1;
						return true;
					}
				}
			}
			else 
			{
				//Others => Use compare method
				if (primary == primaryCsh 
					&& secondary == secondaryCsh 
					&& tertiary == tertiaryCsh) 
				{
					return true;
				}
				else if((secondaryCsh == null || secondaryCsh == "") && (tertiaryCsh == null || tertiaryCsh == ""))
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
					
					if (genericCSH == primaryCsh) 
					{
						// return first found
						return true;
					}
				}
			}
		}
		
		return false;
	},

	toString: function()
	{
		return "Action: "+this.actionMode;
	},

	setFocus: function(){},
	disable: function(){},
	enable: function(){}
});