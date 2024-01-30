/**
* Class defining the user interface layer used by the engine controller
* @type {Object}
* @requires MooTools
*/
var UIControl = function()
{
	this.transcriptOpen = false;
	this.menuOpen = false;
	this.menuFocused = false;
	this.menuPinned = true;
	this.transcriptOpen = false;
	this.stepCount = 0;
	this.groupMenuEntries = [];
	this.stepContentPartsWidth = 0;
	this.menuPosition = {};
	this.menuDimensions = {};
	this.selectedGroupIndex = null;
	this.loadingMessageFx = null;
	this.menuFx = null;
	this.fadeInMenuContent = null;
	this.loadingMessageCompleted = false;
	this.timeline = null;
	this.iosAudioPromptOpen = false;
	this.activeElement = null;
	this.iosInputHandler = null;
	this.left = 0;

	/**
	* Initializes the user interface layer
	* @method initialize
	*/
	this.initialize=function()
	{
		if(engine.mode != engine.MODES.AUTO_PLAYBACK.value)
		{
			this.iosInputHandler = new iOSInputHandler();
		}

		//Setup UI elements
		this.content = $('content');
		this.footer = $('footer');
		this.mouseCatcher = $("mouseCatcher");

		this.UI_FOOTER_HEIGHT = $('footer').getStyle("min-height").toInt();

		this.sizeWindow();
		this.initializeLayout();
		
		if(engine.mode == engine.MODES.STANDARD.value || engine.mode == engine.MODES.AUTO_PLAYBACK.value)
		{
			this.nextBtnLbl = $('nextBtn').getElements('a')[0].get('title');
			this.UI_TRANSCRIPT_HEIGHT = $('transcript').getStyle("height").toInt();
			this.UI_MENU_HEADER_HEIGHT = $('menuHeader').getStyle("height").toInt();

			if(engine.controller.steps.length > 1)
			{
				this.timeline = new Timeline();
				this.timeline.initialize(engine.controller.steps);
			}
			
			this.menuPosition = false;

			if(!Utils.browserDetection.isMobile())
			{
				this.togglePinMenu();
			}
			else
			{
				var footerH = $('menuFooter').getStyle('height').toInt();
				var diffH = $('menu').getStyle('padding-bottom').toInt() - footerH;
				$('menu').setStyle('padding-bottom',diffH);
				$('menuPinBtn').hide();
				$('menuPrintBtn').hide();
				$('menuResizer').hide();
				$('menuFooter').hide();
			}

			//Cache titles atts
			$('transcriptBtn').store('label',$('transcriptBtn').getElements('a')[0].get('title'));
			$('nextBtn').store('label',$('nextBtn').getElements('a')[0].get('title'));
			$('backBtn').store('label',$('backBtn').getElements('a')[0].get('title'));

			this.patchTitleClosed('transcriptBtn');
		}
	};

	/**
	 * Fires when the engine receives the contentLoaded event (step content has completed loading)
	 * @method contentLoaded
	 */
	this.contentLoaded = function()
	{
		if(engine.mode == engine.MODES.STANDARD.value || engine.mode == engine.MODES.AUTO_PLAYBACK.value)
		{
			this.createStepBarContent();
			this.updateMenu();
			if(engine.mode == engine.MODES.AUTO_PLAYBACK.value)
			{
				if (!engine.controller.playbackPaused) {
					$('playbackPauseBtn').show();
					$('playbackPauseBtn').getElements('a')[0].focus();
				}			
			}
		}
		else
		{
			if(engine.controller.currentStepObj.hasActions())
			{
				if(Conf.SHOW_HINTS)
				{
					this.createHintContent();
				}
			}
			else
			{
				if(engine.controller.currentStepObj.isInfoStep)
				{
					this.createInfoContent();
				}
			}
		}

		this.updateLayout();
	};

	/**
	* Handles the resize event and updates the layout
	* @method handleResize
	*/
	this.handleResize=function()
	{
		this.updateLayout();
	};

	/**
	* Size the window on initialization
	* @method sizeWindow
	*/
	this.sizeWindow=function()
	{
		if(Conf.WINDOW_CONTROL)
		{
			if(Conf.FULLSCREEN || !Utils.window.canFit(Conf.WINDOW_W,Conf.WINDOW_H))
			{
				var w = screen.availWidth;
				var h = screen.availHeight;
			}
			else
			{
				var w = Conf.WINDOW_W;
				var h = Conf.WINDOW_H;
			}

			try
			{
				if(Utils.window.isSameDomain('top'))
				{
					if(Conf.ZEROWIN || Conf.FULLSCREEN)
					{
						top.moveTo(0,0);
					}
					else
					{
						if(Utils.window.canFit(Conf.WINDOW_W,Conf.WINDOW_H))
						{
							var l = (screen.width) ? (screen.width-w)/2 : 0;
							var t = (screen.height) ? (screen.height - h) / 2 : 0;							
							if (t != 0 && (t + h) > screen.availHeight)
							{
							    t = (screen.availHeight) ? (screen.availHeight - h) / 2 : 0;
							    t = Math.max(0, t);
							}
							//top.moveTo(l,t);
						}
						else
						{
						    //top.moveTo(0,0);
						    l = 0;
						    t = 0;
						}
					}

					if(top.resizeTo)
					{
					    h = Math.min(Conf.WINDOW_H, screen.availHeight);
						top.resizeTo(w,h);
					}
					else if(document.layers)
					{
						top.outerWidth = w;
						top.outerHeight = h;
					}
					else if(window.outerWidth)
					{
						top.outerWidth = w;
						top.outerHeight = h;
					}
					
					top.moveTo(l, t);
					top.focus();
				}
			}
			catch(e)
			{
				Utils.debug.trace('Error: Cannot resize or place window: '+e);
			}
			
		}
	};

	/**
	* Calls all update UI commands
	* @method updateInterface
	*/
	this.updateInterface=function()
	{
		if(engine.mode == engine.MODES.STANDARD.value || engine.mode == engine.MODES.AUTO_PLAYBACK.value)
		{
			this.updateLocationText();

			if(this.timeline)
			{
				var currStepIndex = engine.controller.currentStepIndex;
				this.timeline.updateStyles(currStepIndex);
			}
		}
	};

	/**
	* Updates the location text (step location/total)
	* @method updateBreadcrumbText
	*/
	this.updateLocationText=function()
	{
		var stepXofX = this.getStepXofX();
		var stepLocation = stepXofX;
		$('locationText').set('text',stepLocation);
	};

	/**
	* Sends the duration of the TimerControl to the timeline object
	* @method updateDuration
	*/
	this.updateDuration = function(total,remaining)
	{
		if(!this.timeline){return;}
		var currStepIndex = engine.controller.currentStepIndex;
		this.timeline.updateDuration(total,remaining,currStepIndex);
	};

	/**
	* Diplays the footer and creates hint content for action hints
	* @method createHintContent
	*/
	this.createHintContent = function()
	{
		var stepObj = engine.controller.currentStepObj;
		var a = stepObj.getDefaultAction();

		if(!$chk(a)){return;}
		if(!$chk(a.hint)){return;}
		
		Utils.debug.trace('Displaying hint: '+unescape(a.hint));

		$('hintBar').empty();
		$('footer').show();
		
		var h = new Element('div',{
			'class':'hintEntry',
			'html':unescape(a.hint).replace(/<\/?[^>]+(>|$)/g, "").trim()
		});

		$('hintBar').adopt(h);
	};

	/**
	* Diplays the footer and creates hint content for action hints
	* @method createHintContent
	*/
	this.createInfoContent = function()
	{
		var stepObj = engine.controller.currentStepObj;
		
		Utils.debug.trace('Displaying no-action step info');

		$('hintBar').empty();
		$('footer').show();

		var o = {};
		o.className = "stepBarImgContent";
		o.parent = $('hintBar');
		o.id = "stepBarContent_infoIcon";
		o.w = 16;
		o.h = 16;
		o.img = engine.skinPath+"info.png";

		var icon = this.createStepBarElement(o);
		
		var info = new Element('div',{
			'class':'hintEntry',
			'html':unescape(stepObj.content[0].text).replace(/<\/?[^>]+(>|$)/g, "").trim()
		});

		$('hintBar').adopt(info);
	};

	/**
	* Creates and inserts the step content elements into the step bar
	* @method createStepBarContent
	*/
	this.createStepBarContent = function()
	{
		var stepObj = engine.controller.currentStepObj;
		var a = stepObj.getDefaultAction();
		this.stepContentPartsWidth = 0;

		// Create div with action icon first...
		if(a)
		{
			var o = {};
			o.className = "stepBarImgContent";
			o.parent = $('stepBar');
			o.id = "stepBarContent_actionIcon";
			o.w = Conf.MAX_STEPIMAGE_WIDTH;
			o.h = this.UI_FOOTER_HEIGHT-4;
			o.img = engine.skinPath+a.actionIconImage;

			var d = this.createStepBarElement(o);
			this.stepContentPartsWidth += 20;
		}
		else
		{
			// Step has no actions, so show the default "no-action" content
			if(stepObj.isInfoStep)
			{
				var o = {};
				o.className = "stepBarImgContent";
				o.parent = $('stepBar');
				o.id = "stepBarContent_infoIcon";
				o.w = Conf.MAX_STEPIMAGE_WIDTH;
				o.h = this.UI_FOOTER_HEIGHT-4;
				o.img = engine.skinPath+"info.png";

				var icon = this.createStepBarElement(o);
				this.stepContentPartsWidth += 20;

				o = {}
				o.parent = $('stepBar');
				o.id = "stepBarContent_0";
				o.className = "stepBarTextContent uiTextColor";
				o.txt = unescape(stepObj.content[0].text).replace(/<\/?[^>]+(>|$)/g, "").trim();
				var d = this.createStepBarElement(o);
				this.stepContentPartsWidth += d.offsetWidth;

				$('stepBar').setStyle('min-width',this.stepContentPartsWidth+20);
				return;
			}
		}
		
		// Then append the remaining step content to the stepBar element
		stepObj.content.each(function(item, index){
			o = {}
			o.parent = $('stepBar');
			o.id = "stepBarContent_"+index;
			try
			{
				if(item.text && item.text != ".")
				{
					o.className = "stepBarTextContent uiTextColor";
					o.txt = unescape(item.text).replace(/<\/?[^>]+(>|$)/g, "").trim();
                    o.txt = o.txt.replace("%","%25");
					var d = this.createStepBarElement(o);
					this.stepContentPartsWidth += d.offsetWidth;
				}
				else if(item.image)
				{
					o.className = "stepBarImgContent";
					o.w = Conf.MAX_STEPIMAGE_WIDTH;
					o.h = this.UI_FOOTER_HEIGHT-4;
					o.img = engine.imagePath+item.image;
					var d = this.createStepBarElement(o);
					this.stepContentPartsWidth += Conf.MAX_STEPIMAGE_WIDTH;
				}
			}
			catch(e){}
		},this);

		$('stepBar').setStyle('min-width',this.stepContentPartsWidth+20);
	};

	/**
	* Creates the individual step content element and returns it
	* @method createStepBarElement
	*/
	this.createStepBarElement = function(o)
	{
		var d = new Element('div', {
			'class': o.className,
			'id': o.id
		},this);
		o.parent.adopt(d);

		if(o.img)
		{
			if(o.h){d.style.height = o.h+"px";}

			var img = new Image();
			img.onload = function()
			{
				var bgOffset = (this.height > o.h) ? (-(this.height-o.h)/2)+"px" : 0;
				d.style.background = "url(\""+o.img+"\") no-repeat 0 "+bgOffset;
				d.style.width = this.width+"px";
				if(o.w){d.style.maxWidth = o.w+"px";}
			}
			img.onerror = function()
			{
				Utils.debug.trace("Error: Cannot load step content image: "+o.img);
			}
			img.src = o.img;
		}
		if(o.txt)
		{
			d.set('text',unescape(o.txt));
		}
		return d;
	};

	/**
	* Updates the state of the sim menu (step window)
	* @method updateMenu
	*/
	this.updateMenu = function()
	{
		if(this.menuOpen)
		{
			var step = engine.controller.currentStepObj;
			var groupIndex = ($chk(step)) ? step.parent.index : 0;

			if(this.selectedGroupIndex != groupIndex)
			{
				this.toggleGroupMenuEntry(groupIndex);
			}

			this.updateMenuStepEntries();
		}
	};

	/**
	* Updates the status of the steps within the sim menu (step window)
	* @method updateMenuStepEntries
	*/
	this.updateMenuStepEntries = function()
	{
		engine.controller.steps.each(function(item,index){
			item.updateMenuStepStatus();
		});
	};

	/**
	* Toggle the menu display
	* @method toggleMenu
	*/
	this.toggleMenu=function(forceToggle)
	{
		// Restrict access if navigation has been disabled
		if(!engine.controller.navEnabled && !forceToggle){return;}
		
		//toggle menu
		this.menuOpen = !this.menuOpen;
		if(this.menuOpen)
		{
			this.showMenu();
		}
		else
		{
			this.hideMenu();
		}
	};

	/**
	* Toggles the "pinned" state of the menu, pinning or freeing the menu
	* @method togglePinMenu
	*/
	this.togglePinMenu=function()
	{
		this.menuPinned = !this.menuPinned;
		$('menuPinImage').src = engine.skinPath+"menu_pin_"+this.menuPinned+".png";
		var menuCoords = $("menu").getCoordinates();
		if(this.menuPinned)
		{
			this.menuDrag.detach();
			$('menuResizer').hide();
			this.menuDimensions = {w:$("menu").getStyle('width'), h:$("menu").getStyle('height')};
			this.menuPosition = $("menu").getPosition();
			var pos = (Conf.STEP_WINDOW_ALIGNMENT === "right") ? 'upperRight' : 'upperLeft';
			if(Conf.ENABLE_TRANSITIONS)
			{
				$("menu").move({
					position:pos,
					edge:pos
				});
			}
			else
			{
				$("menu").position({
					position:pos,
					edge:pos
				});
			}
			$('menuHeader').setStyle('cursor','default');
		}
		else
		{
			if(Utils.browserDetection.isMobile()){return;}
			$('menuResizer').show();
			if(this.menuPosition)
			{
				$("menu").move({position:'upperLeft',offset:this.menuPosition});
			}
			$("menu").setStyle('width',this.menuDimensions.w);
			$("menu").setStyle('height',this.menuDimensions.h);
			var o = {
				onStart:function()
				{
					$("menu").setOpacity(.5);
				},
				onComplete:function()
				{
					$("menu").setOpacity(1);
				},
				handle:$('menuHeader')
			};
			this.menuDrag = new Drag('menu',o).attach();
			$('menuHeader').setStyle('cursor','move');
		}

		this.updateLayout();
	};

	/**
	* Shows the menu
	* @method showMenu
	*/
	this.showMenu=function()
	{
		this.menuOpen = true;
		$('menuBtnLabel').getElements('a')[0].set('text',Lang.STEPWINDOW_HIDESTEPS);
		$('menuBtnLabel').getElements('a')[0].set('title',Lang.STEPWINDOW_HIDESTEPS);
		if(this.menuPinned)
		{
			$('menu').show();
			this.updateMenu();
		}
		else
		{
			this.animateMenuShow();
		}
		this.updateLayout();
	};

	/**
	* Hides the menu
	* @method showMenu
	*/
	this.hideMenu=function()
	{
		this.menuOpen = false;
		$('menuBtnLabel').getElements('a')[0].set('text',Lang.STEPWINDOW_RESTORESTEPS);
		$('menuBtnLabel').getElements('a')[0].set('title',Lang.STEPWINDOW_RESTORESTEPS);
		if(this.menuPinned)
		{
			$('menu').hide();
		}
		else
		{
			this.animateMenuHide();
		}
		//engine.controller.groups[this.selectedGroupIndex].collapsible.hide();
		this.updateLayout();
	};

	/**
	* Empties and creates the menu content
	* @method renderMenu
	*/
	this.renderMenu=function()
	{
		var self = this;
		$('menuContent').empty();
		this.groupMenuEntries = [];

		var menuContentScroller = new Element('div',{
					'id':'menuContentScroller'
				});
		$('menuContent').adopt(menuContentScroller);

		//Groups
		engine.controller.groups.each(function(group, i){
			group.stepMenuEntries = [];
			var groupEntry = group.getMenuContent();
			this.groupMenuEntries.push(groupEntry);
			menuContentScroller.adopt(groupEntry);

			//Group's container for its steps
			var stepElementsContainer = new Element('div',{
					'id':'stepElementsContainer_'+i,
					'class':'stepElementsContainer'
				});
			group.stepElementsContainer = stepElementsContainer;
			menuContentScroller.adopt(stepElementsContainer);

			if(Conf.ENABLE_TRANSITIONS)
			{
				group.collapsible = new Fx.Slide(stepElementsContainer, { 
					duration: 500, 
					transition: Fx.Transitions.quadIn
				});
				group.collapsible.hide();
			}
			else
			{
				stepElementsContainer.hide();
			}

			//Steps
			group.steps.each(function(step,j){
				var stepEl = step.getMenuContent(i);
				stepElementsContainer.adopt(stepEl);
			},this);
		},this);
		
		$('menu').makeResizable({handle:$('menuResizer')});

		if(Utils.browserDetection.isMobile())
		{
			menuScroller = new iScroll('menuContent');
			setTimeout(function(){menuScroller.refresh();},0);
		}
	};

	/**
	* Toggles a group's display in the menu
	* @method toggleGroupMenuEntry
	*/
	this.toggleGroupMenuEntry = function(groupIndex)
	{
		var groups = engine.controller.groups;
		groups.each(function(group, i){
			if(i!=groupIndex)
			{
				this.closeGroupMenuEntry(group);
			}
			else
			{
				if(groupIndex == this.selectedGroupIndex)
				{
					group.open = !group.open;
				}
				else
				{
					group.open = true;
				}
				if(Conf.ENABLE_TRANSITIONS)
				{
					group.collapsible.toggle();
				}
				else
				{
					group.stepElementsContainer.toggle();
				}
			}
			group.updateMenuToggleImage();
			group.updateMenuTitle();
		},this);
		this.selectedGroupIndex = groupIndex;

		if(Utils.browserDetection.isMobile())
		{
			setTimeout(function(){menuScroller.refresh();},1000);
		}
	};

	this.closeGroupMenuEntry = function(group)
	{
		group.open = false;
		if(Conf.ENABLE_TRANSITIONS)
		{
			group.collapsible.slideOut();
		}
		else
		{
			group.stepElementsContainer.hide();
		}
	};

	this.openGroupMenuEntry = function(groupIndex)
	{
		var groups = engine.controller.groups;
		groups.each(function(group, i){
			if(i == groupIndex)
			{
				group.open = true;
				if(Conf.ENABLE_TRANSITIONS)
				{
					group.collapsible.slideIn();
				}
				else
				{
					group.stepElementsContainer.slideIn();
				}
			}
			else
			{
				this.closeGroupMenuEntry(group);
			}
			group.updateMenuToggleImage();
			group.updateMenuTitle();
		},this);
		this.selectedGroupIndex = groupIndex;
	};

	/**
	* Fades the loading message out or hides it immediately
	* @method fadeOutLoadingMessage
	*/
	this.fadeOutLoadingMessage = function()
	{
		$("loadingText").hide();
		if(Conf.ENABLE_TRANSITIONS)
		{
			var self = this;
			var func = function()
			{
				$('loadingMessage').hide();
				self.loadingMessageCompleted = true;
			};
			Utils.dom.fade($('loadingMessage'),1,0,2000,func);
		}
		else
		{
			$('loadingMessage').hide();
			engine.controller.currentStepObj.renderComposite();
			this.loadingMessageCompleted = true;
		}
	};

	/**
	* Animates the menu into the UI
	* @method animateMenuShow
	*/
	this.animateMenuShow = function()
	{
		if(this.menuFx){this.menuFx.cancel();}

		$('menuContent').setStyle('opacity', 0);
		$('menu').setStyle('opacity', 0);
		$('menu').show();

		var self = this;

		this.menuFx = new Fx.Morph($('menu'),{
			link: 'ignore',
			duration: 500,
			onComplete:function(){
				self.fadeInMenuContent = new Fx.Tween($('menuContent'),{
						link: 'ignore',
						duration: 500,
						onComplete: function(){self.updateMenu();}
					}).start('opacity', 1.0);
		}}).start({
			'opacity': 1
		});
	};

	/**
	* Animates the menu out of the UI
	* @method animateMenuHide
	*/
	this.animateMenuHide = function()
	{
		if(this.menuFx){this.menuFx.cancel();}
		$("menuContent").setStyle('opacity', 0);
		
		var self = this;

		this.menuFx = new Fx.Morph($('menu'),{
			link: 'ignore',
			duration: 500,
			onComplete: function(){$('menu').hide();}
		}).start({
			'opacity': 0
		});
	};
	
	/**
	* Toggles the transcript pane display
	* @method toggleTranscript
	*/
	this.toggleTranscript=function()
	{
		//toggle transcript
		this.transcriptOpen = !this.transcriptOpen;
		if(this.transcriptOpen)
		{
			this.renderTranscript();
			this.showTranscript();
		}
		else
		{
			this.hideTranscript();
		}
	};
	
	/**
	* Renders the contens of the transcript pane
	* @method renderTranscript
	*/
	this.renderTranscript=function()
	{
		var stepXofX = this.getStepXofX();
		$('transcriptHeaderText').set('text',unescape(Lang.UI_LABEL_TRANSCRIPT)+": " + stepXofX);
		$('transcriptText').set('html',unescape(engine.controller.currentStepObj.transcript));

		if(Utils.browserDetection.isMobile())
		{
			transcriptScroller = new iScroll('transcriptContent');
			setTimeout(function(){transcriptScroller.refresh();},0);
		}
	};

	/**
	* Returns the current "Step X of X" text
	* @method getStepXofX
	*/
	this.getStepXofX = function()
	{
		var stepTotal = engine.controller.stepTotal;
		var currStepNo = engine.controller.currentStepIndex+1;
		return unescape(Lang.UI_LABEL_STEP_NUMBER.replace('%s',currStepNo).replace('%t',stepTotal));
	};
	
	/**
	* Shows the transcript pane
	* @method showTranscript
	*/
	this.showTranscript=function()
	{
		$("transcriptBtn").setStyle('opacity', 0.30);
		this.patchTitleOpen('transcriptBtn');
		$('transcript').show();
		Utils.dom.fadeIn($('transcriptContent'),1000,function(){
			Utils.dom.removeFilter($("transcriptContent"));
		});
		this.updateLayout();
	};
	
	/**
	* Hides the transcript pane
	* @method hideTranscript
	*/
	this.hideTranscript=function()
	{
		$("transcriptBtn").setStyle('opacity', 1);
		this.patchTitleClosed('transcriptBtn');
		$('transcript').hide();
		this.updateLayout();
	};
	
	/**
	* Hides the audio controls container
	* @method hideAudioControls
	*/
	this.hideAudioControls=function()
	{
		if(engine.mode == engine.MODES.STANDARD.value || engine.mode == engine.MODES.AUTO_PLAYBACK.value)
		{
			$('audioControls').hide();
		}
	};

	/**
	* Shows the audio controls container
	* @method showAudioControls
	*/
	this.showAudioControls=function()
	{
		if(engine.mode == engine.MODES.STANDARD.value || engine.mode == engine.MODES.AUTO_PLAYBACK.value)
		{
			$('audioControls').show();
		}
	};
	
	/**
	* Initializes the layout - Only done on engine load
	* @method initializeLayout
	*/
	this.initializeLayout=function()
	{
		//this.title.innerHTML = unescape(engine.simTitle);
		if(Conf.ENABLE_DEBUGGER)
		{
			this.showDebugOption();
		}

		if(engine.mode == engine.MODES.STANDARD.value || engine.mode == engine.MODES.AUTO_PLAYBACK.value)
		{
			$('menuBtnLabel').getElements('a')[0].set('text',Lang.STEPWINDOW_RESTORESTEPS);

			//transcript
			$('transcript').setStyle("left",0);
			$('transcript').setStyle("height",this.UI_TRANSCRIPT_HEIGHT);

			//menu
			this.UI_MENU_WIDTH = $('menu').getStyle('width').toInt();
			$('menu').setStyle('left',-this.UI_MENU_WIDTH);
			this.menuPosition = {x:-this.UI_MENU_WIDTH,y:0};
		}

		//footer
		this.UI_FOOTER_HEIGHT = $('footer').offsetHeight;
		$('footer').setStyle("bottom",0);
		$('footer').setStyle("left",0);
		if(engine.embedded && engine.enableExit && engine.exitLabel != null)
		{
			$('exitBtnLabel').getElements('a')[0].set('text',decodeURI(engine.exitLabel));
			$('exitBtnLabel').getElements('a')[0].set('title',decodeURI(engine.exitLabel));
		} else {
			$('exitBtn').setStyle('display', 'none');
		}		
		//content area
		$('content').setStyle("left",0);

		if(Utils.browserDetection.isMobile() && this.iosInputHandler)
		{
			this.iosInputHandler.initialize();
		}
	};

	this.setLeftStyleMenu = function()
	{
		if(this.menuPinned && this.menuOpen)
		{				
			if(Conf.STEP_WINDOW_ALIGNMENT === "right")
			{
				var head = document.getElementsByTagName("head")[0];
				if(head && this.styleElement == "undefined" || !this.styleElement)
				{
					this.styleElement = document.createElement("style");			
					
					if (this.styleElement && typeof this.styleElement.innerText == "string" && typeof this.styleElement.type == "string")
					{
						head.appendChild(this.styleElement);
						this.styleElement.type = "text/css";
						this.styleElement.innerText = 'div#menu{left:'+ this.left +'px !important;}';
					}
				}
				else if(this.styleElement && typeof this.styleElement.innerText == "string")
				{
					this.styleElement.innerText = 'div#menu{left:'+ this.left +'px !important;}';
				}
				$('content').setStyle('left',0);
				$('menu').setStyle('left',this.left);					
			}
			else if(Conf.STEP_WINDOW_ALIGNMENT === "left")
			{
				$('menu').setStyle('left',0);
				$('content').setStyle('left',this.UI_MENU_WIDTH);				
			}
		}		
	}
	
	/**
	* Update the layout
	* @method updateLayout
	*/
	this.updateLayout=function()
	{
		var viewWidth = (document.documentElement.clientWidth) ? document.documentElement.clientWidth : window.innerWidth;
		var viewHeight = (document.documentElement.clientHeight) ? document.documentElement.clientHeight : window.innerHeight;

		if(!viewWidth || !viewHeight)
		{
			return;
		}

		this.UI_FOOTER_HEIGHT = $('footer').offsetHeight;

		//dialog
		engine.dialog.updateLayout(viewWidth,viewHeight);
		
		if(engine.mode == engine.MODES.STANDARD.value || engine.mode == engine.MODES.AUTO_PLAYBACK.value)
		{
			this.UI_MENU_WIDTH = $('menu').offsetWidth;

			if(this.transcriptOpen)
			{
				//transcript height/bottom
				var transcriptHeight = this.UI_TRANSCRIPT_HEIGHT;
				var timelineHeight = (this.timeline) ? this.timeline.getBarHeight() : 0;
				$('transcript').setStyle("bottom",this.UI_FOOTER_HEIGHT + timelineHeight);
			}
			else
			{
				var transcriptHeight = 0;
			}

			//transcript width
			try
			{
				$('transcript').setStyle('width',viewWidth);
			}
			catch(e){Utils.debug.trace("Error in ui.updateLayout setting transcript style width ("+w+"): "+e);}

			//timeline
			try
			{
				if(this.timeline)
				{
					this.timeline.updateLayout(viewWidth,this.UI_FOOTER_HEIGHT);
				}
			}
			catch(e){Utils.debug.trace("Error in ui.updateLayout updating timeline layout: "+e);}

			//content width
			if(this.menuPinned && this.menuOpen)
			{
				this.left = viewWidth-this.UI_MENU_WIDTH
				this.setLeftStyleMenu();
			}
			else
			{
				$('content').setStyle('left',0);
				var w = viewWidth;
			}
			$('content').style.top = 0;
			
			//content height
			try
			{
				var timelineHeight = (this.timeline) ? this.timeline.getBarHeight() : 0;
				var h = viewHeight-(this.UI_FOOTER_HEIGHT + timelineHeight + transcriptHeight) + 'px';
				$('content').setStyle('height',h);
			}
			catch(e){Utils.debug.trace("Error in ui.updateLayout setting content frame height ("+h+"): "+e);}

			//menu top/height
			try
			{
				if(this.menuPinned)
				{
					$('menu').setStyle('top',0);
					var h = $('content').getStyle('height').toInt();
					var offset = $('menu').getStyle('padding-bottom').toInt()+$('menu').getStyle('border-width').toInt();
					
					if(Utils.browserDetection.isMobile() && this.iosInputHandler)
					{
						if(this.iosInputHandler.inputBarOpen)
						{
							h-=this.iosInputHandler.getInputBarHeight();
						}
					}

					$('menu').setStyle('height',h-offset);
				}
			}
			catch(e){Utils.debug.trace("Error in ui.updateLayout setting menu height ("+h+"): "+e);}
			
			//menu width
			try
			{
				$('content').setStyle('width',w);
			}
			catch(e){Utils.debug.trace("Error in ui.updateLayout setting content frame width ("+w+"): "+e);}

			if(Utils.browserDetection.isMobile())
			{
				if(menuScroller)
				{
					setTimeout(function(){menuScroller.refresh();},0);
				}
				if(transcriptScroller)
				{
					setTimeout(function(){transcriptScroller.refresh();},0);
				}
			}
		}
		else
		{
			//content top/height
			$('content').setStyle('top',0);
			try
			{
				var h = viewHeight-(this.UI_FOOTER_HEIGHT);
				$('content').setStyle('height',h);
			}
			catch(e){Utils.debug.trace("Error in ui.updateLayout setting content frame height ("+h+"): "+e);}
			
			try
			{
				if(engine.embedded && engine.enableExit)
				{
					if (engine.mode == engine.MODES.SELF_TEST.value || engine.mode == engine.MODES.ASSESSMENT.value){
						var offset = 20;
						var exitWidth = $('exitBtn').getStyle('margin-right').toInt();
						var w = viewWidth - offset + exitWidth;
						$('exitBtn').setStyle('left',w);
						
						var exitHeight =  $('exitBtn').getStyle('margin-top').toInt();
						var h = viewHeight -offset + exitHeight;
						$('exitBtn').setStyle('top',h);
						
					}
				}
			}
			catch(e){Utils.debug.trace("Error in ui.updateLayout setting exit button: "+e);}
			
			//content width
			try
			{
				$('content').setStyle('width',viewWidth);
			}
			catch(e){Utils.debug.trace("Error in ui.updateLayout setting content frame width ("+w+"): "+e);}
		}

		//footer
		try
		{
			$('footer').setStyle('width',viewWidth);
		}
		catch(e){Utils.debug.trace("Error in ui.updateLayout setting footer width ("+w+"): "+e);}

		if(Utils.browserDetection.isMobile())
		{
			if(stepContentScroller)
			{
				setTimeout(function(){stepContentScroller.refresh();},0);
			}
			if(dialogContentScroller)
			{
				setTimeout(function(){dialogContentScroller.refresh();},0);
			}
			if(keyMenuScroller)
			{
				setTimeout(function(){keyMenuScroller.refresh();},0);
			}
			if(this.iosInputHandler)
			{
				this.iosInputHandler.updateLayout(viewHeight);
			}
		}
	};

	/**
	* Show the debug button
	* @method showDebugOption
	*/
	this.showDebugOption=function()
	{
		var dbgDiv = new Element('div',{
			'id':'debugLink',
			'events':{
				'click':function(e){
					Utils.debug.show();
					e.stop();
				}
			}
		});
		var dbgImg = new Element('img',{
			'src':'assets/img/debug.gif',
			'width':16,
			'height':16
		});
		dbgDiv.adopt(dbgImg);
		$(document.body).adopt(dbgDiv);
	};

	/**
	* Update the audio position/duration string
	* @method audioUpdatePosition
	*/
	this.audioUpdatePosition=function(pos,dur)
	{
		var posStr = this.formatSeconds(pos);
		var durStr = this.formatSeconds(dur);
		var strPosDur = posStr + " / " + durStr;
		if(strPosDur.indexOf("NaN") < 0)
		{
			$('audioPosition').set('text',strPosDur);
		}
	};

	/**
	* Format the total seconds to something meaningful in the UI (00:00)
	* @method formatSeconds
	*/
	this.formatSeconds=function(seconds)
	{
		var min = Math.floor(seconds/60);
		var sec = Math.floor(seconds)%60;
		if(min < 10)
		{
			min = "0"+min;
		}
		if(sec < 10)
		{
			sec = "0"+sec;
		}
		
		return min+":"+sec;
	};
	
	/**
	* Handle the step navigation event at the UI level
	* @method onGoToStep
	*/
	this.onGoToStep=function()
	{
		if($("content").getStyle('display')=='none')
		{
			$("content").setStyle('display', 'block');
		}
		
		// If the transcript is open, refresh its content
		if(this.transcriptOpen)
		{
			this.renderTranscript();
		}
		
		if(engine.mode == engine.MODES.AUTO_PLAYBACK.value)
		{
			$('nextBtn').getElements('a')[0].set('title',this.nextBtnLbl+'. '+this.getStepXofX()+'. '+engine.controller.currentStepObj.getStepContentAsString());
			//$('nextBtn').getElements('a')[0].focus();
			if (!engine.controller.playbackPaused) {
				$('playbackPauseBtn').show();					
				$('playbackPauseBtn').getElements('a')[0].focus();
			}			
		}

		if(Utils.browserDetection.isMobile() && this.iosInputHandler)
		{
			this.iosInputHandler.reset();
			if(this.iosAudioPromptOpen)
			{
				this.hideEnablePlaybackPrompt();
			}
		}

		this.updateInterface();
	};

	/**
	* Handle the engine run event at the UI level
	* @method onEngineRun
	*/
	this.onControllerInit=function()
	{
		if(engine.mode == engine.MODES.STANDARD.value || engine.mode == engine.MODES.AUTO_PLAYBACK.value)
		{
			Utils.debug.trace('Rendering the menu content...');
			this.renderMenu();

			var pos = (Conf.STEP_WINDOW_ALIGNMENT === "right") ? 'upperRight' : 'upperLeft';
			$("menu").position({
				position:pos,
				edge:pos
			});
			this.menuPosition = $("menu").getPosition();

			if(Conf.PIN_STEP_WINDOW)
			{
				this.togglePinMenu();
			}
			
			if(Conf.SHOW_STEP_WINDOW)
			{
				this.toggleMenu(true);
			}
		}

		this.updateLayout();
	};

	this.showEnablePlaybackPrompt=function()
	{
		this.iosAudioPromptOpen = true;
		var prompt = ($('iosAudioPrompt')) ? $('iosAudioPrompt') : $('iosAudioPromptAuto');
		prompt.show();

		if($('audioPlayBtnAuto'))
		{
			$('audioPlayBtnAuto').show();
		}
	};

	this.hideEnablePlaybackPrompt=function()
	{
		if(!this.iosAudioPromptOpen){return;}
		this.iosAudioPromptOpen = false;

		var prompt = ($('iosAudioPrompt')) ? $('iosAudioPrompt') : $('iosAudioPromptAuto');
		prompt.hide();

		if($('audioPlayBtnAuto'))
		{
			$('audioPlayBtnAuto').hide();
		}
	};

	this.handleKeyDownEventAuto=function(e)
	{
		var k = e.keyCode;

		switch(k)
		{
			case 77: // m = 77
				this.toggleMenu();
				break;
			case 84: // t = 84
				this.toggleTranscript();
				break;
			case 27: // Esc = 27
				engine.displayExitPrompt();
				break;
			case 32: // Spacebar = 32
				engine.controller.toggleAutoPlayback();
				return false;
				break;
			case 39: // Right Arrow = 39
				engine.controller.next();
				break;
			case 37: // Left Arrow = 37
				engine.controller.back();
				break;
		}

		return true;
	};

	this.setMenuFocused=function(focused,el)
	{
		if($chk(el))
		{
			this.activeElement = el;
			if(el.id.toLowerCase().indexOf('step') > -1)
			{
				engine.ui.openGroupMenuEntry(this.activeElement.getAttribute('parentGroupIdx'));
			}
		}
		this.menuFocused = focused;
	};

	this.skipMenu=function()
	{
		if(engine.mode == engine.MODES.AUTO_PLAYBACK.value)
		{
			$('nextBtn').getElements('a')[0].focus();
		}
		this.menuFocused = false;
	};

	this.patchTitleOpen=function(id)
	{
		var a = $(id).getElements('a')[0];
		a.set('title',$(id).retrieve('label')+'-'+Lang.ACCESSIBILITY_OPEN);
	};

	this.patchTitleClosed=function(id)
	{
		var a = $(id).getElements('a')[0];
		a.set('title',$(id).retrieve('label')+'-'+Lang.ACCESSIBILITY_CLOSED);
	};

	this.patchTitleOn=function(id)
	{
		var a = $(id).getElements('a')[0];
		a.set('title',$(id).retrieve('label')+'-'+Lang.ACCESSIBILITY_ON);
	};

	this.patchTitleOff=function(id)
	{
		var a = $(id).getElements('a')[0];
		a.set('title',$(id).retrieve('label')+'-'+Lang.ACCESSIBILITY_OFF);
	};

	this.removeFromTabChain=function(el)
	{
		el.getElements('a')[0].set('tabindex',-1);
	};

	this.resetTabIndex=function(el)
	{
		var idx = el.get('tabidx');
		el.getElements('a')[0].set('tabindex',idx);
	};

	this.cleanup=function()
	{
		this.nextBtnLbl = null;
		this.content = null;
		this.footer = null;
		this.mouseCatcher = null;
		$("mouseCatcher").destroy();
		this.activeElement = null;
		this.iosInputHandler = null;
		if(engine.mode == engine.MODES.STANDARD.value || engine.mode == engine.MODES.AUTO_PLAYBACK.value)
		{
			this.menuFx = null;
			this.timeline.cleanup();
			this.timeline = null;
			this.groupMenuEntries = null;
		}
	};
};
