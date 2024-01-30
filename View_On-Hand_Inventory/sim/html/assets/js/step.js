/**
* Class defining the step handling and menu entry display used by the engine
* @param {Object} o A param that specifies the Step class configuration
* @requires Engine
* @requires MooTools
* @constructor
*/
function Step(o)
{
	for (var prop in o)
	{
		this[prop] = o[prop];
	}
	
	this.parent = null;
	this.open = false;
	this.visited = false;
	this.here = false;
	this.menuItemHeight = 20;
	this.stem = null;
	this.childIndex = 0;
	this.actions = [];
	this.notes = [];
	this.overlayTotal = (this.screen.overlays) ? this.screen.overlays.length : 0;
	this.overlaysLoaded = 0;
	this.title = unescape(this.title);
	this.transcript = unescape(this.transcript);
	this.screenWidth = 0;
	this.screenHeight = 0;
	this.correct = false;
	this.completed = false;
	this.helpShown = false;
	this.activeAction = null;
	this.selectedDragAction = null;
	this.inEditMode = false;
	this.audioLoaded = false;
	this.audioStarted = false;
	this.audioCompleted = false;
	this.timelineEntry = null;
	this.isInfoStep = false;
	this.img2 = null;
	this.animationComplete = false;
	this.animationStarted = false;
	this.hasDefaultNoteTiming = false;
	
	this.index = engine.controller.steps.length;
	this.stepNumber = this.index+1;
	engine.controller.steps.push(this);
	
	this.addAction = function(a)
	{
		a.step = this;
		a.index = this.actions.length;
		this.actions.push(a);
	};

	this.addNote = function(n)
	{
		n.step = this;
		n.index = this.notes.length;
		this.notes.push(n);
	};

	this.hasActions = function()
	{
		return (this.actions.length > 0);
	};

	this.hasNotes = function()
	{
		return (this.notes.length > 0);
	};

	this.hasAudio = function()
	{
		return (this.audio != '' && $chk(this.audio));
	};

	this.initialize = function()
	{
		Utils.debug.trace('Step is an information-only step (no actions): '+this.isInfoStep);
		this.reset();
		this.load();
	};

	this.reset = function()
	{
		this.correct = false;
		this.completed = false;
		this.audioLoaded = false;
		this.audioStarted = false;
		this.audioCompleted = false;
		this.animationComplete = false;
		this.inEditMode = false;
		this.helpShown = false;
		this.activeAction = null;
		this.selectedDragAction = null;
		this.overlaysLoaded = 0;		
		$("stepImage").hide();
		$("stepImageOverlays").hide();
	}

	this.load = function()
	{
		this.activeAction = this.getDefaultAction();
		
		this.renderScreenImage();
	};

	this.disable = function()
	{
		this.getActiveAction().disable();
	};

	this.enable = function()
	{
		this.getActiveAction().enable();
	};

	this.onCompleted = function()
	{
		// Finally, all content pieces have loaded...
		this.completed = true;
		engine.controller.advance();
	};

	this.swap = function()
	{
		this.correct = false;
		this.completed = false;
		this.audioLoaded = false;
		this.audioStarted = false;
		this.audioCompleted = false;
		this.inEditMode = false;
		this.helpShown = false;
		this.selectedDragAction = null;
		this.overlaysLoaded = 0;
		this.activeAction = this.getDefaultAction();
		var self = this;

		var swap = $('swapImage');
		swap.style.zIndex = 50;
		swap.style.display = 'block';
		Utils.dom.setOpacity(70, "swapImage");
		
		// Load step...
		var img = new Image();
		var size = this.getNoteBounds();
		
		img.onload = function()
		{
			var stepImage = $("stepImage");
			stepImage.src = img.src;
			stepImage.setAttribute("width",this.width);
			stepImage.setAttribute("height",this.height);
			$("stepImage").setStyle("zIndex", 75);
			$("stepImage").setStyle("position", 'absolute');
			$("stepImage").setStyle("left", '0px');
			$("stepImage").setStyle("top", '0px');
			$("stepImage").setStyle("display", 'block');
			
			if(engine.mode != engine.MODES.AUTO_PLAYBACK.value)
			{
				$("mouseCatcher").setStyle("width",this.width);
				$("mouseCatcher").setStyle("height",this.height);
			}

			self.setScreenWidth(this.width);
			self.setScreenHeight(this.height);

			$("stepContainer").setStyle('width', size.w > this.width ? size.w : this.width);
			$("stepContainer").setStyle('height', size.h > this.height ? size.h : this.height);
			
			if(Utils.browserDetection.isMobile())
			{
				$("stepContainer").setStyle("left", 0);
				$("stepContainer").setStyle("top", 0);

				if(stepContentScroller)
				{
					stepContentScroller.destroy();
					stepContentScroller = null;
				}
				if(Utils.dom.isDocRTL())
				{
					stepContentScroller = new iScroll('content', {rtl: true});
				} else {
					stepContentScroller = new iScroll('content');
				}
				setTimeout(function(){stepContentScroller.refresh();},0);
			}

			self.renderOverlays();
		}
		img.onerror = function()
		{
			Utils.debug.trace("Error: Cannot load step screen image.");
		}
		Utils.debug.trace("Loading screen image: "+this.screen.file);
		img.src = engine.imagePath+this.screen.file;
		swap.style.display = 'none';
		Utils.dom.setOpacity(0, "swapImage");
		swap.style.zIndex = -1;
	};
	
	this.renderScreenImage = function(cb)
	{
		var self = this;

		// Load step...
		var img = new Image();
		var size = this.getNoteBounds();		
		
		img.onload = function()
		{
			var stepImage = $('stepImage');
			stepImage.src = img.src;
			stepImage.setAttribute("width",this.width);
			stepImage.setAttribute("height",this.height);
			$("stepImage").setStyle("zIndex", 25);
			$("stepImage").setStyle("position", 'absolute');
			$("stepImage").setStyle("left", '0px');
			$("stepImage").setStyle("top", '0px');
			$("stepImage").setStyle("visible", 'visible');

			if(engine.mode != engine.MODES.AUTO_PLAYBACK.value)
			{
				$("mouseCatcher").setStyle("width",this.width);
				$("mouseCatcher").setStyle("height",this.height);
			}

			self.setScreenWidth(this.width);
			self.setScreenHeight(this.height);

			$("stepContainer").setStyle('width', size.w > this.width ? size.w : this.width);
			$("stepContainer").setStyle('height', size.h > this.height ? size.h : this.height);
			
			if(Utils.browserDetection.isMobile())
			{
				$("stepContainer").setStyle("left", 0);
				$("stepContainer").setStyle("top", 0);

				if(stepContentScroller)
				{
					stepContentScroller.destroy();
					stepContentScroller = null;
				}
				if(Utils.dom.isDocRTL())
				{
					stepContentScroller = new iScroll('content', {rtl: true});
				} else {
					stepContentScroller = new iScroll('content');
				}
				setTimeout(function(){stepContentScroller.refresh();},0);
			}

			self.renderOverlays();
		}
		img.onerror = function()
		{
			Utils.debug.trace("Error: Cannot load step screen image.");
		}
		Utils.debug.trace("Loading screen image: "+this.screen.file);
		img.src = engine.imagePath+this.screen.file;
	};

	this.renderSwapImage = function()
	{
		var container = $('stepImageContainer');
		try {
			var swapImage = $('swapImage');
			if (swapImage != null)
			{
				container.removeChild(swapImage);
			}
		} catch(ex) {
			Utils.debug.trace("Could not remove swap image: "+swapImage);
		}
		this.img2 = new Image();
		this.img2.setAttribute('id', 'swapImage');
		this.img2.src = engine.imagePath+this.screen.file;
		this.img2.style.zIndex = -1;
		this.img2.style.position = 'absolute';
		this.img2.style.left = '0px';
		this.img2.style.top = '0px';
		this.img2.style.display = 'none';

		container.appendChild(this.img2);
		Utils.debug.trace("Loading screen image2: " + this.screen.file);	
	};
	
	this.renderOverlays = function()
	{
		var overlayCont = $('overlayCont');
		if (overlayCont != null)
		{
			$('overlayCont').empty();
		} else {
			overlayCont = new Element('div',{
				'id':'overlayCont'
			});
			$('stepContainer').adopt(overlayCont);
		}
	
		overlayCont.style.zIndex = 50;
		overlayCont.style.position = 'absolute';
		overlayCont.style.left = '0px';
		overlayCont.style.top = '0px';		
		
		overlayCont.adopt($('stepImageOverlays').getChildren());
		overlayCont.style.display = 'block';	
	
		$('stepImageOverlays').style.display = 'none';
		if (this.hasNotes()){	
			this.notes.each(function(item,index){
				if (item.noteAnimator != null){
					item.noteAnimator.cancelAnimations();
				}
			});
		}
		$('stepImageOverlays').getChildren().destroy();
		$('stepImageOverlays').empty();
		if(!this.screen.overlays)
		{
			this.renderRemainingContent();
			return;
		}

		this.screen.overlays.each(function(item,index){
			this.loadOverlayImage(item);
		},this);
	};

	this.loadOverlayImage = function(o)
	{
		var self = this;
		var img = new Image();
		var r = o.rectangle;
		img.onload = function()
		{
			self.overlaysLoaded++;
			var overlay = Utils.dom.createImageElement("overlay_"+self.overlaysLoaded, $("stepImageOverlays"), r.width, r.height, r.x, r.y, "overlayImage");
			overlay.src = this.src;
			self.onOverlayImageLoaded();
		}
		img.onerror = function()
		{
			self.overlaysLoaded++;
			Utils.debug.trace("Error: Cannot load step overlay image.");
			self.onOverlayImageLoaded();
		}
		Utils.debug.trace("Loading overlay image: "+o.file);
		img.src = engine.imagePath+o.file;
	};

	this.onOverlayImageLoaded = function()
	{
		Utils.debug.trace('Overlay loaded: '+this.overlaysLoaded);
		if(this.overlaysLoaded >= this.overlayTotal)
		{
			this.renderRemainingContent();
		}
	};

	this.renderRemainingContent = function()
	{
		$("stepImage").show();
		$("stepImageOverlays").setStyle("zIndex", 75);
		$("stepImageOverlays").setStyle("position", 'absolute');
		$("stepImageOverlays").setStyle("left", '0px');
		$("stepImageOverlays").setStyle("top", '0px');
		$("stepImageOverlays").setStyle("display", 'block');
		this.renderNotes();
		this.renderActions();
		this.renderTooltips();

		if(engine.mode != engine.MODES.AUTO_PLAYBACK.value)
		{
			EventHandler.enable();
		}

		engine.contentLoaded();

		this.initPlayback();
		
		$('overlayCont').getChildren().destroy();
		$('overlayCont').empty();
		
	};

	this.getNoteBounds=function()
	{
		var maxW = this.screenWidth;
		var maxH = this.screenHeight;
		var shadowOffset = 20;
		if (Utils.dom.isDocRTL()) {
			shadowOffset = 0;
		}
		
		this.notes.each(function(item){
			if(item.visible)
			{
				var r = item.rectangle.right;
				var b = item.rectangle.bottom;
				if(r > maxW){maxW = r};
				if(b > maxH){maxH = b};
			}
		});
		return {w:maxW+shadowOffset,h:maxH+shadowOffset};
	};
	
	this.renderNotes = function()
	{
		if(!this.hasNotes()){return;}

		var bounds = this.getNoteBounds();
		this.notes.each(function(item,index){
			var noteContainer = new Element('div',{
				'id':'noteContainer_'+index,
				styles:{
			           position:'absolute',
			           width:bounds.w,
			           height:bounds.h,
			           'z-index':102
			     }
			});
			$('stepNotes').adopt(noteContainer);
			var c = Utils.dom.createCanvasElement("stepNotesCanvas_" + index, noteContainer, bounds.w, bounds.h, "stepNotesCanvas", 0, 0);
			if (item.modes != null && item.modes.indexOf(engine.mode) > -1)
			{
				if (engine.mode == engine.MODES.AUTO_PLAYBACK.value && item.notetailAuto == false && item.actionid != ""){
					item.render(c.getContext('2d'), index, false);
				} else if (engine.mode == engine.MODES.STANDARD.value && item.notetailStandard == false && item.actionid != ""){
					item.render(c.getContext('2d'), index, false);
				} else {
				item.render(c.getContext('2d'), index);
			}
			}
			Utils.dom.setOpacity(0, $(noteContainer));
			$(noteContainer).setStyle("display", "none");
			
		//Don't use the shadow filter in IE9+
		if(Utils.browserDetection.browser == "ie" && Utils.browserDetection.version >= 9)
		{
			Utils.dom.removeFilter(c);
		}
		});
	};

	this.renderHelpNotes = function()
	{
		if(!this.hasNotes()){return;}
		
		this.notes.each(function(item,index){
			var stepNoteCanvas = "stepNotesCanvas_" + index;
			var noteContainer = 'noteContainer_'+index;
			var hs = 'stepNoteHotspot_'+index;
			if (engine.mode == engine.MODES.SELF_TEST.value){
				var selfHelpMode = item.selfHelpMode;
				if (item.modes != null && item.modes.indexOf(selfHelpMode) > -1)
			{
					item.render($(stepNoteCanvas).getContext('2d'), index);
					item.entryDisplayAll(noteContainer, hs);
			}
			}
			if (engine.mode == engine.MODES.ASSESSMENT.value){
				var assessHelpMode = item.assessHelpMode;
				if (item.modes != null && item.modes.indexOf(assessHelpMode) > -1)
				{
					item.render($(stepNoteCanvas).getContext('2d'), index);
					item.entryDisplayAll(noteContainer, hs);
				}
			}
		}, this);
	};

	this.renderActions = function()
	{
		if(this.hasActions())
		{
			var bounds = this.getNoteBounds();		
			
			this.actions.each(function(item,index){
				item.renderActionHandler(index, bounds.w > this.screenWidth ? bounds.w : this.screenWidth, this.screenHeight);
				if(!this.hasNotes() || this.hasNotes() && !this.compareActionId(item.actionid)){
					switch (engine.mode){
					case engine.MODES.AUTO_PLAYBACK.value:
						if (item.hotspotAuto){
							item.displayNoteVisuals();
						} 
						break;
					case engine.MODES.STANDARD.value:
						if (item.hotspotStandard){
							item.displayNoteVisuals();
						}
						break;
					}
				}
			},this);

			var a = this.getDefaultAction();
			if(a.actionMode.contains('edit'))
			{
				a.setFocus();
			}

			if(Utils.browserDetection.isMobile() && stepContentScroller && engine.mode == engine.MODES.AUTO_PLAYBACK.value)
			{
				var func=function(a)
				{
					stepContentScroller.refresh();
					var aRect = a.getRectangle();
					var contentW = $('content').getStyle('width').toInt();
					var contentH = $('content').getStyle('height').toInt();
					var offsetX = (aRect.x+aRect.width)-contentW;
					var offsetY = (aRect.y+aRect.height)-contentH;
					var scrollX = ((aRect.x+aRect.width) > contentW) ? -offsetX : 0;
					var scrollY = ((aRect.y+aRect.height) > contentH) ? -offsetY : 0;
					if(!(scrollX == 0 && scrollY == 0))
					{
						stepContentScroller.scrollTo(scrollX,scrollY,500);
					}
				};
				setTimeout(function(){func(a);},0);
			}

			if(Utils.browserDetection.isMobile())
			{
				var formEls = document.getElements('input');
				formEls.each(function(item, index){
					item.addEventListener('touchstart', function(e) {
					    e.stopPropagation();
					}, false);
				});
			}
		}

		if(engine.mode != engine.MODES.AUTO_PLAYBACK.value)
		{
			EventHandler.enable();
		}
	};

	this.renderActionVisuals = function()
	{
		if(this.hasActions())
		{
			this.actions.each(function(item,index){
				var hotspotStandard = item.hotspotStandard;
				var hotspotAuto = item.hotspotAuto;
				var selfHelpMode = item.selfHelpMode;
				var assessHelpMode = item.assessHelpMode;
				switch (engine.mode){
					case engine.MODES.SELF_TEST.value:
						if (selfHelpMode == engine.MODES.AUTO_PLAYBACK.value && hotspotAuto){
							item.displayNoteVisuals();
						} else if (selfHelpMode == engine.MODES.STANDARD.value && hotspotStandard){
							item.displayNoteVisuals();
						}
						break;
					case engine.MODES.ASSESSMENT.value:
						if (assessHelpMode == engine.MODES.AUTO_PLAYBACK.value && hotspotAuto){
							item.displayNoteVisuals();
						} else if (assessHelpMode == engine.MODES.STANDARD.value && hotspotStandard){
							item.displayNoteVisuals();
						}
						break;
				}
			},this);
		}
	};

	this.showActionNoteVisuals = function()
	{
		var display = false;
		if(this.hasActions())
		{
			this.actions.each(function(item,index){
				if (engine.mode == engine.MODES.AUTO_PLAYBACK.value && item.hotspotAuto){
					display = true;
				}
				if (engine.mode == engine.MODES.STANDARD.value && item.hotspotStandard){
					display = true;
				}
			},this);
		}
		return display;
	};
	
	this.renderTooltips = function()
	{
		if(this.tooltips)
		{
			this.tooltips.each(function(item,index){
				this.renderTooltip(item,index);
			},this);
		}
	};

	this.renderTooltip = function(toolTipObj,index)
	{
		var tt;
		if(this.hasActions())
		{
			var a = this.getDefaultAction();
			var isEditAction = a.actionMode.contains('edit');
			var isMouseAction = a.actionMode.contains('mouse');
			if (isEditAction || isMouseAction){
				tt = new Element('div',{
					'id':'tooltip'+index,
					'class':'tooltip',
					'events': {
						'click': function(e){
							$('tooltip'+index).hide();
						}
					}
				});
			} else {
				tt = this.renderTooltipDiv(tt, index);
			}
		} else {
			tt = this.renderTooltipDiv(tt, index);
		}
		var img = new Element('img',{
			'src':engine.SPACER,
			'width':'100%',
			'height':'100%',
			'class' : 'mootips',
			'title':unescape(toolTipObj.content)
		});
		tt.setStyle('top',toolTipObj.rectangle.y);
		tt.setStyle('left',toolTipObj.rectangle.x);
		tt.setStyle('width',toolTipObj.rectangle.width);
		tt.setStyle('height',toolTipObj.rectangle.height);
		
		img.setStyle('width',toolTipObj.rectangle.width);
		img.setStyle('height',toolTipObj.rectangle.height);		
		
		tt.adopt(img);
		$('stepTooltips').adopt(tt);
		engine.toolTips.attach(img);
	};
	
	this.renderTooltipDiv = function(tt, index)
	{
		tt = new Element('div',{
			'id':'tooltip'+index,
			'class':'tooltip'
		});
		
		return tt;
	}

	this.showTooltips = function()
	{
		if(this.tooltips)
		{
			this.tooltips.each(function(item,index){
				$('tooltip'+index).show();
			},this);
		}
	};
	
	this.initPlayback = function()
	{
		if(engine.mode == engine.MODES.ASSESSMENT.value && this.assess)
		{
			this.setInitialInteractionData();
		}

		this.setFocus();
		
		if(engine.controller.playbackPaused)
		{
			this.renderNotesInPaused();
		}

		if(Conf.AUTO_HIDE_AUDIO_CONTROLS)
        {
	    	if(engine.controller.currentStepObj.audio && (Conf.AUDIO_TYPE != null)) 
	        {
        		engine.ui.showAudioControls();
        	}
        	else
        	{
        		engine.ui.hideAudioControls();
        	}
        }

		if(this.hasAudio() && (engine.mode == engine.MODES.STANDARD.value || engine.mode == engine.MODES.AUTO_PLAYBACK.value) && !engine.controller.isMuted && engine.audio.ready)
		{
			engine.controller.loadAudio();
		}
		else
		{
			this.startPlaybackTimer();
		}
		if (engine.mode == engine.MODES.SELF_TEST.value || engine.mode == engine.MODES.ASSESSMENT.value){
			if (this.hasNotes()) {
				this.displayNotes();
			}
		}
	};

	this.startPlaybackTimer = function()
	{
		if(engine.controller.playbackPaused){return;}

		if(engine.mode == engine.MODES.AUTO_PLAYBACK.value || (!this.hasActions() && !this.isInfoStep))
		{
			engine.controller.startTimer();
			if(engine.mode == engine.MODES.AUTO_PLAYBACK.value)
			{
				this.checkIfNotes();
			}
		}

		if(engine.mode == engine.MODES.STANDARD.value)
		{
			this.checkIfNotes();
		}
	};
	
	this.checkIfNotes = function()
	{
		this.animationComplete = false;
		if (this.hasNotes()) {
			this.displayNotes();
		} else {
			if (this.hasActions() && !this.hasAudio()){	
				this.startAnimations();
			}
		}
	};
	
	this.renderNotesInPaused = function()
	{
		if(!this.hasNotes()){return;}
		
		this.notes.each(function(item,index){
		    if (item.modes != null && item.modes.indexOf(engine.mode) > -1)
		    {
		        var stepNoteCanvas = "stepNotesCanvas_" + index;
		        var noteContainer = 'noteContainer_' + index;
		        var hs = 'stepNoteHotspot_' + index;
		        if (item.displayNoteTime == 0 && item.duration == 0) {
		            item.render($(stepNoteCanvas).getContext('2d'), index);
		            item.entryDisplayAll(noteContainer, hs);
		        }
		    }
		}, this);
	};
	
	this.displayNotes = function()
	{
		this.notes.each(function(item,index){
			item.display(index);
		});
	};
	
	this.pauseNotes = function()
	{
		this.notes.each(function(item,index){
			item.pauseNoteTimer();
		});
	};
	
	this.resumeNotes = function()
	{
		this.notes.each(function(item,index){
			item.resumeNoteTimer();
		});
	};
	
	this.stopNotes = function()
	{
		this.notes.each(function(item,index){
			item.stopNoteTimer();
		});
	};
	
	this.resetNotes = function()
	{
		this.notes.each(function(item,index){
			item.resetNoteTimer();
		});
	};
	
	this.startAnimations = function()
	{
		if (this.animationStarted === false) {
			this.animationStarted = true;
			this.renderComposite();
		}
	};

	this.renderComposite = function()
	{
		if(this.hasActions())
		{
			if(this.composite)
			{
				$('stepActionComposite').show();
				var bounds = this.getNoteBounds();									
				var a = this.getDefaultAction();
				a.fadeComposite(bounds.w > this.screenWidth ? bounds.w : this.screenWidth,this.screenHeight);
				Utils.debug.trace("Rendered composite for " + this.stepNumber);
			}
			else
			{
				this.onCompositeDone();
			}
		}
		else
		{
			this.onCompositeDone();
		}
	};

	this.onCompositeDone = function()
	{
		//Composite has completed animating
		if(this.hasActions())
		{
			if(engine.mode == engine.MODES.AUTO_PLAYBACK.value)
			{
			    var a = this.getDefaultAction();
				var isEditAction = a.actionMode.contains('edit');
				var isKeyAction = a.actionMode.contains('key');
				if ((this.cursor || isEditAction) && Conf.DISPLAY_MOUSE_TRACK && !isKeyAction)
				{
					if(isEditAction)
					{
						$("cursorImage").hide();
					}
					else
					{
						$("cursorImage").show();
					}
					a.animateCursor(this.cursor,a);
				}
				else
				{
					this.onCursorDone();
				}
			}
		}
		else
		{
			this.onCursorDone();
		}
	};

	this.onTimerDone = function()
	{
		if(engine.mode == engine.MODES.SELF_TEST.value || engine.mode == engine.MODES.ASSESSMENT.value || !this.hasAudio() || !engine.audio.isPlaying){
			this.onCompleted();
		}
	};

	this.onCursorDone = function()
	{
		this.animationComplete = true;
		this.animationStarted = false;
		if(engine.mode == engine.MODES.AUTO_PLAYBACK.value)
		{
			if (this.hasNotes()){
				this.notes.each(function(item,index){
					item.setTimerDone();
				});
			} else {
				if (this != engine.controller.getLastStep()){
					this.onCompleted();
				}
			}
		}
	};

	this.onAudioLoad = function()
    {
		this.audioLoaded = true;
		this.startPlaybackTimer();
	};

	this.onAudioStart = function()
    {
		this.audioStarted = true;
	};

	this.onAudioComplete = function()
    {
    	if(!this.audioCompleted)
    	{
			this.audioCompleted = true;
			if (this.hasNotes()){	
				this.notes.each(function(item,index){
					item.setTimerDone();
				});
			} else {
				if (this == engine.controller.getLastStep()){
					this.onCompleted();
				} else {
					this.renderComposite();
				}
			}
		}
	};
	
	/**
     * Returns a note with the maximum time for a step
     * applies only to auto playback 
     * @method initialize
     */
	this.getMaximumNote = function()
	{
		if(!this.hasNotes())
		{
			Utils.debug.trace("No notes exist for step "+this.stepNumber);
			return null;
		}
		
		var n = null;
		var compareTime = 0;
		var noteIndex = 0;
		this.notes.each(function(item,index){
			var maximumTime = item.displayNoteTime + item.duration;
			if (maximumTime >= compareTime){
				compareTime = maximumTime;
				n = item;
		}
		},this)
		
		return n;
	};

	/**
     * Returns boolean if notes within a step has no action id
     * @method initialize
     */
	this.getNoAction = function()
	{
		if(!this.hasNotes())
		{
			Utils.debug.trace("No notes exist for step "+this.stepNumber);
			return null;
		}
		
		var noAction = false;
		this.notes.each(function(item,index){
			if (item.actionid == ""){
				noAction = true;
			} 
		},this)
		
		return noAction;
	};
	
	this.compareActionId = function(actionId){
		if(!this.hasNotes())
		{
			Utils.debug.trace("No notes exist for step "+this.stepNumber);
			return null;
		}
		
		var match = false;
		this.notes.each(function(item,index){
			if (item.actionid == actionId){
				match = true;
			} 
		},this)
		
		return match;
	}
	
	this.getDefaultAction = function()
	{
		if(!this.hasActions())
		{
			Utils.debug.trace("No actions exist for step "+this.stepNumber);
			return null;
		}
		
		var a = null;
		this.actions.each(function(item,index){
			if(item.isDefault)
			{
				a = item;
			}
		},this)

		if(!$chk(a))
		{
			Utils.debug.trace("Error: Cannot detect default action for step "+this.stepNumber);
		}
		
		return a;
	};
	
	this.getActionByCsh = function(primaryCsh, secondaryCsh, tertiaryCsh, application, pSearchTempData)
	{
		if(!this.hasActions())
		{
			return null;
		}

		for(var iAction = 0; iAction < this.actions.length; iAction ++)
		{
			var action = this.actions[iAction];
			if(action.isMatchCsh(primaryCsh, secondaryCsh, tertiaryCsh, application, pSearchTempData) && pSearchTempData.partialMatchElement==null)
			{//Found full match
				return action;
			}
		}
		
		//Return first partial match
		return pSearchTempData.partialMatchElement;
	};

	this.getActiveAction = function()
	{
		Utils.debug.trace('Active action is: '+this.activeAction.actionMode);
		return this.activeAction;
	};

	this.setActiveAction = function(a)
	{
		Utils.debug.trace('Setting active action to: '+a.actionMode);
		this.activeAction = a;
	};

	this.getSelectedDragAction = function()
	{
		Utils.debug.trace('Selected drag action is: '+this.activeAction.actionMode);
		return this.selectedDragAction;
	};

	this.setSelectedDragAction = function(a)
	{
		Utils.debug.trace('Setting selected drag action to: '+a.actionMode);
		this.selectedDragAction = a;
	};

	this.setFocus = function()
	{
		if(this.hasActions())
		{
		    var a = this.getDefaultAction();
		    var isEditAction = a.actionMode.contains('edit');
		    if (isEditAction && engine.mode == engine.MODES.STANDARD.value) 
            {
		        $("cursorImage").hide();
		    }
			this.getActiveAction().setFocus();
		}
	};

	this.setScreenWidth = function(w)
	{
		this.screenWidth = w;
	};

	this.setScreenHeight = function(h)
	{
		this.screenHeight = h;
	};

	/**
	 * Set this as the current step being loaded into the engine
	 * @method setAsCurrentStep
	 */
	this.setAsCurrentStep = function()
	{
		this.visited = true;
		this.here = true;
		this.resetState();
	};
	
	this.resetState = function() {
		this.animationStarted = false;
	};

	this.getStepContentAsString = function()
	{
		var tmp = '';

		this.content.each(function(item, index){
			if(item.text && item.text != ".")
			{
				tmp += item.text;
			}
			else if(item.image)
			{
				tmp += '[IMG]';
			}
		},this);
		
		try{
			var stepInnerText = unescape(tmp);
			stepInnerText = new Element('div', {
					'html' : stepInnerText
				});
			stepInnerText = stepInnerText.get('text');
			tmp = stepInnerText;
		}catch(err){
			tmp = '';
		}

		return tmp;
	}

	this.getMenuContent = function(parentGroupIdx)
	{
		var i = this.index;
		var caption = this.caption;
		var defAction = this.getDefaultAction();

		var tbl = new Element('table', {
				'class': 'menuEntryStepContainer',
				'id': 'menuEntryStep'+i,
				'title': Lang.ACCESSIBILITY_MENU_ITEM+': '+unescape(this.getStepContentAsString()),
				'tabindex': -1
			});

		var tbody = new Element('tbody');
		tbl.adopt(tbody);
		
		var tr = new Element('tr');
		tbody.adopt(tr);

		var id = 'stepStatus_'+i;
		var stepStatusCell = new Element('td', {
				'id': id,
				'tabindex': -1,
				'class': 'menuEntryStepStatus'
			});
		tr.adopt(stepStatusCell);

		var img = (this.here) ? 'menu_status_here.png' : (this.visited) ? 'menu_status_visited.png' : 'menu_status_default.png';
		var stepStatusCellImg = new Element('img', {
				'id':'stepStatusImg_'+this.id,
				'tabindex': -1,
				'src': engine.skinPath+img,
				'class': 'menuEntryStepStatusImg'
			});
		stepStatusCell.adopt(stepStatusCellImg);

		if($chk(defAction) || this.isInfoStep)
		{
			var id = "menuEntryStepIcon_"+i;
			var stepIcon = new Element('td', {
					'class': 'menuEntryStepActionIcon',
					'tabindex': -1
				});

			if($chk(defAction))
			{
				var stepIconImg = new Element('img',{
						'src': engine.skinPath+defAction.actionIconImage,
						'tabindex': -1,
						'class': 'menuEntryStepActionIconImg'
					});
			}
			else if(this.isInfoStep)
			{
				var stepIconImg = new Element('img',{
						'src': engine.skinPath+"info.png",
						'tabindex': -1,
						'class': 'menuEntryStepActionIconImg'
					});
			}

			stepIcon.adopt(stepIconImg);

			tr.adopt(stepIcon);
		}

		var id = "menuEntryStepContent_"+i;
		var contentCell = new Element('td', {
			'id': id,
			'tabindex': -1,
			'class': 'menuEntryStepContent'
		});
		tr.adopt(contentCell);
		this.content.each(function(item, index){
			if(item.text && item.text != ".")
			{
				var html = unescape(item.text.trim());
				var stepContent = new Element('div', {
						'class': 'menuEntryStepContentLabel',
						'html': html
					});
			}
			else if(item.image)
			{
				var stepContent = new Element('div', {
						'class': 'menuEntryStepContentLabel',
						'styles':{
							'max-width':Conf.STEP_WINDOW_MAX_IMAGE_SIZE_W,
							'height':Conf.STEP_WINDOW_MAX_IMAGE_SIZE_H,
							'background':'url('+engine.imagePath+item.image+') no-repeat',
							'overflow':'hidden'
						}
					});
			}
			contentCell.adopt(stepContent);
		},this);

		var stepContainer = new Element('div', {
			'id':'stepContainer'+i,
			'class':'stepContainer',
			'tabindex': 0,
			'stepId': this.id,
			'role': 'listitem',
			'title': Lang.ACCESSIBILITY_MENU_ITEM+': '+unescape(this.getStepContentAsString()),
			'parentGroupIdx': parentGroupIdx,
			'events': {
				'click': function(){
					engine.controller.gotoStepByIndex(i);
				},
				'focus': function(e){
					engine.ui.setMenuFocused(true,this);
				},
				'blur': function(e){
					engine.ui.setMenuFocused(false,null);
				},
				'keydown': function(e){
					if(e.code == 13)
					{
						engine.controller.gotoStepByIndex(i);
						e.stop();
					}
				}
			}
		});

		stepContainer.adopt(tbl);

		return stepContainer;
	};

	this.updateMenuStepStatus = function()
	{
		if($('stepStatusImg_'+this.id))
		{
			var img = (this.here) ? 'menu_status_here.png' : (this.visited) ? 'menu_status_visited.png' : 'menu_status_default.png';
			$('stepStatusImg_'+this.id).set('src',engine.skinPath+img);
		}
		if(this.here)
		{
			$('menuEntryStep'+this.index).addClass('uiPrimaryBackgroundColor');
			$('menuEntryStep'+this.index).removeClass('menuEntryStepContainerDefault');

			$('stepStatus_'+this.index).addClass('uiSecondaryBackgroundColor');
			$('stepStatus_'+this.index).removeClass('menuEntryStepStatusDefault');

			$('menuEntryStepContent_'+this.index).addClass('uiTextColor');
			if (engine.scrollAdjuster != null) {
				engine.scrollAdjuster.toElement('menuEntryStep' + this.index);
			}
			
			$('stepStatusImg_' + this.id).removeClass('menuEntryStepStatusImg');
			$('stepStatusImg_' + this.id).addClass('menuEntryStatusHereImg');
		}
		else
		{
			$('menuEntryStep'+this.index).addClass('menuEntryStepContainerDefault');
			$('menuEntryStep'+this.index).removeClass('uiPrimaryBackgroundColor');

			$('stepStatus_'+this.index).addClass('menuEntryStepStatusDefault');
			$('stepStatus_'+this.index).removeClass('uiSecondaryBackgroundColor');

			$('menuEntryStepContent_'+this.index).removeClass('uiTextColor');
			
			$('stepStatusImg_' + this.id).removeClass('menuEntryStatusHereImg');
			$('stepStatusImg_' + this.id).addClass('menuEntryStepStatusImg');
		}
	};

	this.handleKeyDownEvent = function(e)
	{
		if(this.inEditMode && e.realkeyCode == 46)
		{
			e.keyCode = 46; // Delete key workaround
		}
		if(this.inEditMode && e.realkeyCode == 13 && Conf.REQUIRE_ENTER_PRESS)
		{
			this.getActiveAction().change(e); // IME candidate selection workaround
			return;
		}
		if((!this.hasActions() && !this.isInfoStep) || this.inEditMode){return;}

		if(!this.inEditMode)
		{
			var correct = false;
			this.actions.each(function(item,index){
				if(item.actionMode == "key")
				{
					var modifiersMatch = EventHandler.compareModifiers(item.modifiers);
					if((item.key == e.realkeyCode) && modifiersMatch)
					{
						this.setActiveAction(item);
						correct = true;
					}
				}
			},this);
			
			if(correct || this.isInfoStep)
			{
				this.markCorrect();
			}
			else
			{
				this.markIncorrect();
			}

			if(e.ctrlKey || e.shiftKey || e.altKey || 
				(e.realkeyCode >= 112 || e.realkeyCode <= 123))
			{
		   		EventHandler.killEvent(e);
			}
			return true;
		}
		else
		{
			return EventHandler.killEvent(e);
		}

		return false;
	};

	this.handleKeyUpEvent = function(e)
	{
		if(!this.hasActions()){return;}

		if(this.inEditMode && (e.realkeyCode < 112 || e.realkeyCode > 123))
		{
			if(e.realkeyCode == 13 && Conf.REQUIRE_ENTER_PRESS){return;} // IME candidate selection workaround
			this.getActiveAction().change(e);
			EventHandler.clearModifiers();
			EventHandler.killEvent(e);
			return true;
		}
		else
		{
			EventHandler.clearModifiers();
			return EventHandler.killEvent(e);
		}

		return false;
	};

	this.handleDoubleClickEvent = function(e)
	{
		if(!this.hasActions() && !this.isInfoStep){return;}
		if(this.isInfoStep){this.markCorrect();return;}
		Utils.debug.trace('Element clicked: '+e.target.id);
		var correct = false;
		this.actions.each(function(item,index){
			if(item.actionMode == "mouse")
			{
				var modifiersMatch = EventHandler.compareModifiers(item.modifiers);
				if(item.button == "leftdoubleclick" && item.target == e.target && modifiersMatch && EventHandler.mouseButton === 'left')
				{
					this.setActiveAction(item);
					correct = true;
				}
			}
		},this);

		if(correct)
		{
			this.markCorrect();
		}
		else
		{
			this.markIncorrect();
		}
	};

	this.handleLeftClickEvent = function(e)
	{
		if(!this.hasActions() && !this.isInfoStep){return;}
		Utils.debug.trace('Element clicked: '+e.target.id);
		if(this.isInfoStep){this.markCorrect();return;}
		var correct = false;

		this.actions.each(function(item,index){
			if(item.actionMode == "mouse")
			{
				var modifiersMatch = EventHandler.compareModifiers(item.modifiers);
				Utils.debug.trace('Left click event:: item.button: '+item.button+' | modifiersMatch: '+modifiersMatch+' | item.target.id: '+item.target.id+' | e.target.id: '+e.target.id);
				if(item.button == "leftclick" && item.target.id == e.target.id && modifiersMatch)
				{
					this.setActiveAction(item);
					correct = true;
				}
			}
		},this);
		if(correct)
		{
			this.markCorrect();
		}
		else
		{
			this.markIncorrect();
		}
	};

	this.handleRightClickEvent = function(e)
	{
		if(!this.hasActions() && !this.isInfoStep){return;}
		Utils.debug.trace('Element clicked: '+e.target.id);
		if(this.isInfoStep){this.markCorrect();return;}
		var correct = false;
		this.actions.each(function(item,index){
			if(item.actionMode == "mouse")
			{
				var modifiersMatch = EventHandler.compareModifiers(item.modifiers);
				if(item.button == "rightclick" && item.target == e.target && modifiersMatch)
				{
					this.setActiveAction(item);
					correct = true;
				}
			}
		},this);
		if(correct)
		{
			this.markCorrect();
		}
		else
		{
			this.markIncorrect();
		}
	};

	this.markCorrect = function()
	{
		if(!this.completed)
		{
			this.completed = true;
			this.correct = true;
			if(engine.mode == engine.MODES.ASSESSMENT.value && this.assess)
			{
				this.setGeneralInteractionData();
				engine.comm.setInteractionStudentResponse(this.interactionIndex, engine.comm.interactionTrueString);
				engine.comm.setInteractionResult(this.interactionIndex, true);
				engine.comm.setInteractionTime(this.interactionIndex);
				engine.comm.setInteractionLatency(this.interactionIndex);
			}
			Utils.debug.trace("Step marked correct");
		}

		engine.controller.onActionCorrect();
	};

	this.markIncorrect = function()
	{
		if(!this.completed)
		{
			this.completed = true;
			this.correct = false;
			if(engine.mode == engine.MODES.ASSESSMENT.value && this.assess)
			{
				this.setGeneralInteractionData();
				engine.comm.setInteractionStudentResponse(this.interactionIndex, engine.comm.interactionFalseString);
				engine.comm.setInteractionResult(this.interactionIndex, false);
				engine.comm.setInteractionTime(this.interactionIndex);
				engine.comm.setInteractionLatency(this.interactionIndex);
			}
			Utils.debug.trace("Step marked incorrect");
		}

		engine.controller.onActionIncorrect();
	};

	this.setInitialInteractionData = function()
	{
		// Set the ID of the interaction based on name value, so this won't be reassigned.
		engine.comm.setInteractionId(this.interactionIndex, this.id);

		// Set the timestamp of when this interaction kicked off
		engine.comm.setInteractionTimeStamp(this.interactionIndex);
	};

	this.setGeneralInteractionData = function()
	{
		if(this.isInfoStep)
		{
			// Set the interaction type
			engine.comm.setInteractionType(this.interactionIndex, 'true-false');
		}
		else
		{
			// Set the interaction type
			engine.comm.setInteractionType(this.interactionIndex, this.activeAction.interactionsType);
		}
		
		// Set the interaction's description
		engine.comm.setInteractionDescription(this.interactionIndex, "Step "+this.stepNumber+": "+this.getStepContentAsString());

		// What should the correct response be?
		engine.comm.setInteractionCorrectResponse(this.interactionIndex, engine.comm.interactionTrueString);
	}

	/**
	 * Return a useful string depiction of this step object
	 * @method toString
	 * @return {String} The name of this step object
	 */
	this.toString = function()
	{
		return "Step: "+this.id;
	};

	this.getImages = function()
	{
		var a = [];
		var p = engine.imagePath;
		
		//Screen
		a.push(p+this.screen.file);

		//Overlays
		if(this.screen.overlays)
		{
			this.screen.overlays.each(function(item, index){
				a.push(p+item.file);
			});
		}

		//Cursors
		if(Conf.DISPLAY_MOUSE_TRACK)
		{
			if(this.cursor)
			{
				a.push(p+this.cursor);
			}
		}

		if(this.actions)
		{
			this.actions.each(function(item, index){
				//Action cursors
				if(Conf.DISPLAY_MOUSE_TRACK)
				{
					if(item.cursor.file != "")
					{
						a.push(p+item.cursor.file);
					}
				}
				//DnD draggables
				if(item.objectImageFile)
				{
					a.push(p+item.objectImageFile);
				}
			});
		}

		//Content
		this.content.each(function(item, index){
			try
			{
				if(item.image)
				{
					a.push(p+item.image);
				}
			}
			catch(e){}
		});

		// Notes
		if(this.notes)
		{
			this.notes.each(function(item, index){
				a.push(p+item.image.file);
			});
		}

		return a;
	};
}
