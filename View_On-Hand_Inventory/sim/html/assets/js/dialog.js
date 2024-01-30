
(function()
{
	/**
	* Class used to create dialog windows
	* @constructor
	* @requires MooTools
	*/
	this.Dialog = function()
	{
		this.label='';
		this.txt='';
		this.onCancel=null;
		this.onOk=null;
		this.onFinalize=null;
		this.onRestart=null;
		this.active=false;
		this.scope = null;

		this.createContent=function(o)
		{
			if(this.active){this.kill();}
			
			for(var prop in o)
			{
				this[prop] = o[prop];
			}

			this.scope = o.scope;
			this.txt=o.txt;
			this.label=o.label || '';

			$('dialogHeaderLabel').set('text',this.label);

			var dlgContent = new Element('div',{
					'class':'dialogContent',
					'id':'dialogContent',
					'html':this.txt
				});
			$('dialogContentContainer').adopt(dlgContent);

			if(Utils.browserDetection.isMobile())
			{
				dialogContentScroller = new iScroll('dialogContent');
				setTimeout(function(){dialogContentScroller.refresh();},0);
			}
		};

		this.confirm=function(o)
		{
			this.createContent(o);
			var self = this;

			$('dialogHeaderBtn').show();

			var btnCancel = new Element('div',{
					'class':'uiSecondaryBackgroundColor uiTextColor dialogButton',
					'html':Lang.NO,
					'title':Lang.NO,
					'tabindex':0,
					'events': {
						'click': function(){
							self.cancel();
							return false;
						},
						'keydown': function(e){
							if(e.code == 13)
							{
								self.cancel();
								e.stop();
							}
						}
					}
				});

			var btnOkay = new Element('div',{
					'class':'uiSecondaryBackgroundColor uiTextColor dialogButton',
					'html':Lang.YES,
					'title':Lang.YES,
					'tabindex':0,
					'events': {
						'click': function(){
							self.ok();
							return false;
						},
						'keydown': function(e){
							if(e.code == 13)
							{
								self.ok();
								e.stop();
							}
						}
					}
				});

			$('dialogContentContainer').adopt(btnCancel);
			$('dialogContentContainer').adopt(btnOkay);

			this.createBackground();
			this.show();

			btnOkay.focus();

			btnCancel.focus();
		};

		this.alert=function(o)
		{
			this.createContent(o);
			var self = this;

			$('dialogHeaderBtn').show();

			var btnCancel = new Element('div',{
					'class':'dialogButton',
					'html':Lang.UI_CLOSE,
					'tabindex':0,
					'events': {
						'click': function(){
							self.cancel();
							return false;
						},
						'keydown': function(e){
							if(e.code == 13)
							{
								self.cancel();
								e.stop();
							}
						}
					}
				});

			$('dialogContentContainer').adopt(btnCancel);
			
			this.createBackground();
			this.show();
			btnCancel.focus();
		};

		this.end=function(o)
		{
			this.createContent(o);
			var self = this;

			$('dialogHeaderBtn').hide();

			var btnFinalize = new Element('div',{
					'class':'uiSecondaryBackgroundColor uiTextColor dialogButton',
					'html':o.finalizeLabel,
					'tabindex':0,
					'events': {
						'click': function(){
							self.finalize();
							return false;
						},
						'keydown': function(e){
							if(e.code == 13)
							{
								self.finalize();
								e.stop();
							}
						}
					}
				});

			var btnRestart = new Element('div',{
					'class':'uiSecondaryBackgroundColor uiTextColor dialogButton',
					'html':Lang.SIM_RESTART,
					'tabindex':0,
					'events': {
						'click': function(){
							self.restart();
							return false;
						},
						'keydown': function(e){
							if(e.code == 13)
							{
								self.restart();
								e.stop();
							}
						}
					}
				});

			$('dialogContentContainer').adopt(btnFinalize);
			$('dialogContentContainer').adopt(btnRestart);

			this.createBackground();
			this.show();

			btnFinalize.focus();
		};

		this.createBackground=function()
		{
			if($chk($('dialogBackground')))
			{
				$('dialogBackground').show();
			}
			else
			{
				var dialogBackground = new Element('div',{
						'id':'dialogBackground'
					});
				$('container').adopt(dialogBackground);
			}
		};

		this.show=function()
		{
			this.active=true;

			$('dialog').show();
			$('dialog').fade('in');
			
			var o = {
				onStart:function()
				{
					$("dialog").setOpacity(.5);
				},
				onComplete:function()
				{
					$("dialog").setOpacity(1);
				},
				handle:$('dialogHeader')
			};
			this.menuDrag = new Drag('dialog',o).attach();

			engine.ui.updateLayout();
		};

		this.ok=function()
		{
			this.onOk.apply(this.scope);
			this.kill(true);
		};

		this.cancel=function()
		{
			this.onCancel.apply(this.scope);
			this.kill(true);
		};

		this.finalize=function()
		{
			this.onFinalize.apply(this.scope);
			this.kill(false);
		};

		this.restart=function()
		{
			this.onRestart.apply(this.scope);
			this.kill(true);
		};

		this.kill=function(hideBackground)
		{
			if(!this.active){return;}

			this.txt='';
			this.onCancel=null;
			this.onOk=null;
			this.onFinalize=null;
			this.onRestart=null;
			this.active=false;

			$("dialogContentContainer").empty();
			$('dialog').hide();

			if(hideBackground)
			{
				$("dialogBackground").hide();
			}
		};

		this.updateLayout=function(viewWidth,viewHeight)
		{
			if(this.active)
			{
				var l = (viewWidth-$("dialog").offsetWidth)/2;
				var t = (viewHeight-$("dialog").offsetHeight)/2;
				var t = (t < 0) ? 0 : t;
				var l = (l < 0) ? 0 : l;

				$("dialog").setStyle('top',t);
				$("dialog").setStyle('left',l);


				var func=function(w,h)
				{
					$("dialogBackground").setStyle('width',w);
					$("dialogBackground").setStyle('height',h);
				};

				if(Utils.browserDetection.isMobile())
				{
					setTimeout(function(){func(viewWidth,viewHeight)},100);
				}
				else
				{
					func(viewWidth,viewHeight);
				}
			}
		};

		this.toString = function()
		{
			return 'Dialog instance';
		}
	};
})();