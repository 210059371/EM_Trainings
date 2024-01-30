
(function(){
	/**
	* Class used to create note animation
	* @constructor
	* @requires MooTools
	*/
	this.NoteAnimator = function()
	{
		this.started = false;
		this.paused = false;
		this.completed = false;
		this.elementsFx = null;

		this.animateFadeInChain = function(note, noteContainer, hs)
		{
			var self = this;
			
			this.cancelAnimations();

			if(Conf.ENABLE_TRANSITIONS)
			{
				this.started = true;
				this.paused = false;
				
				if ($chk($(noteContainer))){
					$(noteContainer).setStyle('display', 'block');
				}
				if($chk(note.hotspot) && $chk($(hs)))
				{
					$(hs).setStyle('display', 'block');
				}
				if ($chk(note.actionid)){
					if (engine.controller.currentStepObj.showActionNoteVisuals()){
						var actionContainer = note.actionid;
						if($chk($(actionContainer))){
							$(actionContainer).setStyle('display', 'block');
						}
					}
				}
				var index = noteContainer.substring(noteContainer.length-1, noteContainer.length);
				var stepNoteCanvas = 'stepNotesCanvas_'+index;
				
				// create array of elements that need to be animated
				var fadeElements = [];
				if ($chk($(noteContainer))){
					fadeElements.push($(noteContainer));
					$$($(noteContainer).getElementsByTagName('img')).each(
							function(item,index){fadeElements.push(item);});
				}
				if ($chk($(stepNoteCanvas))){
					var shape = $(stepNoteCanvas).getChildren('div>*')[0];
					if(shape)
					{
						fadeElements.push(shape);
					}
				}
				if($chk(note.hotspot) && $chk($(hs)))
				{
					fadeElements.push($(hs));
				}
				if ($chk(note.actionid)){
					if (engine.controller.currentStepObj.showActionNoteVisuals()){
						var actionContainer = note.actionid;
						if($chk($(actionContainer))){
							fadeElements.push($(actionContainer));
						}
					}
				}
				
				this.elementsFx = new Fx.Elements(fadeElements, {duration: 500});
				/* encapsulate styles within an array of style values
				{
					0: { 'margin-top': [0, 200 ]},
					1: { 'right': [10, window.getSize().x - 60 ]}
				}
				*/
				var effects = {};
				var style = {};
				style['opacity'] = [0,1];
				fadeElements.each(
					function(item,index){
						effects[index]=style;
					});
				this.elementsFx.start(effects)
				.chain(function(){
					self.onAnimationDone();
				});
			}
			else
			{
				this.onAnimationDone();
			}
		};

		this.animateFadeOutChain = function(note, noteContainer, hs)
		{
			var self = this;
			
			this.cancelAnimations();

			if(Conf.ENABLE_TRANSITIONS)
			{
				this.started = true;
				this.paused = false;
				
				var index = noteContainer.substring(noteContainer.length-1, noteContainer.length);
				var stepNoteCanvas = 'stepNotesCanvas_'+index;
				
				var fadeElements = [];
				if($chk(note.hotspot) && $chk($(hs)))
				{
					fadeElements.push($(hs));
				}
				if ($chk(note.actionid)){
					if (engine.controller.currentStepObj.showActionNoteVisuals()){
						var actionContainer = note.actionid;
						if($chk($(actionContainer))){
							fadeElements.push($(actionContainer));
						}
					}
				}
				if ($chk($(stepNoteCanvas))){
					var shape = $(stepNoteCanvas).getChildren('div>*')[0];
					if(shape)
					{
						fadeElements.push(shape);
					}
				}
				if($chk($(noteContainer))){
					fadeElements.push($(noteContainer));
					$$($(noteContainer).getElementsByTagName('img')).each(
							function(item,index){fadeElements.push(item);});
				}
				this.elementsFx = new Fx.Elements(fadeElements, {duration: 500});
				/* encapsulate styles within an array of style values
				{
					0: { 'margin-top': [0, 200 ]},
					1: { 'right': [10, window.getSize().x - 60 ]}
				}
				*/
				var effects = {};
				var style = {};
				style['opacity'] = [1,0];
				fadeElements.each(
					function(item,index){
						effects[index]=style;
					});
				this.elementsFx.start(effects)
				.chain(function(){
					self.onAnimationDone();
				});
			}
			else
			{
				this.onAnimationDone();
			}
		};

		this.onAnimationDone = function()
		{
			this.completed = true;
			this.started = false;
			this.paused = false;
			this.elementsFx = null;
			Utils.debug.trace('Note animation completed');
		};

		this.pause = function()
		{
			if(!this.paused && this.started && !this.completed)
			{
				this.paused = true;
				this.elementsFx.pause();
				
			}
		};

		this.resume = function()
		{
			if(this.paused && this.started && !this.completed)
			{
				this.paused = false;
				this.elementsFx.resume();
			}
		};

		this.cancelAnimations = function()
		{
			this.completed = false;
			this.started = false;
			this.paused = false;

			if($chk(this.elementsFx))
			{
				this.elementsFx.clearChain();
				this.elementsFx.cancel();
				this.elementsFx = null;
			}
		};

		this.toString = function()
		{
			return "Animator class instance";
		};
		
	};
})();
