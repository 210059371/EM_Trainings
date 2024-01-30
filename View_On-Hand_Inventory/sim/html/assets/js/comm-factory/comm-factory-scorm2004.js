/** 
* Creates SCORM 2004 API communication object
* @classDescription This class handles all SCORM 2004 LMS communication
* @constructor
*/
var CommFactoryScorm2004 = function()
{
	this.startTime = '';
	this.matchSep = '[.]';
	this.groupSep = '[,]';
	this.interactionTrueString = 'true';
	this.interactionFalseString = 'false';
	this.enableManualSubmit = false;
	this.autoRun = true;
	this.API = null;
	this.terminated = false;
	this.initOnIndexPage = true;
	this.requireUsername = false;
	this.interactionTimeStamp = '';
	this.ready = false;
	this.completeOnThreshold = true;
	
	this.initialize = function()
	{
		this.ready = true;
		var result = doInitialize();
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
			this.setValue('cmi.exit','suspend');
		}
		return true;
	};
	
	this.terminate = function()
	{
		var lesson_status = this.getCompletionStatus();
		var success_status = this.getSuccessStatus();

		if(lesson_status === "completed" || success_status === "passed")
		{
			this.setValue('cmi.exit','');
			this.setValue('adl.nav.request', 'exitAll');
		}
		
		this.setSessionTime();
		this.commit();
		
		var result = doTerminate();
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
		var result = doCommit();
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
		var result = doSetValue('cmi.location', lesson_location);
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
		var result = doGetValue('cmi.location');
		Utils.debug.trace('CommFactory: getLocation='+result,'comm');
		return result;
	};

	this.setValue = function(field,data)
	{
		var result = doSetValue(field,data);
		Utils.debug.trace('CommFactory: setValue='+result+' ('+field+'='+data+')','comm');
		return result;
	};
	
	this.setCompletionStatus = function(lesson_status)
	{
		if(lesson_status === "passed"){lesson_status = "completed";};
		if(lesson_status === "failed"){lesson_status = "incomplete";};
		if(lesson_status === "incomplete")
		{
			this.setValue('cmi.exit','suspend');
			this.setValue('adl.nav.request', 'suspendAll');
		}
		var result = doSetValue('cmi.completion_status', lesson_status);
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
		var result = doGetValue('cmi.completion_status');
		Utils.debug.trace('CommFactory: getCompletionStatus='+result,'comm');
		return result;
	};
	
	this.setSuccessStatus = function(success_status)
	{
		var result = doSetValue('cmi.success_status', success_status);
		if(result != "true") 
		{
			Utils.debug.trace('CommFactory Error: Cannot set success_status.','error');
			return false;
		}
		else
		{
			Utils.debug.trace('CommFactory: setSuccessStatus=true ('+success_status+')','comm');
		}
		return true;
	};
	
	this.getSuccessStatus = function()
	{
		var result = doGetValue('cmi.success_status');
		Utils.debug.trace('CommFactory: getSuccessStatus='+result,'comm');
		return result;
	};
	
	this.setProgressStatus = function(percent_complete)
	{
		var progressResult = doSetValue('cmi.progress_measure', percent_complete);
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
		var result = doGetValue('cmi.progress_measure');
		Utils.debug.trace('CommFactory: getProgressStatus='+result,'comm');
		return result;
	};
	
	this.getCompletionThreshold = function()
	{
		var result = doGetValue('cmi.completion_threshold');
		Utils.debug.trace('CommFactory: getCompletionThreshold='+result,'comm');
		return result;
	};
	
	this.setSimMode = function(simulation_mode)
	{
		var result = doSetValue('rwd.sim_mode', simulation_mode);
		
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
		var result = doGetValue('rwd.sim_mode');
		Utils.debug.trace('CommFactory: getSimMode='+result,'comm');
		return result;
	};
	
	this.setScore = function(score)
	{
		var minResult = doSetValue('cmi.score.min', '0');
		var maxResult = doSetValue('cmi.score.max', '100');
		
		var scaledScore = parseFloat(score/100).toString();
		scaledScore = (scaledScore === "1") ? "1.0" : scaledScore;
		
		var resultRaw = doSetValue('cmi.score.raw', score.toString());
		var resultScaled = doSetValue('cmi.score.scaled', scaledScore);
		
		if(resultRaw != "true") 
		{
			Utils.debug.trace('CommFactory Error: Cannot set raw score.','error');
			return false;
		}
		else
		{
			Utils.debug.trace('CommFactory: setScore(raw)=true ('+score.toString()+')','comm');
		}
		if(resultScaled != "true") 
		{
			Utils.debug.trace('CommFactory Error: Cannot set scaled score.','error');
			return false;
		}
		else
		{
			Utils.debug.trace('CommFactory: setScore(scaled)=true ('+scaledScore+')','comm');
		}
		return true;
	};
	
	this.getScore = function()
	{
		var result = doGetValue('cmi.score.raw');
		Utils.debug.trace('CommFactory: getScore='+result,'comm');
		return result;
	};
	
	this.setSuspendData = function(suspend_data)
	{
		var result = doSetValue('cmi.suspend_data', suspend_data);
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
		var result = doGetValue('cmi.suspend_data');
		Utils.debug.trace('CommFactory: getSuspendData='+result,'comm');
		return result;
	};
	
	this.setCompleted = function(completionString)
	{
		// For SCORM 2004, can be "completed" only, ignore the argument
		return this.setCompletionStatus('completed');
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
		this.setValue('cmi.interactions.'+id+'.description', stem);
	};
	
	this.setInteractionCorrectResponse = function(id, correct_response)
	{
		this.setValue('cmi.interactions.'+id+'.correct_responses.0.pattern', correct_response);
	};
	
	this.setInteractionStudentResponse = function(id, student_response)
	{
		this.setValue('cmi.interactions.'+id+'.learner_response', student_response);
	};
	
	this.setInteractionResult = function(id, result)
	{
		var resultString = (result) ? 'correct' : 'incorrect';
		this.setValue('cmi.interactions.'+id+'.result', resultString);
	};

	this.setInteractionTime = function(){};

	this.setInteractionTimeStamp = function(id)
	{
		this.interactionTimeStamp = Math.round((new Date()).getTime() / 10);
		var ts = MakeISOtimeStamp(new Date());
		this.setValue('cmi.interactions.'+id+'.timestamp', ts);
	};

	this.setInteractionLatency = function(id)
	{
		var curTime = Math.round((new Date()).getTime() / 10);
		var duration = curTime - this.interactionTimeStamp;
		var timeStamp = centisecsToISODuration(duration);
		this.setValue('cmi.interactions.'+id+'.latency', timeStamp);
	};
	
	this.setSessionTime = function()
	{
		var curTime = Math.round((new Date()).getTime() / 10);
		var duration = curTime - this.startTime;
		var timeStamp = centisecsToISODuration(duration);

		var result = doSetValue('cmi.session_time', timeStamp);
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
	
	// The LMS should set the completion threshold
	this.setCompletionThreshold = function(){return true;};
};
