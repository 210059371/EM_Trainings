/** 
* Creates SCORM 1.2 API communication object
* @classDescription This class handles all SCORM 1.2 LMS communication
* @constructor
*/
var CommFactoryScorm12 = function()
{
	this.startTime = '';
	this.matchSep = '.';
	this.groupSep = ',';
	this.interactionTrueString = 't';
	this.interactionFalseString = 'f';
	this.enableManualSubmit = false;
	this.autoRun = true;
	this.API = null;
	this.terminated = false;
	this.initOnIndexPage = true;
	this.requireUsername = false;
	this.ready = false;
	this.completeOnThreshold = true;
	
	this.initialize = function()
	{
		this.ready = true;
		var result = doLMSInitialize();
		if(result != "true")
		{
			Utils.debug.trace('CommFactory Error: Cannot initialize.','error');
			return false;
		}
		else
		{
			Utils.debug.trace('CommFactory: initialize=true','comm');
			// Store initial startTime in centiseconds
			this.startTime = Math.round((new Date()).getTime() / 10);
			this.API = getAPIHandle();
		}
		return true;
	};
	
	this.terminate = function()
	{
		this.setSessionTime();
		this.commit();
		
		var result = doLMSFinish();
		if(result != "true") 
		{
			Utils.debug.trace('CommFactory Error: Cannot terminate.','error');
			return false;
		}
		else
		{
			Utils.debug.trace('CommFactory: terminate=true','comm');
		}
		this.terminated = true;
		return true;
	};
	
	this.commit = function()
	{
		var result = doLMSCommit();
		if(result != "true") 
		{
			Utils.debug.trace('CommFactory Error: Cannot commit data.','error');
			return false;
		}
		else
		{
			Utils.debug.trace('CommFactory: commit=true','comm');
		}
		return true;
	};
	
	this.setLocation = function(lesson_location)
	{
		var result = doLMSSetValue('cmi.core.lesson_location', lesson_location);
		if(result != "true") 
		{
			Utils.debug.trace('CommFactory Error: Cannot set lesson_location.','error');
			return false;
		}
		else
		{
			Utils.debug.trace('CommFactory: setLocation=true ('+lesson_location+')','comm');
		}
		return true;
	};
	
	this.getLocation = function()
	{
		var result = doLMSGetValue('cmi.core.lesson_location');
		Utils.debug.trace('CommFactory: getLocation='+result,'comm');
		return result;
	};
	
	this.setCompletionStatus = function(lesson_status)
	{
		var result = doLMSSetValue('cmi.core.lesson_status', lesson_status);
		if(result != "true") 
		{
			Utils.debug.trace('CommFactory Error: Cannot set lesson_status.','error');
			return false;
		}
		else
		{
			Utils.debug.trace('CommFactory: setCompletionStatus=true ('+lesson_status+')','comm');
		}
		return true;
	};
	
	this.getCompletionStatus = function()
	{
		var result = doLMSGetValue('cmi.core.lesson_status');
		Utils.debug.trace('CommFactory: getCompletionStatus='+result,'comm');
		return result;
	};
	
	this.setProgressStatus = function(percent_complete)
	{
		var progressResult = doLMSSetValue('rwd.progress_measure', percent_complete);
		if(progressResult != "true") 
		{
			Utils.debug.trace('CommFactory Error: Cannot set progress_measure.','error');
			return false;
		}
		else
		{
			Utils.debug.trace('CommFactory: setProgressStatus(progress_measure)=true ('+percent_complete+')','comm');
		}
		return true;
	};
	
	this.getProgressStatus = function()
	{
		var result = doLMSGetValue('rwd.progress_measure');
		Utils.debug.trace('CommFactory: getProgressStatus='+result,'comm');
		return result;
	};
	
	this.setSimMode = function(simulation_mode)
	{
		var result = doLMSSetValue('rwd.sim_mode', simulation_mode);
		
		if(result != "true") 
		{
			Utils.debug.trace('CommFactory Error: Cannot set sim_mode.','error');
			return false;
		}
		else
		{
			Utils.debug.trace('CommFactory: setSimMode=true ('+simulation_mode+')','comm');
		}
		return true;
	};
	
	this.getSimMode = function()
	{
		var result = doLMSGetValue('rwd.sim_mode');
		Utils.debug.trace('CommFactory: getSimMode='+result,'comm');
		return result;
	};
	
	this.setCompletionThreshold = function(completion_threshold){
		var result = doLMSSetValue('rwd.completion_threshold', completion_threshold);
		if(result != "true") 
		{
			Utils.debug.trace('CommFactory Error: Cannot set completion_threshold.','error');
			return false;
		}
		else
		{
			Utils.debug.trace('CommFactory: setCompletionThreshold(completion_threshold)=true ('+completion_threshold+')','comm');
		}
		return true;
	};
	
	this.setScore = function(score)
	{
		var minResult = doLMSSetValue('cmi.core.score.min', '0');
		var maxResult = doLMSSetValue('cmi.core.score.max', '100');
		
		var scoreResult = doLMSSetValue('cmi.core.score.raw', score.toString());
		
		if(scoreResult != "true") 
		{
			Utils.debug.trace('CommFactory Error: Cannot set score.');
			return false;
		}
		else
		{
			Utils.debug.trace('CommFactory: setScore=true ('+score.toString()+')','comm');
		}
		return true;
	};
	
	this.getScore = function()
	{
		var result = doLMSGetValue('cmi.core.score.raw');
		Utils.debug.trace('CommFactory: getScore='+result,'comm');
		return result;
	};
	
	this.setSuspendData = function(suspend_data)
	{
		var result = doLMSSetValue('cmi.suspend_data', escape(suspend_data));
		if(result != "true") 
		{
			Utils.debug.trace('CommFactory Error: Cannot set suspend_data.','error');
			return false;
		}
		else
		{
			Utils.debug.trace('CommFactory: setSuspendData=true ('+suspend_data+')','comm');
		}
		return true;
	};
	
	this.getSuspendData = function()
	{
		var result = unescape(doLMSGetValue('cmi.suspend_data'));
		Utils.debug.trace('CommFactory: getSuspendData='+result,'comm');
		return result;
	};
	
	this.setValue = function(field,data)
	{
		var result = doLMSSetValue(field,data);
		Utils.debug.trace('CommFactory: setValue='+result+' ('+field+'='+data+')','comm');
		return result;
	};
	
	this.setCompleted = function(completionString)
	{
		// For SCORM 1.2, could be either "completed" or "passed"
		return this.setCompletionStatus(completionString);
	};
	
	this.setInteractionId = function(id, name)
	{
		this.setValue('cmi.interactions.'+id+'.id', name);
	};
	
	this.setInteractionType = function(id, type)
	{
		this.setValue('cmi.interactions.'+id+'.type', type);
	};
	
	this.setInteractionDescription = function(id, stem)
	{
		// "description" field not supported in SCORM 1.2,
		// Use the proprietary "rwd.interactions" member
		this.setValue('rwd.interactions.'+id+'.description', stem);
	};
	
	this.setInteractionCorrectResponse = function(id, correct_response)
	{
		this.setValue('cmi.interactions.'+id+'.correct_responses.0.pattern', correct_response);
	};
	
	this.setInteractionStudentResponse = function(id, student_response)
	{
		this.setValue('cmi.interactions.'+id+'.student_response', student_response);
	};
	
	this.setInteractionResult = function(id, result)
	{
		var resultString = (result) ? 'correct' : 'wrong';
		this.setValue('cmi.interactions.'+id+'.result', resultString);
	};

	this.setInteractionTime = function(id)
	{
		var timeStamp = this._getTimeNow();
		this.setValue('cmi.interactions.'+id+'.time', timeStamp);
	};

	this._getTimeNow = function()
	{
		var d = new Date();
		var h = (d.getHours() < 10) ? '0'+d.getHours() : d.getHours();
		var m = (d.getMinutes() < 10) ? '0'+d.getMinutes() : d.getMinutes();
		var s = (d.getSeconds() < 10) ? '0'+d.getSeconds() : d.getSeconds();
		return h+':'+m+':'+s;
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

		var result = doLMSSetValue('cmi.core.session_time', timeStamp);
		if(result != "true") 
		{
			Utils.debug.trace('CommFactory Error: Cannot set session_time.','error');
			return false;
		}
		else
		{
			Utils.debug.trace('CommFactory: setSessionTime=true ('+timeStamp+')','comm');
		}
		return true;
	};

	// Not supported in SCORM 1.2
	this.setSuccessStatus = function(success_status){return true;};
	this.getSuccessStatus = function(){return false;};
	this.setInteractionTimeStamp = function(id){return false;};
	this.setInteractionLatency = function(id){return false;};
	this.getCompletionThreshold = function(){return false;};
};
