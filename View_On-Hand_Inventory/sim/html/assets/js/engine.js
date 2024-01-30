/** 
* Defines the main content engine object
* @class Engine
* @requires Controller
* @requires CommFactory
* @requires UIControl
* @requires Audio
* @requires Utils
* @requires MooTools
* @constructor
*/
function Engine()
{
	//Engine members
	this.rootPath = Utils.window.getRootFolder();
	this.imagePath = Utils.window.getRootFolder()+"/content/images/";
	this.audioPath = Utils.window.getRootFolder()+"/content/audio/";
	this.skinPath = Utils.window.getRootFolder()+"/skin/";
	this.noteIconPath = Utils.window.getRootFolder()+"/content/note-icons/";
	this.flashPluginVer = [Conf.FLASH_MAJOR_VERSION, Conf.FLASH_MINOR_VERSION, Conf.FLASH_REVISION].join(".");
	this.root = null;
	this.simTitle = '';
	this.searchparams = null;
	this.mode = window.mode;
	this.modeObj = null;
	this.uPerformIndexPage = null;
	this.isUperformAPI = false;
	this.embedded = false;
	this.enableExit = false;
	this.exitLabel = null;
	this.comm = null;
	this.iosInputHandler = null;
	this.exiting = false;
	this.started = false;
	this.hasAudio = false;
	this.hasFlashAudio = false;
	this.ready = false;
	this.loading = true;
	this.toolTips = new Tips();
	this.bypassOnReadyChecks = false;
	this.scrollAdjuster = null;

	//Mode constants
	this.MODES = {
		AUTO_PLAYBACK:{value:0, name:Lang.MODENAME_AUTO, endMsg:Lang.ENDMESSAGE_AUTO},
		STANDARD:{value:1, name:Lang.MODENAME_STANDARD, endMsg:Lang.ENDMESSAGE_STANDARD},
		SELF_TEST:{value:2, name:Lang.MODENAME_SELFTEST, endMsg:Lang.ENDMESSAGE_SELFTEST},
		ASSESSMENT:{value:3, name:Lang.MODENAME_ASSESSMENT, endMsg:Lang.ENDMESSAGE_ASSESSMENT}
	};

	//Other constants
	this.SPACER = this.rootPath+"/assets/img/spacer.gif";
	
	/**
	 * Initializes the engine
	 * @method initialize
	 */
	this.initialize = function()
	{
		Utils.debug.trace('[ Begin Engine Initialize ]');

		this.modeObj = this.getMode();
		Utils.debug.trace('Simulation Mode: '+this.modeObj.name);

		// Cache the search params
		this.searchparams = Utils.window.getSearchParams();
		
		//Checks for index page
		try
		{
			if(window.opener)
			{
				if($chk(window.opener.uPerformIndexPage))
				{
					this.uPerformIndexPage = window.opener.uPerformIndexPage;
					window.opener.Utils.debug = Utils.debug;
					window.opener.engine = this;

					Utils.debug.trace('Launched from uPerform index page');

					if($chk(this.uPerformIndexPage.comm))
					{
						Utils.debug.trace('Comm object exists in uPerform index page','comm');
						if(this.uPerformIndexPage.comm.initOnIndexPage)
						{
							Utils.debug.trace('Comm object initialized in index page, using existing Comm object','comm');
							this.comm = this.uPerformIndexPage.comm;
						}
					}
				}
			}
		}
		catch(e)
		{
			Utils.debug.trace('Error checking for uPerform index page: '+e.description || e,'error');
		}

		if(this.searchparams)
		{
			this.embedded = (this.searchparams['embedded'] == "true") ? true : false;
			this.enableExit = (this.searchparams['enabled'] == "true") ? true : false;
			this.exitLabel = this.searchparams['exitlabel'];
			Conf.API_TYPE = (this.embedded) ? "COOKIE" : Conf.API_TYPE;
			this.primaryCsh = this.searchparams['primarycsh'];
			this.application = this.searchparams['application'];
			if(this.embedded)
			{
				Utils.debug.trace('Simulation is embedded - Forcing API_TYPE to "COOKIE"','comm');
			}
		}

		// check if mode level cookie or single cookie
		var commName = "";
		if (Conf.BOOKMARK_ENABLED){
			if (Conf.BOOKMARK_MODES.length == 0){
				commName = Conf.CONTENT_ID;
			} else if (Conf.BOOKMARK_MODES.contains(engine.MODES.AUTO_PLAYBACK.value) && engine.mode == engine.MODES.AUTO_PLAYBACK.value){
				commName = engine.MODES.AUTO_PLAYBACK.value + "_" + Conf.CONTENT_ID;
			} else if (Conf.BOOKMARK_MODES.contains(engine.MODES.STANDARD.value) && engine.mode == engine.MODES.STANDARD.value){
				commName = engine.MODES.STANDARD.value + "_" + Conf.CONTENT_ID;
			}
		} 
		if (Conf.BOOKMARK_ENABLED && Conf.API_TYPE == "COOKIE"){
			this.comm = CommFactory(Conf.API_TYPE,commName); 
			this.comm.initOnIndexPage = false;
		} else {
			this.comm = this.comm || CommFactory(Conf.API_TYPE,Conf.CONTENT_ID);
		}

		if($chk(this.comm.API))
		{
			this.isUperformAPI = ($chk(this.comm.API.uPerformAPI)) ? true : false;
			if (this.isUperformAPI) {
				engine.comm.setSimMode(engine.mode, this.isUperformAPI);
			}
		}

		//Components of the engine are created here
		this.controller = new Controller();
		this.ui = new UIControl();
		this.animator = new ActionAnimator();
		this.dialog = new Dialog();

		if(engine.mode == engine.MODES.AUTO_PLAYBACK.value && Conf.USE_TYPING_SOUND)
		{
			this.actionAudio = new ActionAudio();
			// Initialize the action audio object
			this.actionAudio.initialize();
		}
		
		// Build the sim structure from within "conf/structure.js"
		initStructure();

		if(engine.mode == engine.MODES.STANDARD.value || engine.mode == engine.MODES.AUTO_PLAYBACK.value)
		{
			this.audio = new AudioObject();
			
			// Check for the existence of audio prior to initializing the audio object.
			this.hasAudio = this.controller.hasAudio();
			this.hasFlashAudio = this.controller.hasFlashAudio();

			if(this.hasAudio)
			{
				Utils.debug.trace('Simulation has audio');

				/*
				Force to Flash if:
				 - The audio_type is not "FLASH" already
				 - Browser can possibly support Flash Player (This isn't an iOS device)
				 - The sim has Flash-based audio
				*/
				if((Conf.AUDIO_TYPE.toLowerCase() != "flash") && !Utils.browserDetection.isMobile() && this.hasFlashAudio)
				{
					Conf.AUDIO_TYPE = "FLASH";
				}

				if(Utils.browserDetection.isMobile())
				{
					Conf.AUDIO_TYPE = "HTML5";
					if(this.hasFlashAudio)
					{
						Utils.flash.showWarningIOS();
					}
				}

				// Initialize the audio object
				var audioInitialized = this.audio.initialize();

				// Something went wrong initializing the audio object, disable it completely
				if(!audioInitialized)
				{
					Conf.AUDIO_TYPE = null;
					this.audio.initialize();
				}
			}
			else
			{
				Utils.debug.trace('Simulation does not have audio');
				Conf.AUDIO_TYPE = null;
				this.audio.initialize();
			}
			this.scrollAdjuster = new Fx.Scroll($("menuContent"));
		}

		// Initialize the UI object before comm or controller classes, but after structure initializes
		this.ui.initialize();
		
		// Initialize other classes...
		try
		{
			if(window.opener)
			{
				if(this.uPerformIndexPage && this.comm.initOnIndexPage)
				{
					var commInitialized = this.uPerformIndexPage.initialized;
				}
				else
				{
					var commInitialized = this.comm.initialize();
				}
			}
			else
			{
				var commInitialized = this.comm.initialize();
			}
		}
		catch(e)
		{
			//this.preloadAssets();
			Utils.debug.trace('Error attempting to initialize comm object: '+e.description || e,'error');
		}

		// Has the Comm object successfully initialized?
		if(commInitialized)
		{
			Utils.debug.trace('Comm object initialized.');
			this.started = true;
			if(this.comm.autoRun)
			{
				this.preloadAssets();
			}
		}
		else
		{
			Utils.debug.trace('ERROR: Cannot initialize Comm object','error');
			this.preloadAssets();
		}

		if(!Utils.browserDetection.isMobile())
		{
			this.checkForZoom();
		}
		
		Utils.debug.trace('[ End Engine Initialize ]');
	};

	this.getMode = function()
	{
		var modeObj = this.MODES.AUTO_PLAYBACK;
		$each(this.MODES,function(item,index){
			if(item.value == this.mode)
			{
				modeObj = item;
			}
		});
		return modeObj;
	};

	this.preloadAssets = function()
	{
		Utils.debug.trace("Preloading Assets...");
		var self = this;
		var allImages = [];
		var noteImageIcons = [
				this.noteIconPath+"noteicon_1.png",
				this.noteIconPath+"noteicon_2.png",
				this.noteIconPath+"noteicon_3.png",
				this.noteIconPath+"noteicon_4.png",
				this.noteIconPath+"noteicon_5.png",
				this.noteIconPath+"noteicon_6.png",
				this.noteIconPath+"noteicon_7.png",
				this.SPACER
			];
		allImages.extend(noteImageIcons);
		var steps = this.controller.steps;

		steps.each(function(item, index){
			var imgs = item.getImages();
			allImages.extend(imgs);
			//Utils.debug.trace(imgs.join("<br>"));
		});
		
		var loader = new Asset.images(allImages, { 
			onProgress: function(counter,index){ 
				$("loadingProgress").innerHTML = parseInt((counter) * (100 / allImages.length))+" % ("+(counter)+"/"+allImages.length+")"; 
			},
			onError: function(counter,index){
				Utils.debug.trace("Error Loading Image: "+allImages[index]);
			},
			onComplete: function(){ 
				self.loading = false;
				self.run();
				allImages = null;
				loader = null;
			}
		});
	};

	this.preloadActionAudio=function()
	{
		Utils.debug.trace('Preloading ActionAudio files');
		var o = {edit:'typing.mp3',key:null,mouse:null};
		if(o.edit)
		{
			Utils.debug.trace('Edit action audio file: '+this.audioPath + o.edit);
			this.actionAudio.load(this.audioPath + o.edit,'edit');
		}
		if(o.key)
		{
			this.actionAudio.load(this.audioPath + o.key,'key');
		}
		if(o.mouse)
		{
			this.actionAudio.load(this.audioPath + o.mouse,'mouse');
		}
	};
	
	/**
	 * Initializes the controller to begin the sim
	 * @method run
	 */
	this.run = function()
	{
		Utils.debug.trace('[ Running Engine... ]');

		if(!this.hasAudio || Conf.AUDIO_TYPE == null)
		{
			this.onReady();
		}
		else
		{
			if(Conf.AUDIO_TYPE == 'HTML5')
			{
				this.onReady();
			}
			else
			{
				if(Conf.AUDIO_TYPE == 'FLASH')
				{
					if(document.location.protocol.indexOf('file') > -1)
					{
						var func=function()
						{					
							engine.handleFlashSecurityTimeout();
						};
						setTimeout(function(){func();},3000);
					}
					if(this.audio.ready)
					{
						this.onReady();
					}
				}
			}
		}
	};

	/**
	 * Fired by the "run" method or from the Audio object's onReady event,
	 * depending on whether or not the simulation has audio
	 * @method onReady
	 */
	this.onReady = function()
	{

		if(engine.mode == engine.MODES.STANDARD.value || engine.mode == engine.MODES.AUTO_PLAYBACK.value)
		{
			if (!this.bypassOnReadyChecks)
			{
				if(this.loading || this.ready || !this.comm.ready || !this.audio.ready){return;}
			}
		}
		else
		{
			if(this.loading || this.ready || !this.comm.ready){return;}
		}		

		this.ready = true;
		this.controller.initialize();
		window.focus(document);
	};

	this.handleFlashSecurityTimeout = function()
	{
		if(this.ready){return;}
		this.bypassOnReadyChecks = true;	
		Utils.debug.trace('The 3 second timeout threshold has been reached waiting for Flash to respond. Please check Flash Player Global Security Settings','error');
		this.onReady();
	};
	
	/**
	 * Fires when the content frame has finished loading a step
	 * @method contentLoaded
	 */
	this.contentLoaded = function()
	{
		Utils.debug.trace('Content loaded');

		if(engine.mode == engine.MODES.STANDARD.value || engine.mode == engine.MODES.AUTO_PLAYBACK.value)
		{
			engine.controller.checkNavState();
		}
		else
		{
			engine.controller.enableNav();
		}

		engine.ui.contentLoaded();
	};
	
	/**
	 * Terminates the engine
	 * @method terminate
	 */
	this.terminate = function()
	{
		if(!this.exiting)
		{
			Utils.debug.terminate();
			if (this.started){
				this.comm.terminate();
			}
		}
		
		try
		{
			if(window.opener && !window.opener.closed)
			{
				try
				{
					if($chk(this.uPerformIndexPage) && window.opener.opener && !window.opener.opener.closed)
					{
						window.opener.close();
					}
				}
				catch(e){}
			}

			if(this.exiting)
			{
				var func=function()
				{
					return Utils.window.close();
				};

				// Wait a second, the LMS might try to close the window itself...
				setTimeout(func,1000);
			}
		}
		catch(e){}

		// cleanup
		try
		{
			this.controller.cleanup();
			this.ui.cleanup();
			this.tooltips = null;
			this.controller = null;
			this.ui = null;
			this.animator = null;
			this.dialog = null;
		}
		catch(e){}
	};

	this.exit = function()
	{
		Utils.debug.terminate();

		this.exiting = true;
		this.comm.terminate();
		this.terminate();
	};
	
	/**
	 * Handles the resize event and update the layout
	 * @method handleResize
	 */
	this.handleResize = function()
	{
		try
		{
			engine.ui.handleResize();
		}
		catch(e)
		{
			Utils.debug.trace("ERROR: handleResize"+ e.description || e, "error");
		}
	};
	
	/**
	 * Opens the Help window
	 * @method openHelp
	 */
	this.openHelp = function()
	{
		Utils.window.open(Conf.HELP_URL);
	};
	
	/**
	 * Opens the Resources window
	 * @method openResources
	 */
	this.openResources = function()
	{
		Utils.window.open(Conf.RESOURCES_URL);
	};
	
	/**
	 * Opens the Glossary window
	 * @method openGlossary
	 */
	this.openGlossary = function()
	{
		Utils.window.open(Conf.GLOSSARY_URL);
	};

	this.checkForZoom = function()
	{
		if(document.body.getBoundingClientRect)
		{
			var rect = document.body.getBoundingClientRect();
			var clientWidth = rect.right - rect.left;
		}
		else
		{
			return;
		}

		var func=function()
		{
			if(engine.zoomLevel != clientWidth)
			{
				engine.zoomLevel = clientWidth;
				Utils.debug.trace('clientWidth changed ('+clientWidth+') - handling resize...');
				engine.handleResize();
			}
		}();

		setTimeout(function(){engine.checkForZoom();},1000);
	};

	this.onOrientationChange = function()
	{
		switch(window.orientation)
	    {
	    	case 0: // "right-side-up" portrait
	    		Utils.debug.trace("Orientation changed: right-side-up portrait");
	    		break;

	    	case 90: // "right-handed" landscape
	    		Utils.debug.trace("Orientation changed: right-handed landscape");
	    		break;

	    	case 180: // "upside-down" portrait
	    		Utils.debug.trace("Orientation changed: upside-down portrait");
	    		break;

	    	case -90: // "left-handed" landscape
	    		Utils.debug.trace("Orientation changed: left-handed landscape");
	    		break;
	    }
	    //this.ui.updateLayout();
	};

	this.toString = function()
	{
		return "engine Class instance"
	};
}
