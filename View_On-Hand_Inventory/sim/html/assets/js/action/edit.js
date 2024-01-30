/** 
* Defines the main Edit class for all edit action types to extend
* @constructor
*/
var ActionEdit = new Class({
    Extends: Action,
    
	initialize: function(o)
	{
		this.parent(o); //will call initialize of Action
		//this.interactionsType = "fill-in";
		this.correct = false;
		this.actionIconImage = "action_edit.png";
		this.text = unescape(this.text);
		
		if(engine.mode != engine.MODES.AUTO_PLAYBACK.value)
		{
                	this.text = this.text.replace(/%25/g, '%');

			//Utils.debug.trace('Entered if and this.text value is' + this.text);
		}
	},

	renderActionHandler: function(index,w,h)
	{
		var r = this.rectangle;
		var o = {};
		o.id = "action"+this.index;
		o.parent = $("stepActionHandlers");
		o.w = r.width-(this.borderWidth*2);
		o.h = r.height-(this.borderWidth*2);
		// UPC-11666
		o.x = r.x + this.borderWidth;
		o.y = r.y + this.borderWidth;
		//o.x = r.x;
		//o.y = r.y;
		o.className = "textField";

		if(engine.mode != engine.MODES.AUTO_PLAYBACK.value)
		{
			
			o.change = this.change;
			o.focus = this.focus;
			o.blur = this.blur;

			var el = Utils.dom.createTextField(o);
			el.store('action',this);
			el.store('step',this.step);
			this.textField = el;
			this.setFocus();
		}
		else
		{
			var el = new Element('div',{
				'id':o.id,
				'class':o.className
			});
			el.setStyle('top',o.y);
			el.setStyle('left',o.x);
			el.setStyle('width',o.w);
			el.setStyle('height',o.h);
            
            var fontSize = Utils.dom.determineTextSize(o, el);
            if (fontSize > 0) {
                el.setStyle('font-size',  fontSize+ 'px');		
            }
            
			this.textField = el;
			o.parent.adopt(el);
		}
		
		this.textField.setAttribute('dir', this.isRTL ? "rtl" : "ltr");
		
		this.renderVisuals(index,w,h);
	},

	setFocus: function()
	{
		if(Utils.browserDetection.isMobile()){return;}
		
		if((this.step.getActiveAction() == this) && (engine.mode != engine.MODES.AUTO_PLAYBACK.value))
		{
			var self = this;
			try
			{
				setTimeout(function(){self.textField.focus();},100);
				setTimeout(function(){self.textField.select();},250);
			}
			catch(e){}		
			Utils.debug.trace('Setting focus on TextField: '+this.textField.id);
		}
	},

	disable: function()
	{
		Utils.debug.trace('Disabling edit action');
		this.textField.disabled = true;
	},

	enable: function()
	{
		Utils.debug.trace('Enabling edit action');
		this.textField.disabled = false;
		this.setFocus();
	},

	animateCursor: function()
	{
		engine.animator.animateTextEntry(this.step,this.textField,unescape(this.text));
	},

	renderVisuals: function(index,w,h)
	{
		var r = this.rectangle;
		var actionContainer = new Element('div',{
			'id':this.actionid,
			styles:{
				position: 'absolute',
				width: w,
				height: h,
				'z-index':101
			}
		});
		$('stepActionHandlers').adopt(actionContainer);
		var borderOffset = (this.borderWidth*2);

		// UPC-11666
		var c = Utils.dom.createCanvasElement("stepActionsCanvas"+index, actionContainer, r.width+borderOffset, r.height+borderOffset, "stepActionsCanvas", r.x, r.y);
		//var c = Utils.dom.createCanvasElement("stepActionsCanvas"+index, $("stepActionHandlers"), r.width+borderOffset, r.height+borderOffset, "stepActionsCanvas", r.x-this.borderWidth, r.y-this.borderWidth);
		var ctx = c.getContext('2d');
		var bdColor = "rgba("+this.borderColor.r+","+this.borderColor.g+","+this.borderColor.b+","+this.borderColor.a+")";
		ctx.strokeStyle = bdColor;
		ctx.lineWidth = this.borderWidth;
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		ctx.strokeRect(1,1,r.width,r.height);

		if(this.flashing)
		{
			this.flashAction(ctx.canvas);
		}
		Utils.dom.setOpacity(0, $(actionContainer));
		$(actionContainer).setStyle("display", "none");
	},

	displayNoteVisuals: function()
	{
		var actionContainer = this.actionid;
		$(actionContainer).setStyle("display", "block");
		Utils.dom.setOpacity(100, $(actionContainer));
	},
	
	fadeComposite: function(w,h)
	{
		var compName = "actionComposite"+this.step.index;

		var c = Utils.dom.createCanvasElement(compName, $("stepActionComposite"), w, h, "stepActionComposite", 0, 0);
		var ctx = c.getContext('2d');
		var bgColor = "rgb(0,0,0)";
		var r = this.rectangle;
		ctx.beginPath();  
		ctx.moveTo(0, 0); 
		ctx.lineTo(w, 0);
		ctx.lineTo(w, h);
		ctx.lineTo(0, h);
		ctx.lineTo(0, 0);

		if(Utils.browserDetection.browser != "ie")
		{
			ctx.closePath();
			ctx.fillStyle = bgColor;
			ctx.fill();
			ctx.clearRect(r.x,r.y,r.width,r.height);
		}
		else
		{
			ctx.lineTo(r.x+r.width, 0);
			ctx.lineTo(r.x+r.width, r.y+r.height);
			ctx.lineTo(r.x, r.y+r.height);
			ctx.lineTo(r.x, r.y);
			ctx.lineTo(r.x+r.width, r.y);
			ctx.lineTo(r.x+r.width, 0);
			ctx.closePath();
			ctx.fillStyle = bgColor;
			ctx.fill();
		}

		engine.animator.animateCompositeChain(this.step);
	},

	focus: function(e)
	{
		Utils.debug.trace('Edit mode enabled');
		this.step.inEditMode = true;
		this.step.setActiveAction(this);
	},

	blur: function(e)
	{
		Utils.debug.trace('Edit mode disabled');
		this.step.showTooltips();
		this.step.inEditMode = false;
	},

	change: function(e)
	{
		this.step.setActiveAction(this);
		this.assess(e);
	},

	keyPress: function(e)
	{
		this.step.setActiveAction(this);
	},

	toString: function()
	{
		return 'Edit Action Object Instance';
	}
});

