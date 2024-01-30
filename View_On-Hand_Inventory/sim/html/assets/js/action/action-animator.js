
(function(){
	/**
	* Class used to create animations specific to the simulation UI
	* @constructor
	* @requires MooTools
	*/
	this.ActionAnimator = function()
	{
		this.actionFx = null;
		this.started = false;
		this.paused = false;
		this.completed = false;
		this.textField = null;
		this.text = '';
		this.textPos = 0;
		this.textTimerControl = new TimerControl(this);
		this.cursorController = new TimerControl(this);
		this.step = null;
		this.action = null;
		this.fxType = null; //cursor, text, composite
		this.entryCompletePadding = 3;
		this.entryInterval = 300;
		this.cursorCheckInterval = 100;

		this.animateStandardCursor = function(step,curImg,x,y,actionTarget,actionCursorSrc)
		{
			this.fxType = 'cursor';

			var self = this;

			//Monitor the cursor to see whether or not it enters
			//the action area, requiring a change.
			this.cursorController.start({
				interval:this.cursorCheckInterval,
				onIntervalCb:function(){
					this.onCursorInterval(curImg,actionTarget,actionCursorSrc);
				}
			});

			//Cursor animation
			if(this.actionFx){this.actionFx.cancel();}
			this.completed = false;
			this.started = true;
			this.paused = false;
			this.actionFx = new Fx.Morph(curImg,{duration:2000,transition:'quad:in:out'});
			this.actionFx.start({'top':y,'left':x})
			.chain(function(){
				self.onCursorDone(step);
			});
		};

		this.animateCursorChain = function(step,curImg,x1,y1,x2,y2,actionTarget1,actionTarget2,actionCursorSrc)
		{
			this.fxType = 'cursor';

			var self = this;
			
			//Monitor the cursor to see whether or not it enters
			//the action area, requiring a change.
			this.cursorController.start({
				interval:this.cursorCheckInterval,
				onIntervalCb:function(){
					this.onCursorInterval(curImg,actionTarget1,actionCursorSrc);
					this.onCursorInterval(curImg,actionTarget2,actionCursorSrc);
				}
			});
			
			if(this.cursorFx){this.cursorFx.cancel();}
			this.completed = false;
			this.started = true;
			this.paused = false;
			this.actionFx = new Fx.Morph(curImg,{duration:2000,transition:'quad:in:out'});
			this.actionFx.start({'top':y1,'left':x1})
			.chain(function(){
				self.actionFx.start({'top':y2,'left':x2})
			})
			.chain(function(){
				self.onCursorDone(step);
			});
		};

		this.animateTextEntry = function(step,textField,text)
		{
			this.fxType = 'text';
			this.textPos = 0;
			this.textField = textField;
			this.text = text;
			this.step = step;

			this.startTextEntryTimer();
		};

		this.startTextEntryTimer = function()
		{
			this.started = true;
			this.paused = false;
			this.completed = false;

			this.textTimerControl.start({
				interval:this.entryInterval,
				onIntervalCb:function(){
					this.onTextTimerInterval();
				}
			});
		};

		this.resumeTextEntry = function()
		{
			this.textTimerControl.resume();
		};

		this.pauseTextEntry = function()
		{
			this.paused = true;
			this.textTimerControl.pause();
		};

		this.onCursorInterval = function(curImg,actionTarget,actionCursorSrc)
		{
			if(Utils.dom.hitTest(curImg,actionTarget))
			{
				Utils.debug.trace('hit detected!');
				curImg.src = actionCursorSrc;
				this.cursorController.stop();
			}
		};

		this.onTextTimerInterval = function()
		{
			this.textPos++;
			var str = this.text.substring(0,this.textPos);
			
			if(Conf.USE_TYPING_SOUND)
			{
				if(!engine.controller.isMuted && (this.textPos <= this.text.length))
				{
					engine.actionAudio.play('edit');
				}
			}

			this.textField.set('text',str);
			if(this.textPos >= (this.text.length+this.entryCompletePadding)) // Added padding for time
			{
				this.textTimerControl.stop();
				this.textTimerControl.reset();
				this.onTextEntryCompleted();
			}
		};

		this.onTextEntryCompleted = function()
		{
			this.fxType = null;
			this.completed = true;
			this.started = false;
			this.paused = false;
			this.textField = null;
			this.text = null;
			this.textTimerControl.reset();
			this.cursorController.reset();
			this.step.onCursorDone();
			this.step = null;
		};

		this.onCursorDone = function(step)
		{
			this.fxType = null;
			this.completed = true;
			this.started = false;
			this.paused = false;
			this.actionFx = null;
			this.step = null;
			this.textTimerControl.reset();
			this.cursorController.reset();
			step.onCursorDone();
		};

		this.animateCompositeChain = function(step)
		{
			this.fxType = 'composite';

			var self = this;
			
			this.cancelAnimations();

			if(Conf.ENABLE_TRANSITIONS)
			{
				this.started = true;
				this.paused = false;
				this.actionFx = new Fx.Tween($('stepActionComposite'),{duration: 1500});
				this.actionFx.start('opacity', 0, 0.75)
				.chain(function(){
					self.actionFx.start('opacity', 0.75, 0);
				})
				.chain(function(){
					self.onCompositeDone(step);
				});
			}
			else
			{
				this.onCompositeDone(step);
			}
		};

		this.onCompositeDone = function(step)
		{
			$("stepActionComposite").empty();
			this.fxType = null;
			this.completed = true;
			this.started = false;
			this.paused = false;
			this.actionFx = null;
			Utils.debug.trace('Composite animation completed');
			step.onCompositeDone();
		};

		this.pause = function()
		{
			if(!this.paused && this.started && !this.completed)
			{
				this.paused = true;
				switch(this.fxType)
				{
					case 'cursor':
						this.actionFx.pause();
						this.cursorController.pause();
						break;
					case 'composite':
						this.actionFx.pause();
						break;
					case 'text':
						this.pauseTextEntry();
				}
			}
		};

		this.resume = function()
		{
			if(this.paused && this.started && !this.completed)
			{
				this.paused = false;
				switch(this.fxType)
				{
					case 'cursor':
						this.actionFx.resume();
						this.cursorController.resume();
						break;
					case 'composite':
						this.actionFx.resume();
						break;
					case 'text':
						this.resumeTextEntry();
				}
			}
		};

		this.cancelAnimations = function()
		{
			this.fxType = null;
			this.completed = false;
			this.started = false;
			this.paused = false;

			this.cursorController.stop();
			this.cursorController.reset();

			this.textTimerControl.stop();
			this.textTimerControl.reset();

			if($chk(this.actionFx) && $chk(this.actionFx.cancel))
			{
				this.actionFx.clearChain();
				this.actionFx.cancel();
				this.actionFx = null;
			}
		};

		this.toString = function()
		{
			return "Animator class instance";
		};
	};
})();
