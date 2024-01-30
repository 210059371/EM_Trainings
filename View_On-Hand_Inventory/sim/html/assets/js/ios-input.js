
(function($){

	this.iOSInputHandler=function()
	{
		this.inputBarOpen = true;
		this.inputBarKeyMenuOpen = false;
		this.mouseBtnToggled = false;
		this.keyMenuOpen = false;
		this.keyMenuCreated = false;

		this.keyCharCodeMap=[
			//[keycode, charcode, name(string)]
			[9, "Tab"],
			[13, "Enter"],
			[27, "Escape"],
			[33, "Page Up"],
			[34, "Page Down"],
			[35, "End"],
			[36, "Home"],
			[112, "F1"],
			[113, "F2"],
			[114, "F3"],
			[115, "F4"],
			[116, "F5"],
			[117, "F6"],
			[118, "F7"],
			[119, "F8"],
			[120, "F9"],
			[121, "F10"],
			[122, "F11"],
			[123, "F12"],
			[65, "A"],
			[66, "B"],
			[67, "C"],
			[68, "D"],
			[69, "E"],
			[70, "F"],
			[71, "G"],
			[72, "H"],
			[73, "I"],
			[74, "J"],
			[75, "K"],
			[76, "L"],
			[77, "M"],
			[78, "N"],
			[79, "O"],
			[80, "P"],
			[81, "Q"],
			[82, "R"],
			[83, "S"],
			[84, "T"],
			[85, "U"],
			[86, "V"],
			[87, "W"],
			[88, "X"],
			[89, "Y"],
			[90, "Z"],
			[48, "0"],
			[49, "1"],
			[50, "2"],
			[51, "3"],
			[52, "4"],
			[53, "5"],
			[54, "6"],
			[55, "7"],
			[56, "8"],
			[57, "9"],
			[8, "Backspace"],
			[37, "Arrow Left"],
			[38, "Arrow Up"],
			[39, "Arrow Right"],
			[40, "Arrow Down"],
			[45, "Insert"],
			[46, "Delete"],
			[19, "Pause"],
			[20, "Caps Lock"],
			[91, "Left Windows"],
			[92, "Right Windows"],
			[93, "Context Menu"],
			[96, "NumPad 0"],
			[97, "NumPad 1"],
			[98, "NumPad 2"],
			[99, "NumPad 3"],
			[100, "NumPad 4"],
			[101, "NumPad 5"],
			[102, "NumPad 6"],
			[103, "NumPad 7"],
			[104, "NumPad 8"],
			[105, "NumPad 9"],
			[106, "NumPad *"],
			[107, "NumPad +"],
			[109, "NumPad -"],
			[110, "NumPad ."],
			[111, "NumPad /"],
			[144, "Num Lock"],
			[145, "Scroll Lock"],
			[186, ";"],
			[187, "="],
			[188, ","],
			[189, "-"],
			[190, "."],
			[191, "/"],
			[192, "`"],
			[219, "["],
			[220, "\\"],
			[221, "]"],
			[222, "'"]
		];

		this.initialize=function()
		{
			if(engine.mode == engine.MODES.AUTO_PLAYBACK.value){return;} // No input support in auto-playback mode

			$('inputBar').setStyle("display","block");
			$('inputBarToggleBtn').setStyle("display","block");

			if(engine.mode != engine.MODES.STANDARD.value)
			{
				$('inputBar').setStyle("bottom",0);
				$('inputBarToggleBtn').setStyle("bottom",-2);
			}

			var self = this;
			$('inputBarToggleBtn').addEvent('touchend',function(e){
				self.toggleInputBar();
				e.stop();
			});
			$('inputBarCtrl').addEvent('touchend',function(e){
				self.toggleModifier(e,'ctrl');
				e.stop();
			});
			$('inputBarAlt').addEvent('touchend',function(e){
				self.toggleModifier(e,'alt');
				e.stop();
			});
			$('inputBarShift').addEvent('touchend',function(e){
				self.toggleModifier(e,'shift');
				e.stop();
			});
			$('inputBarMouse').addEvent('touchend',function(e){
				self.toggleMouseBtn();
				e.stop();
			});
			$('inputBarKey').addEvent('touchend',function(e){
				self.toggleKeyMenu();
				e.stop();
			});
			$('inputBarHelp').addEvent('touchend',function(e){
				self.openHelp();
				e.stop();
			});
			$('inputCloseBtn').addEvent('click',function(e){
				self.closeHelp();
				e.stop();
			});
		};

		this.getInputBarHeight=function()
		{
			return $('inputBar').getStyle("height").toInt();
		};

		this.toggleInputBar=function()
		{
			if(this.inputBarOpen)
			{
				this.closeToggleInputBar();
			}
			else
			{
				this.openToggleInputBar();
			}
		};

		this.closeToggleInputBar=function()
		{
			this.inputBarOpen=false;
			this.inputBarFx = new Fx.Morph($('inputBar'),{
				link: 'ignore',
				duration: 700,
				onComplete: function(){
					$('inputBarToggleBtn').addClass('inputBarBtnOpen');
					$('inputBarToggleBtn').removeClass('inputBarBtnClose');
					engine.ui.updateLayout();
				}
			}).start({
				'opacity': 0,
				'right': -$('inputBar').getStyle('width').toInt()
			});
			this.closeKeyMenu();
		};

		this.openToggleInputBar=function()
		{
			this.inputBarOpen=true;
			this.inputBarFx = new Fx.Morph($('inputBar'),{
				link: 'ignore',
				duration: 700,
				onComplete: function(){
					$('inputBarToggleBtn').addClass('inputBarBtnClose');
					$('inputBarToggleBtn').removeClass('inputBarBtnOpen');
					engine.ui.updateLayout();
				}
			}).start({
				'opacity': 1,
				'right': 0
			});
		};

		this.toggleMouseBtn=function()
		{
			if(this.mouseBtnToggled)
			{
				this.mouseBtnLeft();
			}
			else
			{
				this.mouseBtnRight();
			}
		};

		this.mouseBtnLeft = function()
		{
			this.mouseBtnToggled = false;
			EventHandler.setMouseButton('left');
			$('inputBarMouse').removeClass('active');
			$('inputBarMouse').getChildren()[0].removeClass('active');
		};

		this.mouseBtnRight = function()
		{
			this.mouseBtnToggled = true;
			EventHandler.setMouseButton('right');
			$('inputBarMouse').addClass('active');
			$('inputBarMouse').getChildren()[0].addClass('active');
		};

		this.createKeyMenu=function()
		{
			var self = this;
			this.keyCharCodeMap.each(function(item,index)
			{
				var keyItem = new Element('div',{
					'html':item[1],
					'class':'keyMenuEntry',
					'events':{
						'click':function()
						{
							self.selectKey(this,this.key);
						}
					}
				});
				keyItem.key = item[0];
				$('keyMenuContent').adopt(keyItem);
			},this);

			keyMenuScroller = new iScroll('keyMenu');
			setTimeout(function(){keyMenuScroller.refresh();},0);

			this.keyMenuCreated = true;
		};

		this.selectKey=function(el,key)
		{
			var self = this;
			var origBgColor = el.getStyle('background-color');
			var origColor = el.getStyle('color');
			this.inputBarFx = new Fx.Morph(el,{
				link: 'ignore',
				duration: 1000,
				onComplete: function(){
					self.closeKeyMenu();
					engine.controller.currentStepObj.handleKeyDownEvent({realkeyCode:key});
				}
			}).start({
				'background-color':['#fff',origBgColor],
				'color':['#06c',origColor]
			});
		};

		this.toggleKeyMenu=function(e)
		{
			if(this.keyMenuOpen)
			{
				this.closeKeyMenu(e);
			}
			else
			{
				this.openKeyMenu(e);
			}
		};

		this.openKeyMenu=function(e)
		{
			this.keyMenuOpen=true;
			$('inputBarKey').addClass('active');
			$('inputBarKey').getChildren()[0].addClass('active');

			$('keyMenu').show();

			if(keyMenuScroller)
			{
				setTimeout(function(){keyMenuScroller.refresh();},0);
			}

			var self = this;
			this.keyMenuFx = new Fx.Morph($('keyMenu'),{
				link: 'ignore',
				duration: 250,
				onComplete: function(){
					if(!self.keyMenuCreated)
					{
						self.createKeyMenu();
						engine.ui.updateLayout();
					}
				}
			}).start({
				'opacity': 1,
				'top': 0
			});
		};

		this.closeKeyMenu=function(e)
		{
			this.keyMenuOpen=false;
			$('inputBarKey').removeClass('active');
			$('inputBarKey').getChildren()[0].removeClass('active');
			
			this.keyMenuFx = new Fx.Morph($('keyMenu'),{
				link: 'ignore',
				duration: 250,
				onComplete: function(){
					//$('keyMenu').hide();
				}
			}).start({
				'opacity': 0,
				'top': 50
			});
		};

		this.toggleModifier=function(e,key)
		{
			if(e.target.active)
			{
				e.target.active = false;
				e.target.removeClass('active');
				EventHandler.setModifier(key,false);
			}
			else
			{
				e.target.active = true;
				e.target.addClass('active');
				EventHandler.setModifier(key,true);
			}
		};

		this.openHelp=function()
		{
			$('inputBarHelpOverlay').show();
			$('inputCloseBtn').show();
		};

		this.closeHelp=function()
		{
			$('inputBarHelpOverlay').hide();
			$('inputCloseBtn').hide();
		};

		this.reset=function()
		{
			this.mouseBtnLeft();
			
			$('inputBarCtrl').active = false;
			$('inputBarCtrl').removeClass('active');
			EventHandler.setModifier('ctrl',false);

			$('inputBarAlt').active = false;
			$('inputBarAlt').removeClass('active');
			EventHandler.setModifier('alt',false);

			$('inputBarShift').active = false;
			$('inputBarShift').removeClass('active');
			EventHandler.setModifier('shift',false);

			this.closeKeyMenu();
		};

		this.updateLayout=function(h)
		{
			if ($('timelineBar')){
				var y = document.documentElement.clientHeight-$('timelineBar').getPosition().y;
				$('inputBar').setStyle('bottom',y);
				$('inputBarToggleBtn').setStyle('bottom',y-3);
			}
			var diff =  h-$('inputBar').getPosition().y;
			$('keyMenu').setStyle('height',h-diff);
		};
	};

})(document.id);
