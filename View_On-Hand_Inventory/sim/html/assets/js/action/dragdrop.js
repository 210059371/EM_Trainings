/** 
* Defines the ActionDragDrop object for drag and drop actions
* @requires Action
* @extends Action
* @constructor
*/
var ActionDragDrop = new Class({
    Extends: Action,
    
	initialize: function(o)
	{
		this.parent(o); //will call initialize of Action
		this.actionMode = "dragdrop";
		//this.interactionsType = "matching";
		this.correct = false;
		this.actionIconImage = "action_dnd.png";
		this.moving = false;
		this.hotspot1 = null;
		this.hotspot2 = null;
	},

	renderActionHandler: function(index,w,h)
	{
		if(engine.mode != engine.MODES.AUTO_PLAYBACK.value)
		{
			if(Utils.browserDetection.isMobile())
			{
				this.renderClickableDropTarget();
				this.renderClickableDragElement();
			}
			else
			{
				this.renderDropTarget();
				this.renderDraggableElement();
			}
		}
		
		if(engine.mode == engine.MODES.AUTO_PLAYBACK.value)
		{
			// have to create both drag and drop divs for UPC-15322
			this.renderDropTarget();
			this.createDraggableElement();
		}
		this.renderVisuals(index, w, h);
	},

	renderClickableDragElement: function()
	{
		var self = this;
		this.touchStart = 0;
		var r = this.dragTarget.rectangle;
		var imgFile = engine.imagePath+this.objectImageFile;
		var selectionPadding = 10;

		this.dragEl = new Element('div', {
			'id':'actionDrag'+this.index,
			'class':'dragHandler',
			'events':{
				'touchend':function(e)
				{
					if(!self.moving)
					{
						self.step.setSelectedDragAction(self);
						if(!$chk($('dragDropSelection')))
						{
							var d = new Element('div',{'id':'dragDropSelection'});
							$("stepActionHandlers").adopt(d);
						}
						$('dragDropSelection').setStyle('height',r.height+(selectionPadding*2)-10); // 10 for border
						$('dragDropSelection').setStyle('width',r.width+(selectionPadding*2)-10); // 10 for border
						$('dragDropSelection').setStyle('top',r.y-selectionPadding);
						$('dragDropSelection').setStyle('left',r.x-selectionPadding);

						$('dragDropSelection').selectionFx = new Fx.Morph($('dragDropSelection'),{
							link: 'ignore',
							duration: 250
						}).start({
							'opacity':[0,0.5]
						});

						return;
					}
					self.moving = false;
					
					var modifiersMatch = EventHandler.compareModifiers(self.modifiers);
					if(Utils.dom.hitTest(this,self.dropEl) && modifiersMatch)
					{
						self.markCorrect();
					}
					else
					{
						this.setStyle('left', r.x);
						this.setStyle('top', r.y);

						self.markIncorrect();
					}
					e.stopPropagation();
				},
				'touchmove':function(e)
				{
					e.preventDefault();
					e.stopPropagation();

					self.moving = true;

					var t = e.targetTouches[0];
					if(t == null){return}
					
					var scrollOffset = Utils.dom.isDocRTL() ?  (stepContentScroller.maxScrollX + stepContentScroller.x) : stepContentScroller.x;					
					this.setStyle('left', (t.pageX - $("content").getStyle('left').toInt() - (this.getStyle('width').toInt()/2))
							- scrollOffset);
					this.setStyle('top', (t.pageY-(this.getStyle('height').toInt()/2))+(-stepContentScroller.y));
				}
			}
		});
		this.dragEl.setStyle('left',r.x);
		this.dragEl.setStyle('top',r.y);
		this.dragEl.setStyle('width',r.width);
		this.dragEl.setStyle('height',r.height);

		var img = new Element('img', {
			'src':imgFile,
			'width':r.width,
			'height':r.height
		});
		this.dragEl.setStyle('opacity',0.75);
		this.dragEl.adopt(img);

		this.renderDragNone(r);

		$("stepActionHandlers").adopt(this.dragEl);
	},

	createDraggableElement: function()
	{
		var r = this.dragTarget.rectangle;
		var imgFile = engine.imagePath+this.objectImageFile;
		this.dragEl = new Element('div', {
			'id':'actionDrag'+this.index,
			'class':'dragHandler'
		});
		this.dragEl.setStyle('left',r.x);
		this.dragEl.setStyle('top',r.y);
		this.dragEl.setStyle('width',r.width);
		this.dragEl.setStyle('height',r.height);
		
		this.hotspot1 = this.dragEl;

		$("stepActionHandlers").adopt(this.dragEl);
	},
	
	renderDraggableElement: function()
	{
		var r = this.dragTarget.rectangle;
		var imgFile = engine.imagePath+this.objectImageFile;
		this.dragEl = new Element('div', {
			'id':'actionDrag'+this.index,
			'class':'dragHandler'
		});
		this.dragEl.setStyle('left',r.x);
		this.dragEl.setStyle('top',r.y);
		this.dragEl.setStyle('width',r.width);
		this.dragEl.setStyle('height',r.height);

		switch(this.imageType)
		{
			case 'actual':
				this.renderDragActual(r,imgFile);
				break;

			case 'ghosted':
				this.renderDragGhosted(r,imgFile);
				break;

			case 'border':
				this.renderDragBorder(r);
				break;

			case 'none':
				this.renderDragNone(r);
				break;

			default:
				Utils.debug.trace('No valid "imageType" specified for ActionDragDrop');
		}

		$("stepActionHandlers").adopt(this.dragEl);

		var self = this;
		var allowance = 10;

		this.drag = this.dragEl.makeDraggable({
			container: $("stepImage"),
			droppables: this.dropEl,
			precalculate: true,
			onStart: function(){
				Utils.debug.trace('Drag started...');
				self.step.setActiveAction(self);
			},
			onDrop: function(el,dropArea){
				
				var dragLeft = self.dragEl.getStyle('left').toInt();
				var dragTop = self.dragEl.getStyle('top').toInt();

				var dropLeft = self.dropEl.getStyle('left').toInt();
				var dropTop = self.dropEl.getStyle('top').toInt();
				
				if(dropArea != null)
				{
					//correct drop
					self.dragEl.setStyle('left',dropLeft);
					self.dragEl.setStyle('top',dropTop);
					self.dragEl.destroy();
					self.dragEl = null;
					self.dropEl.destroy();
					self.dropEl = null;
					self.markCorrect();
				}
				else
				{
					if(((dragLeft >= dropLeft-allowance) && (dragLeft <= dropLeft+allowance) || (dragLeft >= dropLeft+allowance) && (dragLeft <= dropLeft-allowance)) &&
					   ((dragTop >= dropTop-allowance) && (dragTop <= dropTop+allowance) || (dragTop >= dropTop+allowance) && (dragTop <= dropTop-allowance)))
					{
						//correct drop
						self.dragEl.setStyle('left',dropLeft);
						self.dragEl.setStyle('top',dropTop);
						self.dragEl.destroy();
						self.dragEl = null;
						self.dropEl.destroy();
						self.dropEl = null;
						self.markCorrect();
					}
					else
					{
						//incorrect drop
						self.dragEl.setStyle('left',r.x);
						self.dragEl.setStyle('top',r.y);
						self.markIncorrect();
					}
				}
			}
		});
	},

	renderDragActual: function(r,imgFile)
	{
		var img = new Element('img', {
			'src':imgFile,
			'width':r.width,
			'height':r.height
		})

		this.dragEl.adopt(img);
	},

	renderDragGhosted: function(r,imgFile)
	{
		var img = new Element('img', {
			'src':imgFile,
			'width':r.width,
			'height':r.height
		});
		this.dragEl.setStyle('opacity',0.50);
		this.dragEl.adopt(img);
	},

	renderDragBorder: function(r)
	{
		this.dragEl.setStyle('left',r.x-(this.borderWidth/2));
		this.dragEl.setStyle('top',r.y-(this.borderWidth/2));
		this.dragEl.setStyle('width',r.width-(this.borderWidth));
		this.dragEl.setStyle('height',r.height-(this.borderWidth));

		var img = new Element('img', {
			'src':engine.SPACER,
			'width':r.width,
			'height':r.height
		});
		
		var bdColor = "rgb("+this.borderColor.r+","+this.borderColor.g+","+this.borderColor.b+")";
		
		this.dragEl.setStyle('border',this.borderWidth+'px solid '+bdColor);
		this.dragEl.adopt(img);
	},

	renderDragNone: function(r)
	{
		var img = new Element('img', {
			'src':engine.SPACER,
			'width':r.width,
			'height':r.height
		});

		this.dragEl.adopt(img);		
	},

	renderClickableDropTarget: function()
	{
		var self = this;
		var r = this.dropTarget.rectangle;
		var selectionPadding = 10;
		this.dropEl = new Element('div', {
			'id':'actionDrop'+this.index,
			'class':'clickHandler',
			'events':{
				'click':function()
				{
					Utils.debug.trace('Drop clicked...');
					if(!$chk($('dragDropSelection')))
					{
						var d = new Element('div',{'id':'dragDropSelection'});
						$("stepActionHandlers").adopt(d);
					}
					$('dragDropSelection').setStyle('height',r.height+(selectionPadding*2)-10); // 10 for border
					$('dragDropSelection').setStyle('width',r.width+(selectionPadding*2)-10); // 10 for border
					$('dragDropSelection').setStyle('top',r.y-selectionPadding);
					$('dragDropSelection').setStyle('left',r.x-selectionPadding);
					$('dragDropSelection').setStyle('opacity',0);

					$('dragDropSelection').selectionFx = new Fx.Morph($('dragDropSelection'),{
						link: 'ignore',
						duration: 500,
						onComplete:function(){
							if(self.step.getSelectedDragAction() == self)
							{
								self.markCorrect();
								$('dragDropSelection').destroy();
							}
							else
							{
								self.markIncorrect();
							}
						}
					}).start({
						'opacity':[0,0.5]
					});
				}
			}
		});
		this.dropEl.setStyle('left',r.x);
		this.dropEl.setStyle('top',r.y);
		this.dropEl.setStyle('width',r.width);
		this.dropEl.setStyle('height',r.height);

		var img = new Element('img', {
			'src':engine.SPACER,
			'width':r.width,
			'height':r.height
		});

		this.dropEl.adopt(img);

		$("stepActionHandlers").adopt(this.dropEl);
	},

	renderDropTarget: function()
	{
		var r = this.dropTarget.rectangle;
		this.dropEl = new Element('div', {
			'id':'actionDrop'+this.index,
			'class':'clickHandler'
		});
		this.dropEl.setStyle('left',r.x);
		this.dropEl.setStyle('top',r.y);
		this.dropEl.setStyle('width',r.width);
		this.dropEl.setStyle('height',r.height);
		
		this.hotspot2 = this.dropEl;

		$("stepActionHandlers").adopt(this.dropEl);
	},

	animateCursor: function(stepCursor)
	{
		var curImg = $("cursorImage");
		var stepCursorSrc = engine.imagePath+stepCursor;
		var actionCursorSrc = engine.imagePath+this.cursor.file;
		var dragR = this.dragTarget.rectangle;
		var dropR = this.dropTarget.rectangle;
		var x1 = dragR.x+(dragR.width/2)-5;
		var y1 = dragR.y+(dragR.height/2)-5;
		var x2 = dropR.x+(dropR.width/2)-5;
		var y2 = dropR.y+(dropR.height/2)-5;
		var self = this;
		var img = new Image();
		img.onload = function()
		{
			curImg.src = this.src;
			engine.animator.animateCursorChain(self.step,curImg,x1,y1,x2,y2,self.hotspot1,self.hotspot2,actionCursorSrc);
		}
		img.onerror = function()
		{
			Utils.debug.trace("Error: Cannot load cursor image: "+stepCursorSrc);
			self.step.onCursorDone();
		}

		img.src = stepCursorSrc;
	},

	renderVisuals: function(index,w,h)
	{
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
		var bdColor = "rgba("+this.borderColor.r+","+this.borderColor.g+","+this.borderColor.b+",1.0)";

		var dragR = this.dragTarget.rectangle;
		var dragC = Utils.dom.createCanvasElement("stepActionsCanvasDrag"+index, actionContainer, dragR.width+this.borderWidth, dragR.height+this.borderWidth, "stepActionsCanvas", dragR.x-borderOffset, dragR.y-borderOffset);
		var dragCtx = dragC.getContext('2d');
		dragCtx.strokeStyle = bdColor;
		dragCtx.lineWidth = this.borderWidth;
		dragCtx.lineCap = "round";
		dragCtx.lineJoin = "round";
		dragCtx.strokeRect(1,1,dragR.width,dragR.height);

		var dropR = this.dropTarget.rectangle;
		var dropC = Utils.dom.createCanvasElement("stepActionsCanvasDrop"+index, actionContainer, dropR.width+this.borderWidth, dropR.height+this.borderWidth, "stepActionsCanvas", dropR.x-borderOffset, dropR.y-borderOffset);
		var dropCtx = dropC.getContext('2d');
		dropCtx.strokeStyle = bdColor;
		dropCtx.lineWidth = this.borderWidth;
		dropCtx.lineCap = "round";
		dropCtx.lineJoin = "round";
		dropCtx.strokeRect(1,1,dropR.width,dropR.height);

		//Canvas doesn't support dashed lines! We have to use another lib to get around this at the moment...
		var connectorStartX = dragR.x+parseInt(dragR.width/2);
		var connectorStartY = dragR.y+parseInt(dragR.height/2);
		var connectorEndX = dropR.x+parseInt(dropR.width/2);
		var connectorEndY = dropR.y+parseInt(dropR.height/2);
		var connectorC = Utils.dom.createCanvasElement("stepActionsCanvasConnector"+index, actionContainer, w, h, "stepActionsCanvas", 0, 0);
		var gCtx = new CvsGraphCtx("stepActionsCanvasConnector"+index);
		gCtx.setWorldCoords(0,w,h,0);
		gCtx.setPenColor(bdColor);
		gCtx.setPenWidth(this.borderWidth);
		gCtx.move(connectorStartX, connectorStartY); 
		gCtx.line(connectorEndX, connectorEndY, "dashed");
		if(this.flashing)
		{
			this.flashAction(dragCtx.canvas);
			this.flashAction(dropCtx.canvas);
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
		var r = this.dragTarget.rectangle;
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
