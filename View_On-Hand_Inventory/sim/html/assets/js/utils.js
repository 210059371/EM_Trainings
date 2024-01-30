/** 
* Global singleton JavaScript utility library
* @type {Object}
* @requires MooTools
*/
if(!window.Utils){window.Utils = {};}

//Flash utilities - Based on swfobject
Utils.flash = {
	hasRequiredVer: function()
	{
		if(swfobject.hasFlashPlayerVersion(this.getRequiredVer()))
		{
			return true;
		}
		else
		{
			return false;
		}
	},
	getRequiredVer: function()
	{
		return engine.flashPluginVer;
	},
	getInstalledVer: function()
	{
		var verObj = swfobject.getFlashPlayerVersion();
		return verObj.major+'.'+verObj.minor+'.'+verObj.release;
	},
	showWarning: function()
	{
		$("noFlash").show();
		$("noFlashHeaderText").set('text',unescape(Lang.FLASH_WARNING_TITLE));
		$("flashWarningItAppears").set('text',unescape(Lang.FLASH_WARNING_IT_APPEARS));
		$("flashWarningCurrentVersion").set('text',unescape(Lang.FLASH_WARNING_CURRENT_VERSION));
		$("flashCurrentVersion").set('text',this.getInstalledVer());
		$("flashWarningRequiredVersion").set('text',unescape(Lang.FLASH_WARNING_REQUIRED_VERSION));
		$("flashRequiredVersion").set('text',this.getRequiredVer());
		$("flashWarningClickHereToInstall").set('text',unescape(Lang.FLASH_WARNING_CLICK_HERE_TO_INSTALL));
		$("flashWarningContactYourAdmin").set('text',unescape(Lang.FLASH_WARNING_CONTACT_YOUR_ADMIN));
	},
	showWarningIOS: function()
	{
		$("noFlash").show();
		$("noFlashHeaderText").set('text',unescape(Lang.FLASH_WARNING_TITLE));
		$("flashWarningItAppears").set('text',unescape(Lang.FLASH_WARNING_IT_APPEARS_UNSUPPORTED));
		$("flashWarningCurrentVersion").set('text',unescape(Lang.FLASH_WARNING_CURRENT_VERSION));
		$("flashCurrentVersion").set('text',unescape(Lang.FLASH_WARNING_VERSION_UNSUPPORTED));
		$("flashWarningRequiredVersion").set('text',unescape(Lang.FLASH_WARNING_REQUIRED_VERSION));
		$("flashRequiredVersion").set('text',this.getRequiredVer());
	},
	showAICCWarning: function()
	{
		var c = new Cookie(document,'uPerformFlashWarningAicc',730,'/');
		c.load();
		if(c["hide"] === "true"){return;}

		$("noFlash").show();

		$("noFlashHeaderText").set('text',unescape(Lang.FLASH_WARNING_TITLE));
		$("flashWarningItAppears").set('text',unescape(Lang.FLASH_WARNING_IT_APPEARS_UNSUPPORTED_AICC));
		$("flashWarningCurrentVersion").set('text',unescape(Lang.FLASH_WARNING_CURRENT_VERSION));
		$("flashCurrentVersion").set('text',unescape(Lang.FLASH_WARNING_VERSION_UNSUPPORTED));
		$("flashWarningRequiredVersion").set('text',unescape(Lang.FLASH_WARNING_REQUIRED_VERSION));
		$("flashRequiredVersion").set('text',this.getRequiredVer());

		var tmp = '<input type="checkbox" onclick="Utils.flash.toggleFlashAICCMessage(this);" />';

		$("flashWarningDoNotShowAgain").set('html',tmp+' '+unescape(Lang.FLASH_WARNING_DO_NOT_SHOW_MESSAGE_AGAIN));
	},
	closeWarning: function()
	{
		$("noFlash").hide();
	},
	toggleFlashAICCMessage: function(chkbx)
	{
		var c = new Cookie(document,'uPerformFlashWarningAicc',730,'/');
		if(chkbx.checked)
		{
			c["hide"] = "true";
			c.store();
		}
		else
		{
			c.remove();
		}
	}
};

