/** 
* Creates the AICC communication object
* @classDescription This class handles all AICC LMS communication
* @constructor
*/
var CommFactoryAicc = function()
{
	this.startDate = '';
	this.matchSep = '.';
	this.groupSep = ',';
	this.interactionTrueString = 't';
	this.interactionFalseString = 'f';
	this.enableManualSubmit = false;
	this.autoRun = false;
	this.heartbeatInterval = 900000;
	this.exitSent = false;
	this.API = null;
	this.initOnIndexPage = false;
	this.requireUsername = false;
	this.paramsValid = false;
	this.completeOnThreshold = false;
	
	this.adapterSWF = Utils.window.getRootFolder()+"/assets/swf/aiccadapter.swf";
	this.aiccSWF = Utils.window.getRootFolder()+"/assets/swf/aicc.swf";
	
	this.map =
	{
		'cmi.core.student_id' : 'aicc.core.student_id',
		'cmi.core.student_name' : 'aicc.core.student_name',
		'cmi.core.lesson_mode' : 'aicc.core.lesson_mode',
		'cmi.core.lesson_location' : 'aicc.core.lesson_location',
		'cmi.core.lesson_status' : 'aicc.core.lesson_status',
		'cmi.core.credit' : 'aicc.core.credit',
		'cmi.core.score.raw' : 'aicc.core.score',
		'cmi.core.session_time' : 'aicc.core.time',
		'cmi.suspend_data' : 'aicc.core_lesson.__value__'
	};
	
	this.errors = {0:"No Error"};	
	this.lastError = 0;
	this.ready = false;
	
	var self = this;
	this.heartbeat = setInterval(function(){ self._heartbeat(); }, this.heartbeatInterval);
	
	this.AICCInit = function(aiccdata)
	{
		Utils.debug.trace('CommFactory: Initializing AICC data object','comm');
		
		if (typeof aiccdata !== "undefined")
		{
			this.aicc = new AICC(unescape(aiccdata));
			this.ready = true;
			
			if(Conf.API_WRAPPER_DEBUG)
			{
				Utils.debug.trace('CommFactory: Initial AICC Data from ' + this.aiccurl + ':' + this.aicc.toString(),'comm');
			}
			
			engine.preloadAssets();
		}
		else
		{
			Utils.debug.trace('CommFactory Error: Did not receive valid AICC data to initialize lesson','error');
		}
	};
	
	this.AICCServerInit = function()
	{
		Utils.debug.trace('CommFactory: Initializing AICC Server','comm');
		
		if(Conf.REMOTE_PROXY)
		{
			var aicc_server = this.aiccurl.substring(0,this.aiccurl.lastIndexOf('/'));
			aicc_server = aicc_server.substring(0,aicc_server.lastIndexOf('/')+1);
			aicc_server += "aicc/aicc.swf";
		}
		else
		{
			var aicc_server = this.aiccSWF;
		}

		var flashvars = {
			aicc_url: this.aiccurl,
			aicc_sid: this.aiccsid
		};
		var params = {
			menu: "false",
			swliveconnect: "true",
			allowScriptAccess: "always"
		};
		var attributes = {
			id: "aicc",
			name: "aicc"
		};
		
		swfobject.embedSWF(aicc_server, "aiccserver", "1", "1",  engine.flashPluginVer, "assets/swf/expressinstall.swf", flashvars, params, attributes);
	
		document.forms['ensureExit'].action = this.aiccurl;
		document.forms['ensureExit'].elements['session_id'].value = this.aiccsid;
	};
	
	this.AICCClientInit = function()
	{
		Utils.debug.trace('CommFactory: Initializing AICC client (loading adapter)','comm');

		var flashvars = {};
		var params = {
			menu: "false",
			swliveconnect: "true",
			allowScriptAccess: "always"
		};
		var attributes = {
			id: "aiccadapter",
			name: "aiccadapter"
		};
		
		swfobject.embedSWF(this.adapterSWF, "aiccclient", "1", "1",  engine.flashPluginVer, "assets/swf/expressinstall.swf", flashvars, params, attributes);
		
		if(Conf.API_WRAPPER_DEBUG)
		{
			if(this.aiccurl && this.aiccsid)
			{
				Utils.debug.trace('AICC_URL parameter received: '+this.aiccurl);
				Utils.debug.trace('AICC_SID parameter received: '+this.aiccsid);
			}
			else
			{
				Utils.debug.trace('CommFactory Error: No AICC parameters have been passed to this window or its parent.','error');
			}
		}
		
		return true;
	};
	
	this.initialize = function()
	{
		// Store initial startTime in centiseconds
		this.startTime = Math.round((new Date()).getTime() / 10);

		if(engine.searchparams !== null)
		{
			this.aiccurl = engine.searchparams['aicc_url'] || engine.searchparams['AICC_URL'];
			this.aiccsid = engine.searchparams['aicc_sid'] || engine.searchparams['AICC_SID'];

			if(this.aiccurl.length > 0 && this.aiccsid.length > 0)
			{
				this.paramsValid = true;
			}
			else
			{
				Utils.debug.trace('CommFactory: AICC parameters are invalid. Will not initialize AICC client','error');
				this.ready = true;
				return false;
			}
		}
		else
		{
			Utils.debug.trace('CommFactory: No search parameters have been detected.  Cannot initialize AICC client','error');
			this.ready = true;
			return false;
		}
		
		var hasRequiredFlashVer = Utils.flash.hasRequiredVer();
		var installedFlashVer = Utils.flash.getInstalledVer();
		Utils.debug.trace('CommFactory: Has required Flash Player Installed: '+hasRequiredFlashVer+' ('+installedFlashVer+')','comm');

		if(hasRequiredFlashVer)
		{
			return this.AICCClientInit();
		}
		else
		{
			if(!Utils.browserDetection.isMobile())
			{
				Utils.flash.showWarning();
			}
			else
			{
				Utils.flash.showAICCWarning();
			}
			this.ready = true;
			return false;
		}
	};
	
	this.terminate = function()
	{
		if (!this.ready || !this.paramsValid) { return false; }
		this.ready = false;
		
		this._post("command=exitau&version=2.0&session_id=" + escape(this.aiccsid));

		this._sendExit();
	
		return true;
	};
	
	this.commit = function()
	{
		if (!this.ready || !this.paramsValid) { return false; }

		this.setSessionTime();

		Utils.debug.trace('CommFactory: Posting data (aicc_data='+escape(this.aicc.toString())+')','comm');
		
		this._post("command=putparam&version=2.0&session_id=" + escape(this.aiccsid) + "&aicc_data=" + escape(this.aicc.toString()));
	
		return true;
	};
	
	this.setLocation = function(lesson_location)
	{
		return this.setValue('cmi.core.lesson_location',lesson_location);
	};
	
	this.getLocation = function()
	{
		return this.getValue('cmi.core.lesson_location');
	};
	
	this.setCompletionStatus = function(lesson_status)
	{
		return this.setValue('cmi.core.lesson_status',lesson_status);
	};
	
	this.getCompletionStatus = function()
	{
		return this.getValue('cmi.core.lesson_status');
	};

	this.setSuccessStatus = function(){return true;}
	this.getSuccessStatus = function(){return '';}
	
	this.setScore = function(score)
	{
		return this.setValue('cmi.core.score.raw',score);
	};
	
	this.getScore = function()
	{
		return this.getValue('cmi.core.score.raw');
	};
	
	this.setSuspendData = function(suspend_data)
	{
		return this.setValue('cmi.suspend_data',suspend_data);
	};
	
	this.getSuspendData = function()
	{
		return this.getValue('cmi.suspend_data');
	};
	
	this.setValue = function(data_element, value)
	{
		if (!this.ready || !data_element || !this.paramsValid) { return false; }
	
		// Do not set interactions data, if it exists
		if (data_element.indexOf('cmi.interactions') >= 0) { return true; }	
	
		/*
		if(data_element == "cmi.core.lesson_status" && (value.toLowerCase() == "completed" || value.toLowerCase() == "passed"))
		{
			value = 'P';
		}
		*/
		
		var aicc = this.aicc;
		value = '' + value;
		value = value.replace("'","\\'");
		value = value.replace('"','\\"');
		if(this._remap(data_element))
		{
			eval(this._remap(data_element) + "='" + value + "'");
		}
		
		return true;
	};
	
	this.getValue = function(data_element)
	{
		if (!this.ready || !data_element || !this.paramsValid) { return ''; }
	
		var aicc = this.aicc;
		var value = eval(this._remap(data_element));
		
		if(data_element == "cmi.core.lesson_status")
		{
			var status = value.charAt(0).toLowerCase();
			
			switch (status)
			{
				case 'n':
					value = 'not attempted';
					break;
				case 'i':
					value = 'incomplete';
					break;
				case 'c':
					value = 'completed';
					break;
				case 'p':
					value = 'completed';
					break;
				case 'b':
					value = 'browsed';
					break;
			}
		}

		Utils.debug.trace('CommFactory: getValue('+data_element+','+value+')');
		
		return value;
	};
	
	this.setCompleted = function(completionString)
	{
		// For AICC, could be either "completed" or "passed"...
		// Only first character is relevant ("c"/"C" or "p"/"P")
		return this.setCompletionStatus(completionString);
	};
	
	this.setSessionTime = function()
	{
		if(this.startTime != 0)
		{
			var curTime = Math.round((new Date()).getTime() / 10);
			var duration = curTime - this.startTime;
			var timeStamp = centisecsToSCORM12Duration(duration);
		}
		else
		{
			var timeStamp = "00:00:00.0";
		}

		this.setValue('cmi.core.session_time', timeStamp);
		
		return true;
	};
	
	this._remap = function(data_element)
	{
		var aicc_map = this.map[data_element];
		if (aicc_map)
		{
	
			if (data_element == 'cmi.suspend_data')
			{
				if (!this.aicc.core_lesson)
				{
					this.aicc.core_lesson = {};
				}
			}
			return aicc_map;
		}
	
		var cmiobjectives = data_element.match(/cmi\.objectives\.?\[?(\d+)\]?\.(.*)/i);
		if (cmiobjectives && cmiobjectives.length > 2)
		{
			if (!this.aicc.objectives_status)
			{
				this.aicc.objectives_status = {};
			}
			var id = cmiobjectives[1];
			var slot = cmiobjectives[2];
			if (slot == 'score.raw') { slot = 'score'; }
			aicc_map = 'aicc.objectives_status["j_' + slot + '.' + id + '"]';
			return aicc_map;
		}
	
		return '';
	};
	
	this._heartbeat = function()
	{
		this._post("command=getparam&version=2.0&session_id=" + escape(this.aiccsid));
	};
	
	this._post = function(s)
	{
		if(Conf.API_WRAPPER_DEBUG)
		{
			Utils.debug.trace("Posting AICC data to "  + this.aiccurl + ":command=putparam&version=2.0&session_id=" + escape(this.aiccsid) + "&aicc_data=" + escape(this.aicc.toString()),'comm');
		}

		var flashvars = {
			command: escape(s)
		};
		var params = {
			menu: "false",
			swliveconnect: "true",
			allowScriptAccess: "always"
		};
		var attributes = {
			id: "aiccadapter",
			name: "aiccadapter"
		};
		
		swfobject.embedSWF(this.adapterSWF, "aiccadapter", "1", "1",  engine.flashPluginVer, "assets/swf/expressinstall.swf", flashvars, params, attributes);
	};

	this._sendExit = function()
	{
		var reqObj;

		if(window.XMLHttpRequest)
		{
			reqObj = new XMLHttpRequest();
		}
		else if(window.ActiveXObject)
		{
			try
			{
				reqObj = new ActiveXObject("Msxml2.XMLHTTP");
			}
			catch(e)
			{
				try
				{
					reqObj = new ActiveXObject("Microsoft.XMLHTTP");
				}
				catch(e){}
			}
		}

		if(reqObj)
		{
			try
			{
				reqObj.open('POST',this.aiccurl,false);
				reqObj.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
				reqObj.send("command=exitau&version=2.0&session_id="+this.aiccsid);
			}
			catch (e)
			{
				document.forms['ensureExit'].submit();
			}
		}
	};
	
	// All interactions data is ignored for AICC implementation
	this.setInteractionId = function(id, name){return true;};
	this.setInteractionType = function(id, type){return true;};
	this.setInteractionDescription = function(id, stem){return true;};
	this.setInteractionCorrectResponse = function(id, correct_response){return true;};
	this.setInteractionStudentResponse = function(id, student_response){return true;};
	this.setInteractionResult = function(id,result){return true;};	
	this.setInteractionTime = function(id){return true;};
	this.setInteractionTimeStamp = function(id){return true;};
	this.setInteractionLatency = function(id){return true;};
	
	// applicable to SCORM/uPerform server
	this.setProgressStatus = function(percent_complete){return true;};
	this.getProgressStatus = function(){return false;};
	this.setCompletionThreshold = function(){return true;};
	this.getCompletionThreshold = function(){return false;};
	this.setSimMode = function(simulation_mode){return true;};
	this.getSimMode = function(){return false;};
};
