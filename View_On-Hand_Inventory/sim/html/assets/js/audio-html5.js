
/**
* Class defining the HTML5 audio layer used by the engine
* @type {Object}
* @requires Engine
* @requires AudioObject
*/
var AudioObjectHtml5 = function()
{
	this.audioObj = null;
	this.audioLoaded = false;
	this.playing = false;
	this.paused = false;
	this.timeoutId = null;
	this.initForced = false;
	this.playbackPromptShown = false;

	/**
	* Initialize the audio control layer
	* @method initialize
	*/
	this.initialize=function()
	{
		var self = this;

		try
		{
			this.audioObj = new Audio();
			document.body.appendChild(this.audioObj);
		}
		catch(e)
		{
			Utils.debug.trace("HTML5 Audio Object: "+e.description,'error');
			return false;
		}

		var canPlayMp3 = this.supportsAudioFormat("audio/mpeg");
		//var canPlayOgg = this.supportsAudioFormat('audio/ogg; codecs="vorbis"');

		if(!canPlayMp3)
		{
			return false;
		}

		this.audioObj.addEventListener("suspend",function(){
			Utils.debug.trace('HTML5 Audio Object: Suspend fired!');
			if(!self.initForced)
			{
				engine.ui.showEnablePlaybackPrompt();
				self.playbackPromptShown = true;
				Utils.debug.trace('HTML5 Audio Object: Playback prompt not yet displayed. Showing playback prompt.');
			}
		}, false);
		
		this.audioObj.addEventListener('ended',function(){
			self.playing = false;
			engine.audio.onAudioComplete();
			self.updatePosition("00:00");
		},true);

		this.audioObj.addEventListener('error',function(e){
			engine.controller.disableAudio();
			$('audioLoading').hide();
			Utils.debug.trace("HTML5 Audio Object: An error occurred",'error');
		},true);

		this.audioObj.addEventListener('loadeddata',function(){
			Utils.debug.trace("HTML5 Audio Object: loadeddata fired");
			self.audioLoaded = true;
			self.initForced = true;
			engine.audio.onAudioLoad();
			engine.audio.play();
			if(self.playbackPromptShown)
			{
				engine.ui.hideEnablePlaybackPrompt();
				Utils.debug.trace('HTML5 Audio Object: Playback prompt shown. Hiding playback prompt.');
			}
		},true);

		this.audioObj.addEventListener('play',function(){
			self.playing = true;
			engine.audio.onAudioStart();
		},true);

		this.audioObj.addEventListener('pause',function(){
			self.playing = false;
			engine.audio.onAudioPause();
		},true);

		this.audioObj.addEventListener('readyStateChange',function(){
			Utils.debug.trace("HTML5 Audio Object: readyState = "+this.audioObj.readyState);
		},true);

		return true;
	};

	this.loadAudio = function(file,stream)
	{
		this.audioObj.src = file;
		try
		{
			this.audioObj.load();
			this.audioLoaded = true;
		}
		catch(e)
		{
			Utils.debug.trace("An error occurred attempting to load/play audio",'error');
			this.audioLoaded = false;
		}
	};

	this.removeAudio = function()
	{
		this.audioObj.pause();
		this.audioLoaded = false;
		this.playing = false;
	};

	this.playAudio = function()
	{
		this.audioObj.play();
		this.playing = true;
		this.paused = false;
		this.updatePosition();
	};

	this.pauseAudio = function()
	{
		this.audioObj.pause();
		this.playing = false;
		this.paused = true;
	};

	this.stopAudio = function()
	{
		if(!this.audioLoaded){return;}
		this.paused = false;
		this.audioObj.pause();
		this.audioObj.currentTime = 0;
		engine.audio.onAudioStop();
	};

	this.resetAudio = function()
	{
		if(!this.audioLoaded){return;}
		this.audioObj.pause();
		this.audioLoaded = false;
		this.playing = false;
		this.paused = false;
		this.audioObj.currentTime = 0;
		this.audioObj.src = '';
		engine.audio.updatePosition(0,0);
	};

	this.updatePosition = function()
	{
		try
		{
			if(this.audioLoaded && this.playing && !this.paused)
			{
				engine.audio.updatePosition(this.audioObj.currentTime,this.audioObj.duration);

				var self = this;
				var func = function()
				{
					self.updatePosition();
				}
				clearTimeout(this.timeoutId);
				this.timeoutId = setTimeout(func,500);
			}
			else
			{
				engine.audio.updatePostion(0,0);
			}
		}
		catch(e){}
	};

	this.supportsAudio = function()
	{
		return !!(document.createElement('audio').canPlayType);
	};

	this.supportsAudioFormat = function(format)
	{
		if(!this.supportsAudio())
		{
			Utils.debug.trace("HTML5 Audio Object: Browser does not support audio.",'error');
			return false;
		}

		var a = document.createElement("audio");
		return !!this.audioObj.canPlayType && "" != this.audioObj.canPlayType(format);
	};
};