Utils.string = {
	trim: function(s)
	{
		return s.replace(/^\s+|\s+$/g,"");
	},
	encodeState: function(str)
	{
		if(typeof(str) != 'string'){return}
		var len=str.length;
		var curChar=str[0];
		var curCount=0;
		var encArr=[];
		for(var i=0;i<=len;i++)
		{
			var c = str[i];
			if(c===curChar)
			{
				curCount++;
			}
			else
			{
				encArr.push(curChar+'.'+curCount);
				curCount=1;
				curChar=c;
			}
		}
		return encArr.join('-');
	},
	decodeState: function(str)
	{
		var decStr='';
		var diffChars=str.split('-');
		var len=diffChars.length;
		for(var i=0;i<len;i++)
		{
			var curSection=diffChars[i].split('.');
			var curChar=curSection[0];
			var curLen=curSection[1];
			var curSectionStr='';
			while(curSectionStr.length < curLen)
			{
				curSectionStr+=curChar;
			}
			decStr += curSectionStr;
		}
		return decStr;
	},
	reverse: function(str)
	{
		var s = "";
		var i = str.length;
		while (i > 0) {
			s += str.substring(i-1,i);
			i--;
		}
		
		return s;
	}
};

//Window functions
Utils.window = {
		
	simWindowName: null,
	
	getRootFolder: function()
	{
		try
		{
			if(self.location.href.indexOf("?") >= 0)
			{
				var urlOnly = self.location.href.substring(0,self.location.href.lastIndexOf("?"));
			}
			else
			{
				var urlOnly = self.location.href;
			}
			return urlOnly.substring(0,urlOnly.lastIndexOf("/"));
		}
		catch (e)
		{
			Utils.debug.trace('Error: Cannot get filename in Utils.window.getRootFolder: '+e);
		}
		
	},
	getFileName: function()
	{
		try
		{
			if(self.location.href.indexOf("?") >= 0)
			{
				var urlOnly = self.location.href.substring(0,self.location.href.lastIndexOf("?"));
			}
			else
			{
				var urlOnly = self.location.href;
			}
			return unescape(urlOnly.substring(urlOnly.lastIndexOf("/")+1,urlOnly.lastIndexOf(".htm")));
		}
		catch (e)
		{
			Utils.debug.trace('Error: Cannot get filename in Utils.window.getFileName: '+e);
		}
		
	},
	open: function(url,windowName,w,h,options)
	{
		try
		{
			if(!Utils.window.canFit(Conf.WINDOW_W,Conf.WINDOW_H) || (Utils.browserDetection.browser == "ie" && Utils.browserDetection.version < 9)){
				var width = screen.availWidth-100;
				var height = screen.availHeight-100;
				var left = 50;
				var top = 50;
			} else {
				var width = w || Conf.WINDOW_W;
				var height = h || Conf.WINDOW_H;
				height = Math.min(height, screen.availHeight);
				var left = 0;
				var top = 0;
			}
			var winName = windowName || 'win_'+Math.floor(Math.random()*1000);
			this.simWindowName = winName;
			if (options == null) { options=""; }
			winopts = "toolbar=" + (options.indexOf("toolbar") == -1 ? "no," : "yes,") +
			"location="  + (options.indexOf("location") == -1 ? "no," : "yes,") +
			"menubar=" + (options.indexOf("menubar") == -1 ? "no," : "yes,") +
			"scrollbars=" + (options.indexOf("scrollbars") == -1 ? "no," : "yes,") +
			"status=" + (options.indexOf("status") == -1 ? "no," : "yes,") +
			"resizable=" + (options.indexOf("resizable") == -1 ? "no," : "yes,") +
			"copyhistory=" + (options.indexOf("copyhistory") == -1 ? "no," : "yes,") +
			"width=" + width + ",height=" + height + "," +
			"left=" + left + ",top=" + top;

			var newWin = window.open(url,winName,winopts);
			
			try
			{
				if(newWin)
				{
					newWin.moveTo(0,0);
					newWin.focus();
				}
			} catch (e) { }

			return newWin;
		}
		catch (e)
		{
			Utils.debug.trace('Error: Cannot open window in Utils.window.open: '+e);
		}
	},
	parseParams: function(paramString)
	{
		paramString = paramString.substring(1,paramString.length);
		var d = new Object();
		if(paramString.indexOf('=') != -1)
		{
			var indexOfEqualCharacter = 0;
			var indexOfNextParameter = 0;
			var searchString = null;
			var subindex = 0;
			var len = paramString.length;
	
			while(indexOfEqualCharacter < len) 
			{
				indexOfNextParameter = paramString.indexOf('&', indexOfEqualCharacter);
				if(indexOfNextParameter == -1)
				{
					indexOfNextParameter = len;
				}
				
				searchString = paramString.substring(indexOfEqualCharacter, indexOfNextParameter);//searching format: "paramName=paramValue"
				subindex = searchString.indexOf('=');
				var key = searchString.substring(0, subindex);
				key = key.toLowerCase();
				var val = searchString.substring(subindex + 1, searchString.length);
				if(key == "primarycsh"
					|| key == "secondarycsh"
					|| key == "tertiarycsh")
				{
					var keyValue = val;
					try
					{
						keyValue = keyValue.replace(/%2520/g, "%20");
						keyValue = decodeURIComponent(keyValue);
					}
					catch(e) {}
					
					d[unescape(key)] = keyValue;
				}
				else
				{
					d[unescape(key)] = unescape(val);
				}
				indexOfEqualCharacter = indexOfNextParameter + 1;
			}
		}
		return d;
	},
	getSearchParams: function()
	{
		if(window.opener)
		{
			if(this.isSameDomain('window.opener'))
			{
				if(window.opener.uPerformIndexPage)
				{
					if(window.opener.document.location.search)
					{
						Utils.debug.trace('Found search string in this window\'s opener');
						return Utils.window.parseParams(window.opener.document.location.search);
					}
				}
			}
		}

		if(document.location.search)
		{
			Utils.debug.trace('Found search string in this window');
			return Utils.window.parseParams(document.location.search);
		}

		if(this.isSameDomain('parent'))
		{
			if(parent.document.location.search)
			{
				Utils.debug.trace('Found search string in parent window');
				return Utils.window.parseParams(parent.document.location.search);
			}
		}

		if(this.isSameDomain('top'))
		{
			if(top.document.location.search)
			{
				Utils.debug.trace('Found search string in top window');
				return Utils.window.parseParams(top.document.location.search);
			}
		}
		
		Utils.debug.trace('Search string not detected');
		return null;
	},
	isSameDomain: function(winRefStr)
	{
		var winRef = eval(winRefStr);
		var sameDomain = true;
		var winName = null;
    
		try
		{
			winName = winRef.name;			
			if(!winName)
			{
				if (this.simWindowName != null){
					winRef.name = this.simWindowName;
				} else {
					winRef.name = 'SomethingElse';
				}
		        if (!winRef.name)
		        {
		          sameDomain = false;
		        }
			}
		}
		catch(e)
		{
			sameDomain = false;
			Utils.debug.trace('Window reference not in same domain as: '+document.domain);
		}

		return sameDomain;
	},
	close:  function()
	{
		if(this.isSameDomain('top'))
		{
			top.close();
		}
	},
	openPrintable: function()
	{
		var printableWin = Utils.window.open(Utils.window.getRootFolder()+'/printable/printable.htm','printable',800,600,'scrollbars,resizable');
		if(printableWin)
		{
            if (Utils.browserDetection.browser == "ie" ||
                printableWin.document.readyState === "complete")
            {
                printableWin.print();
            } else {
                printableWin.onload = 
                    function() {
                        printableWin.print();
                    };
            }
		}
	},
	canFit: function(w,h)
	{
		return ((w <= screen.width) && (h <= screen.height));
	}
}

