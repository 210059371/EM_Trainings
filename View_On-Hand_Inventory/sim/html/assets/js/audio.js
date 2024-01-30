/**
* Class defining the audio layer used by the engine
* @type {Object}
* @requires Engine
*/
var AudioObject = function()
{
	this.obj = null;
	this.isPlaying = false;
	this.initialized = false;
	this.useTimeout = false;
	this.ready = false;

	/**
	* Initialize the audio control layer
	* @method initialize
	*/
	this.initialize=function()
	{
		// AUDIO_TYPE is declared in the settings
		switch(Conf.AUDIO_TYPE)
		{
			case "FLASH":
				try
				{
					this.obj = this.createFlashAudioObject();
					if(this.obj)
					{
						this.useTimeout = true;
						this.initialized = true;
						Utils.debug.trace('Audio object initialized (Flash)');
						return true;
					}
					else
					{
						Utils.debug.trace('Error: Audio object cannot initialize (Flash)','error');
						return false;
					}
				}
				catch(e)
				{
					Utils.debug.trace('Error: An error has occurred while attempting to create Flash audio object: '+(e.description || e),'error');
					return false;
				}
				
				break;

			case "HTML5":
				try
				{
					this.obj = this.createHtml5AudioObject();
					if(this.obj)
					{
						this.useTimeout = false;
						this.initialized = true;
						this.ready = true;
						Utils.debug.trace('Audio object initialized (HTML5)');
						return true;
					}
					else
					{
						Utils.debug.trace('Error: Audio object cannot initialize (HTML5)','error');
						Utils.debug.trace('Audio Object: Browser does not support HTML5 audio, or does not support playback of MP3 files. Attempting to fall back to Flash...','error');
						Conf.AUDIO_TYPE = "FLASH";
						return this.initialize();
					}
				}
				catch(e)
				{
					Utils.debug.trace('Error: An error has occurred while attempting to create HTML5 audio object: '+(e.description || e),'error');
					return false;
				}
				
				break;
			
			case "CUSTOM":
				try
				{
					this.obj = this.createCustomAudioObject();
					if(this.obj)
					{
						this.initialized = true;
						Utils.debug.trace('Audio object initialized (Custom)');
						return true;
					}
					else
					{
						Utils.debug.trace('Error: Audio object cannot initialize (Custom)','error');
						return false;
					}
				}
				catch(e)
				{
					Utils.debug.trace('Error: An error has occurred while attempting to create custom audio object: '+(e.description || e),'error');
					return false;
				}

				break;
				
			case null:
				engine.controller.hideAudioControls();
				try
				{
					this.initialized = true;
					this.obj = this.createNullAudioObject();
					this.ready = true;
					Utils.debug.trace('Audio object initialized (null - no course audio)');
					return true;
				}
				catch(e)
				{
					Utils.debug.trace('Error: An error has occurred while attempting to create null audio object: '+(e.description || e),'error');
					return false;
				}

				break;
			
			default:
				Utils.debug.trace('Error: No known audio type used. Received: '+Conf.AUDIO_TYPE, 'error');
				engine.controller.hideAudioControls();
				try
				{
					this.initialized = true;
					this.obj = this.createNullAudioObject();
					this.ready = true;
					Utils.debug.trace('Audio object initialized (null - no course audio)');
					return true;
				}
				catch(e)
				{
					Utils.debug.trace('Error: An error has occurred while attempting to create null audio object: '+(e.description || e),'error');
					return false;
				}

				break;
		}
	};

	/**
	* Creates a flash object and loads the generic audio SWF to play audio
	* @method createFlashAudioObject
	*/
	this.createFlashAudioObject=function()
	{
		var hasRequiredFlashVer = Utils.flash.hasRequiredVer();
		var installedFlashVer = Utils.flash.getInstalledVer();
		Utils.debug.trace('Audio: Has required Flash Player Installed: '+hasRequiredFlashVer+' ('+installedFlashVer+')');

		if(hasRequiredFlashVer)
		{
			var flashvars = {};
			var params = {
				menu: "false",
				swliveconnect: "true",
				allowScriptAccess: "always"
			};
			var attributes = {
				id: "flashAudioObj",
				name: "flashAudioObj"
			};
			
			swfobject.embedSWF("assets/swf/audio.swf", "audioContainer", "1", "1",  engine.flashPluginVer, "assets/swf/expressinstall.swf", flashvars, params, attributes);
			return Utils.dom.getFlashObject("flashAudioObj");
		}
		else
		{
			Utils.flash.showWarning();
			return null;
		}
	};

	/**
	* Creates a HTML5 object
	* @method createHtml5AudioObject
	*/
	this.createHtml5AudioObject=function()
	{
		var html5AudioObj = new AudioObjectHtml5(this);
		var initialized = html5AudioObj.initialize();
		
		if(initialized)
		{
			return html5AudioObj;
		}
		else
		{
			return null;
		}
	};

	/**
	* Creates an instance of a custom audio handler
	* @method createCustomAudioObject
	*/
	this.createCustomAudioObject=function()
	{
		//var customObj = ...
		//return customObj;
	};
	
	/**
	* Creates an instance of a null audio handler (no audio)
	* @method createCustomAudioObject
	*/
	this.createNullAudioObject=function()
	{
		var nullObj = {};
		nullObj.loadAudio = function(){};
		nullObj.removeAudio = function(){};
		nullObj.playAudio = function(){};
		nullObj.pauseAudio = function(){};
		nullObj.stopAudio = function(){};
		nullObj.resetAudio = function(){};
		return nullObj;
	};

	/**
	* Creates an instance of a custom audio handler
	* @method load
	* @param {String} file The filename of the audio file to load into the audio object
	*/
	this.load=function(file)
	{
		if(!this.initialized){return;}
		var self = this;
		var func = function()
		{
			try
			{
				$('audioLoading').show();
				self.obj.loadAudio(file,Conf.STREAM_AUDIO);
			}
			catch (e)
			{
				Utils.debug.trace('Audio Error occurred calling loadAudio: '+(e.description || e),'error');
			}
		}
		
		if(this.useTimeout)
		{
			setTimeout(func,100);
		}
		else
		{
			func();
		}
	};

	/**
	* Sends a command to the audio object to remove the current audio
	* @method remove
	*/
	this.remove=function()
	{
		if(!this.initialized){return;}
		var self = this;
		this.isPlaying = false;
		var self = this;
		var func = function()
		{
			try
			{
				self.obj.removeAudio();
			}
			catch (e)
			{
				Utils.debug.trace('Audio Error occurred calling removeAudio: '+(e.description || e),'error');
			}
		}
		
		if(this.useTimeout)
		{
			setTimeout(func,100);
		}
		else
		{
			func();
		}
	};

	/**
	* Sends a command to the audio object to play the current audio
	* @method play
	*/
	this.play=function()
	{
		if(!this.initialized){return;}
		var self = this;
		var func = function()
		{
			try
			{
				self.obj.playAudio();
			}
			catch (e)
			{
				Utils.debug.trace('Audio Error occurred calling playAudio: '+(e.description || e),'error');
			}
		}
			
		if(this.useTimeout)
		{	
			setTimeout(func,100);
		}
		else
		{
			this.obj.playAudio();
		}
	};

	/**
	* Sends a command to the audio object to pause the current audio
	* @method pause
	*/
	this.pause=function()
	{
		var self = this;
		var func = function()
		{
			try
			{
				self.obj.pauseAudio();
			}
			catch (e)
			{
				Utils.debug.trace('Audio Error occurred calling pauseAudio: '+(e.description || e),'error');
			}
		}

		if(this.useTimeout)
		{
			setTimeout(func,100);
		}
		else
		{
			this.obj.pauseAudio();
		}
	};

	/**
	* Sends a command to the audio object to stop the current audio
	* @method stop
	*/
	this.stop=function()
	{
		if(!this.initialized){return;}
		this.isPlaying = false;
		var self = this;
		var func = function()
		{
			try
			{
				self.obj.stopAudio();
			}
			catch (e)
			{
				Utils.debug.trace('Audio Error occurred calling stopAudio: '+(e.description || e),'error');
			}
		}
		if(this.useTimeout)
		{
			setTimeout(func,100);
		}
		else
		{
			func();
		}
	};

	/**
	* Sends a command to the audio object to reset the current audio object, if necessary
	* @method reset
	*/
	this.reset=function()
	{
		if(!this.initialized){return;}
		this.isPlaying = false;
		var self = this;
		var func = function()
		{
			try
			{
				self.obj.resetAudio();
			}
			catch (e)
			{
				Utils.debug.trace('Audio Error occurred calling resetAudio: '+(e.description || e),'error');
			}
		}
		if(this.useTimeout)
		{
			setTimeout(func,100);
		}
		else
		{
			func();
		}
	};

	/**
	* Handles the audio start event issued by the audio object and passes the event to the controller
	* @method onAudioStart
	*/
	this.onAudioStart=function()
	{
		if(!this.initialized){return;}
		Utils.debug.trace('Audio playback has started...');
		engine.controller.onAudioStart();
		this.isPlaying = true;
	};

	/**
	* Handles the audio pause event issued by the audio object and passes the event to the controller
	* @method onAudioPause
	*/
	this.onAudioPause=function()
	{
		if(!this.initialized){return;}
		this.isPlaying = false;
		Utils.debug.trace('Audio playback has been paused');
	};

	/**
	* Handles the audio stop event issued by the audio object and passes the event to the controller
	* @method onAudioStop
	*/
	this.onAudioStop=function()
	{
		if(!this.initialized){return;}
		this.isPlaying = false;
		Utils.debug.trace('Audio playback has been stopped');
	};

	/**
	* Handles the audio load event issued by the audio object, hiding the loading graphic
	* @method onAudioLoad
	*/
	this.onAudioLoad=function()
	{
		if(!this.initialized){return;}
		engine.controller.onAudioLoad();
		Utils.debug.trace('Audio load has completed');
	};

	/**
	* Handles the audio complete event issued by the audio object and passes the event to the controller
	* @method onAudioComplete
	*/
	this.onAudioComplete=function()
	{
		if(!this.initialized){return;}
		this.isPlaying = false;
		engine.controller.onAudioComplete();
		Utils.debug.trace('Audio playback has completed');
	};

	/**
	* Fires when the audio object has completed initializing itself internally
	* @method onReady
	*/
	this.onReady=function()
	{
		Utils.debug.trace('Audio object is now in a ready state');
		this.ready = true;
		engine.onReady();
	};

	/**
	* Handles the audio position/duration values and passes them along to the UI object
	* @method updatePosition
	*/
	this.updatePosition=function(pos,dur)
	{
		engine.ui.audioUpdatePosition(pos,dur);
	};

	this.toString=function()
	{
		return 'Audio object';
	};
};
