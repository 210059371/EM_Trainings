/** 
* Defines the ActionKey object for key-press actions
* @requires Action
* @extends Action
* @constructor
*/
var ActionKey = new Class({
    Extends: Action,
    
	initialize: function(o)
	{
		this.parent(o); //will call initialize of Action
		this.actionMode = "key";
		//this.interactionsType = "performance";
		this.correct = false;
		this.actionIconImage = "action_key.png";
	},

	renderActionHandler: function(index,w,h)
	{
		this.renderVisuals(index,w,h);
	},

	animateCursor: function(stepCursor){},

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
		var borderOffset = (this.borderWidth/2);
		var c = Utils.dom.createCanvasElement("stepActionsCanvas"+index, actionContainer, r.width+this.borderWidth, r.height+this.borderWidth, "stepActionsCanvas", r.x-borderOffset, r.y-borderOffset);
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
	}
});
