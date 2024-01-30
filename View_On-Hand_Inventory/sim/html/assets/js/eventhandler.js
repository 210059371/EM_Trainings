/** 
* Global singleton JavaScript event handler library
* @type {Object}
*/
if(!window.EventHandler)
{
	window.EventHandler = {

		enabled: false,
		modifiers: {alt:false, ctrl:false, shift:false},
		mouseButton: 'left',
		moving: false,

		createMouseListener: function(el,clicks)
		{
			var self = this;
			el.set('lastClick',null);

			if(Utils.browserDetection.isMobile())
			{
				el.addEvent('touchend', function(e){
					self.touchend(e,clicks);
				});
				el.addEvent('touchmove', self.touchmove);
				return;
			}
			
			el.addEvent('mouseup', self.handleClicks);
			Utils.debug.trace('Mouse listener (click) created on: '+el.id);
			return;
			
		},

		createKeyListeners: function()
		{
			if(document.addEventListener)
			{
				document.addEventListener('keydown', EventHandler.keyDown, true);
				document.addEventListener('keyup', EventHandler.keyUp, true);
				if(document.onkeypress){document.addEventListener('keypress', EventHandler.doNothing, true);}
				Utils.debug.trace('Key listeners registered');
			}
			else if(document.attachEvent)
			{
				document.attachEvent('onkeydown',EventHandler.keyDown);
				document.attachEvent('onkeyup',EventHandler.keyUp);
				if(document.onkeypress){document.attachEvent('onkeypress',EventHandler.doNothing);}
				Utils.debug.trace('Key events attached');
			}
			else
			{
				document.onkeydown = EventHandler.keyDown;
				document.onkeyup = EventHandler.keyUp;
				if(document.onkeypress){document.onkeypress = EventHandler.doNothing};
				Utils.debug.trace('Key events assigned');
			}
		},

		removeKeyListeners: function()
		{
			var self = this;
			$(document).removeEvents('keydown','keyup','keypress');
		},

		removeMouseListeners: function(el)
		{
			var self = this;
			// ... stub
		},

		doNothing: function(e)
		{
			if(!e) var e = window.event;
			return EventHandler.killEvent(e);
		},

		handleClicks: function(e)
		{
			// function to handle both single and double clicks on the same HTML element
			var el = e.target;
			var now = new Date().getTime();
			var lastClick = el.get('lastClick') || now + 1;
			var delta = now - lastClick;

			clearTimeout(el.get('action'));

			if(delta < 500 && delta > 0)
			{
			   EventHandler.dblclick(e);
			}
			else
			{
				el.set('lastClick', now);
				el.set('action', setTimeout(function(){
					EventHandler.click(e);
					clearTimeout(el.action);
		   		}, 500));
			}
			
			if(!Utils.browserDetection.isMobile())
			{
				e.stop();
			}
		},
		
		touchend: function(e,clicks)
		{
			if(EventHandler.moving)
			{
				EventHandler.moving=false;
				return;
			}

			if(clicks == 1)
			{
				EventHandler.click(e);
			}
			else if(clicks == 2)
			{
				EventHandler.handleClicks(e);
			}

			e.stop();
		},

		touchmove: function(e)
		{
			EventHandler.moving=true;
		},

		click: function(e)
		{
			if(!EventHandler.enabled){return;}

			window.focus(document);

			if(Utils.browserDetection.isMobile())
			{
				if(EventHandler.mouseButton == "right")
				{
					EventHandler.handleRightClick(e);
				}
				else
				{
					EventHandler.handleLeftClick(e);
				}
				return false;
			}

			if(e.rightClick)
			{
				EventHandler.handleRightClick(e);
			}
			else
			{
				EventHandler.handleLeftClick(e);
			}

			return false;
		},

		dblclick: function(e)
		{
			if(!EventHandler.enabled){return;}

			window.focus(document);
			
			EventHandler.handleDblClick(e);

			return false;
		},

		keyDown: function(e)
		{
			if(engine.mode == engine.MODES.AUTO_PLAYBACK.value)
			{
				if(!e) var e = window.event;
				return engine.ui.handleKeyDownEventAuto(e);
			}

			if(!EventHandler.enabled)
			{
				return EventHandler.killEvent(e);
			}

			if(!e) var e = window.event;

			e.realkeyCode = e.keyCode;

			EventHandler.modifiers.ctrl = e.ctrlKey;
			EventHandler.modifiers.shift = e.shiftKey;
			EventHandler.modifiers.alt = e.altKey;

			try
			{
				if(e.keyCode != 46) //del key
				{
					e.keyCode = 32; //space key
				}
			}
			catch(err){}
			
			if(e.realkeyCode != 16 && 
				e.realkeyCode != 17 && 
				e.realkeyCode != 18)
			{
				return engine.controller.currentStepObj.handleKeyDownEvent(e);
			}
			else
			{
				return EventHandler.killEvent(e);
			}
		},

		keyUp: function(e)
		{
			if(!EventHandler.enabled)
			{
				return EventHandler.killEvent(e);
			}

			if(!e) var e = window.event;

			e.realkeyCode = e.keyCode;

			EventHandler.modifiers.ctrl = e.ctrlKey;
			EventHandler.modifiers.shift = e.shiftKey;
			EventHandler.modifiers.alt = e.altKey;

			try
			{
				e.keyCode = 32; //space key
			}
			catch(err){}

			if(e.realkeyCode != 16 && 
				e.realkeyCode != 17 && 
				e.realkeyCode != 18)
			{
				return engine.controller.currentStepObj.handleKeyUpEvent(e);
			}
			else
			{
				EventHandler.clearModifiers();
				return EventHandler.killEvent(e);
			}
		},

		killEvent: function(e)
		{
			if(!e) var e = window.event;

			e.cancelBubble = true;
			e.returnValue = false;

			if(e.preventDefault) e.preventDefault();
			if(e.stopPropagation) e.stopPropagation();
			if(e.preventCapture) e.preventCapture();
			if(e.preventBubble) e.preventBubble();

			return false;
		},

		compareModifiers: function(o)
		{
			return ((this.modifiers.ctrl === o.ctrl) && 
					(this.modifiers.shift === o.shift) && 
					(this.modifiers.alt === o.alt));
		},

		setMouseButton: function(btn)
		{
			this.mouseButton = btn;
		},

		setModifier:function(modifier,val)
		{
			this.modifiers[modifier] = val;
		},

		clearModifiers: function()
		{
			this.modifiers = {alt:false, ctrl:false, shift:false};
			this.mouseButton = "left";
		},

		handleDblClick: function(e)
		{
			engine.controller.currentStepObj.handleDoubleClickEvent(e);
		},

		handleLeftClick: function(e)
		{
			engine.controller.currentStepObj.handleLeftClickEvent(e);
		},

		handleRightClick: function(e)
		{
			engine.controller.currentStepObj.handleRightClickEvent(e);
		},

		disable: function()
		{
			this.clearModifiers();
			EventHandler.enabled = false;
		},

		enable: function()
		{
			this.clearModifiers();
			EventHandler.enabled = true;
		},

		toString: function()
		{
			return "{alt:"+this.modifiers.alt+", ctrl:"+this.modifiers.ctrl+", shift:"+this.modifiers.shift+"}";
		}
	}
}