//DOM functions
Utils.dom = {
	
	cursor: {x:0, y:0},
	manager: null,

	fadeIn: function(el,dur,cb)
	{
		this.fade(el,0,1,dur,cb);
	},
	
	fadeOut: function(el,dur,cb)
	{
		this.fade(el,1,0,dur,cb);
	},

	fade: function(el,from,to,dur,cb)
	{
		if(Conf.ENABLE_TRANSITIONS)
		{
			cb = cb || function(){};
			if(el.fx){el.fx.cancel();}
			el.fx = new Fx.Tween(el,
				{link:'ignore',property:'opacity',duration:dur,transition:'quad:out'})
				.addEvent('onComplete', function(){
					cb();
				});
			el.fx.start(from,to);
		}
		else
		{
			el.setStyle('opacity', to);
			if(typeof cb == "function")
			{
				cb();
			}
		}
	},

	setOpacity: function(opacity,el,doc)
	{
		doc = (doc) ? doc : document;
		var elStyle = (typeof el === 'string') ? doc.id(el).style : el.style;

		elStyle.opacity = (opacity / 100);
		elStyle.MozOpacity = (opacity / 100);
		elStyle.KhtmlOpacity = (opacity / 100);
		elStyle.filter = "alpha(opacity=" + opacity + ")";
	},
	
	removeFilter: function(el)
	{
		el.style.filter = '';
	},

	hitTest: function(o,l)
	{
		//+ Jonas Raoni Soares Silva
		//@ http://jsfromhell.com/geral/hittest [rev. #2]
	    function getOffset(o){
	        for(var r = {l: o.offsetLeft, t: o.offsetTop, r: o.offsetWidth, b: o.offsetHeight};
	            o = o.offsetParent; r.l += o.offsetLeft, r.t += o.offsetTop);
	        return r.r += r.l, r.b += r.t, r;
	    }
	    var a = arguments, j = a.length;
	    j > 2 && (o = {offsetLeft: o, offsetTop: l, offsetWidth: j == 5 ? a[2] : 0,
	    offsetHeight: j == 5 ? a[3] : 0, offsetParent: null}, l = a[j - 1]);
	    for(var b, s, r = [], a = getOffset(o), j = isNaN(l.length), i = (j ? l = [l] : l).length; i;
	        b = getOffset(l[--i]), (a.l == b.l || (a.l > b.l ? a.l <= b.r : b.l <= a.r))
	        && (a.t == b.t || (a.t > b.t ? a.t <= b.b : b.t <= a.b)) && (r[r.length] = l[i]));
	    return j ? !!r.length : r;
	},

	getFlashObject: function(id)
	{
		if(Utils.browserDetection.browser == "Explorer")
		{
			return window[id];
		}
		else
		{
			return document[id];
		}
	},

	// Returns a reference to its context
	createCanvasElement: function(id, parent, w, h, className, x, y)
	{
		var c = document.createElement('canvas');
		c.setAttribute("id", id);
		c.setAttribute("width", w);
		c.setAttribute("height", h);
		if(className){c.className = className;}
		if(typeof(G_vmlCanvasManager) != 'undefined')
		{
			c = G_vmlCanvasManager.initElement(c);
		}
		if(x){c.style.left = x+"px";}
		if(y){c.style.top = y+"px";}
		parent.appendChild(c);
		return c;
	},

	createImageElement: function(id, parent, w, h, x, y, className)
	{
		var img = new Element('img', {
			'id':id,
			'width':w,
			'height':h,
			'class':(className || '')
		});
		img.setStyle('top',y);
		img.setStyle('left',x);
		$(parent).adopt(img);

		return img;
	},

	createDivElement: function(o)
	{
		var d = new Element('div', {
			'id':o.id,
			'class':o.className
		});
		d.setStyle('top',o.y);
		d.setStyle('left',o.x);
		d.setStyle('width',o.w);
		d.setStyle('height',o.h);
		$(o.parent).adopt(d);
		return d;
	},

	createClickableElement: function(o)
	{
		var d = this.createDivElement(o);

		var img = this.createImageElement(o.id+"_img",d,o.w,o.h,0,0,null);
		img.src = engine.SPACER;
		EventHandler.createMouseListener(img,o.clicks);
		
		return img;
	},

    determineTextSize: function(o, el, offset)
    {
        try {
            var curFontSize = el.getStyle('font-size');
            var numRegex = new RegExp('([0-9]*\.[0-9]+|[0-9]+)(\s*px)');
            
            if (curFontSize.match(numRegex))
            {
                curFontSize = numRegex.exec(curFontSize)[1];
            
                var tag = new Element('span', {
                    'html': '<span style="font-family:' + el.getStyle('font-family') + ';font-size:' + el.getStyle('font-size') + ';">' + 't' + '</span>'});
                
                tag.setStyle('border-style', 'none');
                tag.setStyle('border-width', '0px');
            
                $(o.parent).adopt(tag);			
            
                var lHeight = tag.getHeight();
                
                tag.dispose();
                
                var fontSize =  Math.ceil(curFontSize* o.h / lHeight *.9);						
                
                if (fontSize > curFontSize)
                {				
                    fontSize = curFontSize;
                }else if (fontSize <= 0)
                {
                    fontSize = 6;
                }
                
                if (typeof offset !== "undefined") {
                    fontSize += offset;
                }
                
                return fontSize;
            }
        }catch(err) {
            //should ignore code will account for the -1
        }
        
        return -1;
    },
    
	createTextField: function(o)
	{
		var el = new Element('input', {
			'id':o.id,
			'class':o.className
		});
		el.setStyle('top',o.y);
		el.setStyle('left',o.x);
		el.setStyle('width',o.w);
		el.setStyle('height',o.h);
		el.setStyle('border-style', 'none');
		el.setStyle('border-width', '0px');
		el.store('action', o.action);
		el.store('step', o.step);
		$(o.parent).adopt(el);

		
		try{
            var fontSize = this.determineTextSize(o, el);
            
            if (fontSize > -1) {
                el.setStyle('font-size', fontSize +'px');		
            }
		}catch(err)
		{
		}
		
		var change = function()
		{
			//this.action.change();
		};

		var focus = function()
		{
			this.retrieve('action').focus();
		};

		var blur = function()
		{
			this.retrieve('action').blur();
		};

		el.addEvent('change', change);
		el.addEvent('focus', focus);
		el.addEvent('blur', blur);
		
		return el;
	},
	
	isDocRTL: function() {
        var direction = $(document.documentElement).get('dir');
        return (direction != null && 
            typeof(direction) !== "undefined" &&
            direction.toLowerCase() === "rtl") ? true : false;
    }
};

