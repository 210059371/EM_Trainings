
/**
* Class defining the HTML5 audio layer used step actions
* @type {Object}
* @requires Engine
* @requires ActionAudioObjectHtml5
*/
var ActionAudioObjectHtml5 = function()
{
	this.audioObjEdit = null;
	//this.audioObjKey = null;
	//this.audioObjMouse = null;
	this.audioObjCollection = {};

	/**
	* Initialize the audio control layer
	* @method initialize
	*/
	this.initialize=function()
	{
		var self = this;

		try
		{
			this.audioObjEdit = new Audio();
			document.body.appendChild(this.audioObjEdit);
			this.audioObjCollection.edit = this.audioObjEdit;

			//this.audioObjKey = new Audio();
			//document.body.appendChild(this.audioObjKey);
			//this.audioObjCollection.key = this.audioObjKey;

			//this.audioObjMouse = new Audio();
			//document.body.appendChild(this.audioObjMouse);
			//this.audioObjCollection.mouse = this.audioObjMouse;
		}
		catch(e)
		{
			Utils.debug.trace("HTML5 ActionAudio Object: "+e.description,'error');
			return false;
		}

		var canPlayMp3 = this.supportsAudioFormat("audio/mpeg");
		//var canPlayOgg = this.supportsAudioFormat('audio/ogg; codecs="vorbis"');

		if(!canPlayMp3)
		{
			return false;
		}

		for(var prop in this.audioObjCollection)
		{
			var obj = this.audioObjCollection[prop];
			obj.addEventListener("suspend",function(){
				Utils.debug.trace('HTML5 ActionAudio Object: Suspend fired!');
			}, false);

			obj.addEventListener('error',function(e){
				Utils.debug.trace("HTML5 ActionAudio Object: An error occurred: "+(e.description || e),'error');
			},true);

			obj.addEventListener('canplay',function(){
				obj.loaded = true;
				engine.actionAudio.onAudioLoad(prop);
			},true);

			obj.addEventListener('play',function(){
				engine.actionAudio.onAudioStart(prop);
			},true);

			obj.addEventListener('readyStateChange',function(){
				Utils.debug.trace("HTML5 ActionAudio Object: readyState = "+obj.readyState);
			},true);
		}

		return true;
	};

	this.loadAudio = function(file,type)
	{
		var obj = this.audioObjCollection[type];
		obj.src = file;
		try
		{
			Utils.debug.trace('Loading action audio (HTML5 obj)');
			obj.load();
		}
		catch(e)
		{
			Utils.debug.trace("An error occurred attempting to load action audio: "+e.description,'error');
			obj.loaded = false;
		}
	};

	this.playAudio = function(type)
	{
		var obj = this.audioObjCollection[type];
		if(!obj.loaded){return;}
		try
		{
			obj.pause();
			obj.currentTime = 0;
			obj.play();
		}
		catch(e)
		{
			Utils.debug.trace("An error occurred attempting to play action audio: "+e.description,'error');
		}
	};

	this.stopAudio = function()
	{
		for(var prop in this.audioObjCollection)
		{
			var obj = this.audioObjCollection[prop];
			if(obj.loaded)
			{
				obj.pause();
				obj.currentTime = 0;
			}
		}
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
		return !!this.audioObjEdit.canPlayType && "" != this.audioObjEdit.canPlayType(format);
	};
};