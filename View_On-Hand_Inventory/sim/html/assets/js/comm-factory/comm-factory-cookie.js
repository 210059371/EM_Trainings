/** 
* Creates cookie-based user data persistence API
* @classDescription This class handles all cookie-based data persistance
* @param {Object} config A param that specifies the class configuration
* @constructor
*/
var CommFactoryCookie = function(config)
{
	this.config = config;
	this._data_elements = null;
	this.__inited__ = false;
	this.matchSep = '.';
	this.groupSep = ',';
	this.interactionTrueString = 't';
	this.interactionFalseString = 'f';
	this.enableManualSubmit = true;
	this.autoRun = true;
	this.username = null;
	this.resultPage = Utils.window.getRootFolder()+"/assets/htm/result.htm";
	this.usernamePromptPage = Utils.window.getRootFolder()+"/assets/htm/usernameprompt.htm";
	this.resultObj = {};	
	//Fix D-08454: set expire at the end of session
	this.studentCookie = new Cookie(document,'StudentName',null,'/', null, true);
	this.API = null;
	this.initOnIndexPage = true;
	this.requireUsername = true;
	this.ready = false;
	this.name = this.config.name;
	this.completeOnThreshold = false;

	/**
	* Initialize the lesson
	* @param {String} A param passed to the function (should be empty)
	* @return {Boolean} Returns true, always...
	* @method
	*/
	this.initialize = function(s)
	{
		this._data_elements = this._unpickle();
		this.__inited__ = true;
		this.studentCookie.load();
		this.username = (this.studentCookie["username"] != "undefined") ? this.studentCookie["username"] : null;
		this.authenticated = (this.studentCookie["authenticated"] === "true");
		this.ready = true;
		return true;
	};

	/**
	* Terminate the lesson
	* @param {String} s A param passed to the function (should be empty)
	* @return {Boolean} Returns true, always...
	* @method
	*/
	this.terminate = function(s)
	{
		this.__inited__ = false;
		return true;
	};

	/**
	* Commit data to the current data solution
	* @param {String} s A param passed to the function (should be empty)
	* @return {Boolean} Returns true, always...
	* @method
	*/
	this.commit = function(s)
	{
		if(!this.__inited__ || (window.engine && window.engine.embedded)) { return false; }

		this._pickle(this._data_elements);
		return true;
	};

	/**
	* Set the value for a specific data element to the current data solution
	* @param {String} data_element A param that specifies the element to get
	* @param {String} value A param that specifies the value to set the element to
	* @return {Boolean} Returns true, always...
	* @method
	*/
	this.setValue = function(data_element, value)
	{
		if(!this.__inited__ || !this._data_elements || !data_element) { return false; }
		
		if(data_element != null)
		{
			this._data_elements[data_element] = value;
		}
		
		return true;
	};

	/**
	* Get the value for a specific data element to the current data solution
	* @param {String} data_element A param that specifies the element to get
	* @return {String} Returns a string value for data_element param
	* @method
	*/
	this.getValue = function(data_element, engine_mode)
	{
		if (!this.__inited__ || !this._data_elements || !data_element) { return ''; }
		
		if (this._data_elements[data_element])
		{
			var commName = null;
			var mode = this.name.split("_");
			if (mode.length == 2){
				commName = parseInt(mode[0]);
			}
			
			if (Conf.BOOKMARK_ENABLED && this.name == Conf.CONTENT_ID){
			return this._data_elements[data_element];
			} else if (Conf.BOOKMARK_ENABLED && commName != null && commName == engine_mode){
				return this._data_elements[data_element];
			} else {
				return '';
		}
			//return this._data_elements[data_element];
		}
		
		return '';
	};

	this.setLocation = function(lesson_location)
	{
		this.setValue('location',lesson_location);
	};
	
	this.getLocation = function(engine_mode)
	{
		return this.getValue('location', engine_mode) || false;
	};
	
	this.setCompletionStatus = function(lesson_status)
	{
		this.setValue('lesson_status',lesson_status);
	};
	
	this.getCompletionStatus = function(engine_mode)
	{
		return this.getValue('lesson_status', engine_mode) || '';
	};
	
	this.setScore = function(score)
	{
		this.setValue('score',score);
	};
	
	this.getScore = function()
	{
		return this.getValue('score');
	};
	
	this.setSuspendData = function(suspend_data)
	{
		this.setValue('suspend_data',suspend_data);
	};
	
	this.getSuspendData = function(engine_mode)
	{
		return this.getValue('suspend_data', engine_mode);
	};
	
	this.setSuccessStatus = function(success_status)
	{
		return true;
	};
	
	this.getSuccessStatus = function(success_status)
	{
		return false;
	};
	
	this.setCompleted = function(completionString)
	{
		// Can be either "completed" or "passed"
		return this.setCompletionStatus(completionString);
	};

	/**
	* Pickle the data elements and shove them into a cookie
	* @param {Object} obj A param that specifies the data_elements object
	* @method
	*/
	this._pickle = function(obj)
	{
		// "objcookie.js" (Cookie<->Object class) utilized
		var pickle = new Cookie(document,this.config.name,this.config.lifetime,'/');
		for (var o in obj)
		{
			pickle[o] = obj[o];
		}
		pickle.store();
	};

	/**
	* Unpickle the data elements from the cookie
	* @return {Object} Returns an object containing the data elements
	* @method
	*/
	this._unpickle = function()
	{
		// "objcookie.js" (Cookie<->Object class) utilized
		var pickle = new Cookie(document,this.config.name,this.config.lifetime,'/');
		pickle.load();
		var obj = new Object();
		for (var o in pickle)
		{
			if ((o.charAt(0) != '$') && ((typeof pickle[o]) != 'function')) { obj[o] = pickle[o]; }
		}
		return obj;
	};
	
	this.sendResults = function(o)
	{
		Utils.debug.trace('CommFactoryCookie: sendResults');
		/* Object "o" argument includes:
		 * 
		 * o.score
		 * o.passed
		 * o.totalToInclude
		 * o.totalIncorrect
		 * o.incNumberList
		 * 
		 */
		
		o.lessonName = (Conf.INCLUDE_DOCUMENT_NAME) ? unescape(engine.simTitle) : '' ;
		o.score = (Conf.INCLUDE_GRADE) ? o.score : '';
		o.totalIncorrect = (Conf.INCLUDE_NUMBER_OF_INCORRECT_STEPS) ? o.totalIncorrect : '';
		o.totalToInclude = (Conf.INCLUDE_NUMBER_OF_TOTAL_STEPS) ? o.totalToInclude : '';
		o.incNumberList = (Conf.INCLUDE_WHICH_STEPS_INCORRECT) ? o.incNumberList : '';
		
		o.assessmentURI		= Conf.ASSESSMENT_URI;
		o.studentName		= this.getStudentName();
		o.submitText		= unescape(Lang.UI_SUBMIT);
		o.promptText		= unescape(Lang.ENTER_USER_NAME);
		o.cancelText		= 'X';

		this.resultObj = o;

		Utils.debug.trace('CommFactoryCookie: lessonName='+o.lessonName);
		Utils.debug.trace('CommFactoryCookie: score='+o.score);
		Utils.debug.trace('CommFactoryCookie: totalIncorrect='+o.totalIncorrect);
		Utils.debug.trace('CommFactoryCookie: totalToInclude='+o.totalToInclude);
		Utils.debug.trace('CommFactoryCookie: incNumberList='+o.incNumberList);
		Utils.debug.trace('CommFactoryCookie: assessmentURI='+Conf.ASSESSMENT_URI);
		Utils.debug.trace('CommFactoryCookie: studentName='+o.studentName);

		// Check the length of the username value
		if(this.username && this.username != "undefined")
		{
			if(this.username.length > 0)
			{
				// If greater than 0, post results
				this.postResult();
			}
			else
			{
				// Username must not exist, prompt for it
				this.promptForUserName();
			}
		}
		else
		{
			// Username must not exist, prompt for it
			this.promptForUserName();
		}
	};
	
	this.promptForUserName = function()
	{
		// If template enforces display of username prompt AND the user has NOT been authenticated, prompt for username
		if(Conf.DISPLAY_USERNAME_PROMPT && !this.authenticated)
		{
			Utils.debug.trace('CommFactoryCookie: Not authenticated - Prompting for username');
			this.promptForUserNameWin = Utils.window.open(this.usernamePromptPage,'promptForUserNameWin',640,480,'resizable');
		}
		else
		{
			// Check the length of the username value
			if(this.username && this.username != "undefined")
			{
				this.setStudentName(this.username);
			}
			else
			{
				Utils.debug.trace('CommFactoryCookie: Authenticated, but no username - Prompting for username');
				this.promptForUserNameWin = Utils.window.open(this.usernamePromptPage,'promptForUserNameWin',640,480,'resizable');
			}
		}
	};
	
	this.setStudentName = function(name)
	{
		// If they entered a student name in the user prompt window, no cookie existed previous to launchinng, set it now.
		if(!this.username || this.username == "undefined")
		{
			this.storeStudentName(name);
			this.resultObj.studentName = name;
		}
		
		if(this.promptForUserNameWin && !this.promptForUserNameWin.closed)
		{
			this.promptForUserNameWin.close();
		}
	
		this.postResult();
	};
	
	this.postResult = function()
	{
		this.resultObj.incNumberList = this.resultObj.incNumberList.split(', ').join(',');
		this.resultObj.status = (this.resultObj.passed) ? 'PASS' : 'FAIL';
		
		var resultsWin =  window.open(this.resultPage,'resultsWin');
		if(!resultsWin)
		{
			Utils.debug.trace(unescape(Lang.ASSESSMENT_ERROR_POSTING_RESULTS),'error');
			alert(unescape(Lang.ASSESSMENT_ERROR_POSTING_RESULTS));
		}

		setTimeout("engine.exit();",6000);
	};

	this.storeStudentName = function(name)
	{
		this.studentCookie['username'] = name;
		this.username = name;
		this.studentCookie.store();
	};

	this.getStudentName = function()
	{
		this.studentCookie.load();
		this.username = (this.studentCookie["username"] != "undefined") ? this.studentCookie["username"] : null;
		return this.username;	
	};

	this.getDataElementsObj = function()
	{
		return JSON.encode({"_data_elements":this._data_elements});
	};
	
	this.LMSGetErrorString = function() { return 'No Error'; };
	this.LMSGetDiagnostic = function() { return 'The previous LMS API Function call completed successfully.'; };
	this.LMSGetLastError = function() { return 0; };
	
	// All interactions data is disregarded due to being read-only in the spec
	// and causing severe cookie-bloat
	this.setInteractionId = function(id, name){return true;};
	this.setInteractionType = function(id, type){return true;};
	this.setInteractionDescription = function(id, stem){return true;};
	this.setInteractionCorrectResponse = function(id, correct_response){return true;};
	this.setInteractionStudentResponse = function(id, student_response){return true;};
	this.setInteractionResult = function(id,result){return true;};	
	this.setInteractionTime = function(id){return true;};
	this.setInteractionTimeStamp = function(id){return true;};
	this.setInteractionLatency = function(id){return true;};
	
	// Do not store session time in cookie
	this.setSessionTime = function(){return true;};
	
	// applicable to SCORM/uPerform server
	this.setProgressStatus = function(percent_complete){return true;};
	this.getProgressStatus = function(){return false;};
	this.setCompletionThreshold = function(){return true;};
	this.getCompletionThreshold = function(){return false;};
	this.setSimMode = function(simulation_mode){return true;};
	this.getSimMode = function(){return false;};
};
