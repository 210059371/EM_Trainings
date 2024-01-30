/**
* Class defining the audio layer used step actions
* @type {Object}
*/
var ActionAudio = function()
{
	this.obj = null;
	this.initialized = false;

	/**
	* Initialize the audio control layer
	* @method initialize
	*/
	this.initialize=function(o)
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
						Utils.debug.trace('ActionAudio object initialized (Flash)');
						return true;
					}
					else
					{
						Utils.debug.trace('Error: ActionAudio object cannot initialize (Flash)','error');
						return false;
					}
				}
				catch(e)
				{
					Utils.debug.trace('Error: An error has occurred while attempting to create Flash actionAudio object: '+e,'error');
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
						engine.preloadActionAudio();
						Utils.debug.trace('ActionAudio object initialized (HTML5)');
						return true;
					}
					else
					{
						Utils.debug.trace('ActionAudio Object: Browser does not support HTML5 audio, or does not support playback of MP3 files. Attempting to fall back to Flash...','error');
						Conf.AUDIO_TYPE = "FLASH";
						return this.initialize();
					}
				}
				catch(e)
				{
					Utils.debug.trace('Error: An error has occurred while attempting to create HTML5 actionAudio object: '+(e.description || e),'error');
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
						Utils.debug.trace('ActionAudio object initialized (Custom)');
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
					Utils.debug.trace('Error: An error has occurred while attempting to create custom actionAudio object: '+(e.description || e),'error');
					return false;
				}

				break;
				
			case null:
				engine.controller.hideAudioControls();
				try
				{
					this.initialized = true;
					this.obj = this.createNullAudioObject();
					Utils.debug.trace('ActionAudio object initialized (null - no course audio)');
					return true;
				}
				catch(e)
				{
					Utils.debug.trace('Error: An error has occurred while attempting to create null actionAudio object: '+(e.description || e),'error');
					return false;
				}

				break;
			
			default:
				Utils.debug.trace('Error: No known audio type used. Received: '+Conf.AUDIO_TYPE,'error');
				return false;
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
		Utils.debug.trace('ActionAudio: Has required Flash Player Installed: '+hasRequiredFlashVer+' ('+installedFlashVer+')');

		if(hasRequiredFlashVer)
		{
			var flashvars = {};
			var params = {
				menu: "false",
				swliveconnect: "true",
				allowScriptAccess: "always"
			};
			var attributes = {
				id: "flashActionAudioObj",
				name: "flashActionAudioObj"
			};
			
			swfobject.embedSWF("assets/swf/action-audio.swf", "actionAudioContainer", "1", "1",  engine.flashPluginVer, "assets/swf/expressinstall.swf", flashvars, params, attributes);
			return Utils.dom.getFlashObject("flashActionAudioObj");
		}
		else
		{
			return null;
		}
	};

	/**
	* Creates a HTML5 object
	* @method createHtml5AudioObject
	*/
	this.createHtml5AudioObject=function()
	{
		var html5AudioObj = new ActionAudioObjectHtml5(this);
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
		return nullObj;
	};

	/**
	* Creates an instance of a custom audio handler
	* @method load
	* @param {String} file The filename of the audio file to load into the audio object
	*/
	this.load=function(file,type)
	{
		if(!this.initialized){return;}
		var self = this;
		var func = function()
		{
			try
			{
				self.obj.loadAudio(file,type);
			}
			catch (e)
			{
				Utils.debug.trace('ActionAudio Error occurred calling loadAudio: '+(e.description || e),'error');
			}
		};

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
	this.play=function(type)
	{
		if(!this.initialized){return;}
		var self = this;
		var func = function()
		{
			try
			{
				self.obj.playAudio(type);
			}
			catch (e)
			{
				Utils.debug.trace('ActionAudio Error occurred calling playAudio: '+(e.description || e),'error');
			}
		};

		if(this.useTimeout)
		{	
			setTimeout(func,100);
		}
		else
		{
			this.obj.playAudio(type);
		}
	};

	/**
	* Sends a command to the audio object to stop the current audio
	* @method stop
	*/
	this.stop=function()
	{
		if(!this.initialized){return;}
		var self = this;
		var func = function()
		{
			try
			{
				self.obj.stopAudio();
			}
			catch (e)
			{
				Utils.debug.trace('ActionAudio Error occurred calling stopAudio: '+(e.description || e),'error');
			}
		};

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
	* Handles the audio start event issued by the audio object and passes the event to the controller
	* @method onAudioStart
	*/
	this.onAudioStart=function(type)
	{
		if(!this.initialized){return;}
		Utils.debug.trace('ActionAudio playback has started for '+type);
	};

	/**
	* Handles the audio load event issued by the audio object, hiding the loading graphic
	* @method onAudioLoad
	*/
	this.onAudioLoad=function(type)
	{
		if(!this.initialized){return;}
		Utils.debug.trace('ActionAudio load has completed for action type: '+type);
	};
};
