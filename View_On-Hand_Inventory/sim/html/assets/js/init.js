
var engine;
var menuScroller;
var transcriptScroller;
var stepContentScroller;
var dialogContentScroller;
var keyMenuScroller;
(function($){
//Set window events after creating the engine
	var init = function()
	{
		// Create main instance of the engine
		engine = new Engine();

		Utils.browserDetection.init();
		Utils.debug.trace('Browser: ' + Utils.browserDetection.details);
		
		// Setup window events
		window.onresize = function()
		{
			engine.handleResize();
		};
		window.onbeforeunload = function(e)
		{
			var e = e || window.event;
			
			if (Conf.API_TYPE == 'AICC'){
				if (!engine.started) {
					return;
				} else {
					if (!engine.exiting){					
						if (e) {
							e.returnValue = Lang.AICC_CHECK_BEFORE_UNLOAD;
						}
						return Lang.AICC_CHECK_BEFORE_UNLOAD;
					}
				}
			}
			// Safari doesn't like calling method
			//engine.checkBeforeExit(e);
		};
		window.onunload = function()
		{
			engine.terminate();
			
			engine = null;
			menuScroller = null;
			transcriptScroller = null;
			stepContentScroller = null;
			dialogContentScroller = null;
			keyMenuScroller = null;
			Utils = null;
			Timeline = null;
			TimerControl = null;
		};
		window.onfocus = function()
		{
			try
			{
				EventHandler.clearModifiers();
			}
			catch(e){}
		};
		window.onblur = function()
		{
			try
			{
				EventHandler.clearModifiers();
			}
			catch(e){}
		};
		window.addEvent('help',function(e){ 
			e.stop(); 
		});
		window.addEvent('contextmenu',function(e){ 
			e.stop(); 
		});
		window.addEvent('selectstart',function(e){ 
			e.stop(); 
		});

		//IE hack for drag operations
		document.ondragstart = function(){return false;}; 
		
		if(Utils.browserDetection.isMobile())
		{
			document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);

			window.onorientationchange = function() {
			    engine.onOrientationChange();
			}
		}
		
		//Initialize the engine
		engine.initialize();
	};

    window.addEvent('load', function(){
        init();
    });

})(document.id);