//Debugger functions
Utils.debug = {

	data: [],
	debugConsole: null,

	//msg: the trace string
	//type: 'info', 'comm', 'error' (defaults to info if not specified)
	trace: function(msg,type)
	{
		if(!Conf.ENABLE_DEBUGGER){return}
		type = type || 'info';
		this.data.push({msg:msg,type:type});
		try
		{
			if(console)
			{
				if(type === 'error')
				{
					console.error(msg);
				}
				else
				{
					console.log(msg);
				}
			}
		}
		catch(e){}
		this.refresh();
	},

	show: function()
	{
		if(!this.debugConsole || this.debugConsole.closed)
		{
			this.debugConsole = Utils.window.open(Utils.window.getRootFolder()+'/assets/htm/debugger.htm','debugger',500,600,'scrollbars,resizable');
		}
		else
		{
			this.debugConsole.focus();
		}

		if(!this.debugConsole)
		{
			alert(unescape(Lang.CANNOT_OPEN_DEBUG_WIN));
			alert(this.data.join("\n"));
		}
	},

	refresh: function()
	{
		try
		{
			if(this.debugConsole)
			{
				if(!this.debugConsole.closed)
				{
					var html = '';
					this.data.each(function(item,index){
						if(typeof item.msg == 'string')
						{
							html += '<div class="'+item.type+'">&gt; '+item.msg+'</div>';
						}
					});
					this.debugConsole.updateConsole(html);
				}
			}
		}
		catch(e){}
	},
	
	terminate: function()
	{
		if(this.debugConsole)
		{
			if(!this.debugConsole.closed)
			{
				this.debugConsole.close();
			}
		}		
	}
};

//Browser detection functions
Utils.browserDetection = {

	browser:"",
	version:"",
	OS:"",
	details:"",
	
	init: function()
	{
		this.browser = Browser.name;
		this.version = Browser.version;
		this.OS = Browser.Platform.name;
		this.details = this.OS +" "+ this.browser + " " + this.version;
	},

	isMobile: function()
	{
		if(Conf.MOBILE_DEVICES.length === 0){return;}
		var isMobile = false;
		Conf.MOBILE_DEVICES.each(function(item,index){
			var a = item.split("/");
			if(a.length === 2)
			{
				var os = a[0].toLowerCase();
				if(a[1] === "")
				{
					if(this.OS == os)
					{
						isMobile = true;
					}
				}
				else
				{
					var browser = a[1].toLowerCase();
					if(this.OS == os && this.browser == browser)
					{
						isMobile = true;
					}
				}
			}
		},this);
		return isMobile;
	}
};
