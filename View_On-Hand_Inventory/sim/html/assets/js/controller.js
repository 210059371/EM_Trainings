/**
 * Class defining the navigation/interface control layer used by the engine
 * @requires Engine
 * @requires Utils
 * @requires MooTools
 */
function Controller()
{
    this.currentStepObj = null;
    this.currentStepIndex = 0;
    this.steps = [];
    this.stepTotal = 0;
	this.groups = [];
    this.navEnabled = true;
    this.audioEnabled = true;
	this.suspendDataObj = {};
	this.suspendDataObj.simState = null;
	this.isMuted = false;
	this.completeOnAllStepsVisited = true;
	this.prevCursorLocation = {x:0,y:0};
	this.passed = false;
	this.resultsObj = null;
	this.playbackPaused = false;
	this.timerControl = new TimerControl(this);
	this.initialized = false;
	this.completionThreshold = -1;
	this.pauseCookieChecker = true;
	this.completionStrings = {
		'completed':Conf.COMPLETION_STRING.split('_')[0],
		'incomplete':Conf.COMPLETION_STRING.split('_')[1]
	};
    /**
     * Initialize the navigation control layer
     * @method initialize
     */
    this.initialize = function()
    {		
        this.stepTotal = this.getStepTotal();

		this.setInfoStepProperties();
		this.setStepInteractionIndexes();

		// Should the sim be marked completed once all steps have been viewed?
		this.completeOnAllStepsVisited = ((engine.mode == engine.MODES.STANDARD.value || engine.mode == engine.MODES.AUTO_PLAYBACK.value)? true : false);
		
		// Set the default status of this lesson if this is the user's first entry
		var status = engine.comm.getCompletionStatus(engine.mode);
		
		if(status.toLowerCase().charAt(0) == 'n' || 
			status.toLowerCase().charAt(0) == 'u' || 
			status == 'undefined' || 
			status == null || 
			status == '' || 
			status == 'null')
		{
			var success = engine.comm.setCompletionStatus('incomplete');
		}
		
		// Reset the sim step status/states based on the persisted Comm object data
		var suspend_data = engine.comm.getSuspendData(engine.mode);
		if(suspend_data != null && suspend_data != 'null' && suspend_data != '')
		{
			// Parse the suspend_data into a native JS object to manipulate during this session 
			this.suspendDataObj = JSON.decode(suspend_data);
			
			// If this sim's step total is the same length as the persisted simState,
			// no change has been made to the structure since the previous session.
			// If any changes have been made, we cannot ensure a safe reset of the sim.
			var state = Utils.string.decodeState(this.suspendDataObj.simState);
			if(this.stepTotal == state.length)
			{
				if(this.suspendDataObj.simState)
				{
					this.resetSimState(state);
				}
			}
		}
		else
		{
			this.suspendDataObj = {};
		}
        
        // Do checks for existing lesson location data, setting a default, "just in case".
		var stepId = this.steps[0].id;
		
		try
		{
			this.startStep = engine.searchparams['uperform_startstep'];
		}
		catch(e){}

        // If the sim has been passed a startStep param, try to use it
        if(this.startStep)
		{
			// If the startStep param is valid, use it.  Otherwise, the default is the root.
            var stepId = (this.getStepById(this.startStep)) ? this.startStep : this.steps[0].id;
			this.gotoStepById(stepId, '');
        }
        else 
        {
			if(engine.mode == engine.MODES.STANDARD.value || engine.mode == engine.MODES.AUTO_PLAYBACK.value)
			{
				this.validateThreshold();
				
				// If the Comm object can return a starting step name, prompt the user to use it.  Otherwise, the default is the root.
				var stepObj = null;
				if(engine.primaryCsh == null || engine.primaryCsh == "")
				{
					var loc = engine.comm.getLocation(engine.mode);
					// If the location is valid, and it isn't the root, prompt the user.  Otherwise, the default is the root.
					stepObj = this.getStepById(loc);
				}
				else
				{
					//Search the first step ID which contains searching CSH.
					stepObj = this.getStepByCsh(engine.primaryCsh, engine.secondaryCsh == null ? "" : engine.secondaryCsh, engine.tertiaryCsh == null ? "" : engine.tertiaryCsh, engine.application);
				}
				
				if(stepObj && (stepObj != this.steps[0]) && (stepObj != this.getLastStep()))
				{
					if(engine.primaryCsh != null && engine.primaryCsh != "")
					{
						engine.controller.gotoStepById(stepObj.id, '');
					}
					else
					{
						// Fix the step title we read in to ensure we can write it into the prompt without issue.
						var patchedPrompt = Lang.BOOKMARK_TEXT.replace(/%s/g,stepObj.stepNumber);
						
						var o={};
						o.scope = this;
						o.label = unescape(Lang.BOOKMARK);
						o.txt = '<p>'+unescape(patchedPrompt)+'</p>';
						o.onOk = function(){
							engine.controller.gotoStepById(stepObj.id, '');
						};
						o.onCancel=function(){
							engine.controller.gotoStepById(stepId, '');
						};
						engine.dialog.confirm(o);
					}
				}
				else
				{
					// Default to the first step
					this.gotoStepById(stepId, '');
				}
			}
			else
			{
				// Default to the first step
				this.gotoStepById(stepId, '');
			}
        }

		if(engine.mode != engine.MODES.AUTO_PLAYBACK.value)
		{
			if(!Utils.browserDetection.isMobile())
			{
				$('mouseCatcher').addEvent('mousedown',EventHandler.click);
			}
			else
			{
				EventHandler.createMouseListener($("mouseCatcher"),1);
			}
		}

		EventHandler.createKeyListeners();
		if(window.parent != undefined && !((window.parent.location.protocol).contains("file")) && (window.parent.location.href).contains('ucontent'))
		{
			console.log('Running From uPServer');
			this.pauseCookieChecker = false;
			setInterval(function(){this.checkCookie;},100);
		}
		else
		{
			console.log('Not running from uPServer');
			this.pauseCookieChecker = true;
		}
		engine.ui.fadeOutLoadingMessage();
    };
	
	this.checkCookie = function()
	{		
		if(this.pauseCookieChecker)
		{
			return;
		}
		var theCookie = document.cookie;
		var theResponse = "";
		if(!theCookie.contains("uPerformInfoToken"))
		{	
			console.log('No cookie found.');
			this.pauseAutoPlayback();
			this.pauseCookieChecker = true;
			var xhttp = new XMLHttpRequest();
			xhttpError = false;
			xhttp.open("GET","/gm/?",false);
			try
			{
				xhttp.send();				
				theResponse = xhttp.reponseText;
				xhttpError = false;
			}
			catch(err)
			{
				xhttpError = true;
				this.openCookieRefreshWindow();
			}

			
			if(xhttpError == false && theResponse.contains("SAMLResponse"))
			{					
				postLocationStart = theResponse.indexOf('action="') + 8;
				postLocationEnd = theResponse.indexOf('"',postLocationStart);
				postLocation = theResponse.substring(postLocationStart,postLocationEnd);
				//Make sure this is the response intended for uPerform
				if(postLocation.contains('/gm/consume'))
				{
					ResponseInputPosition = theResponse.indexOf('<input');
					ResponseNamePosition = theResponse.indexOf('name',ResponseInputPosition);
					ResponsePositionElement = theResponse.substring(ResponseInputPosition,ResponseNamePosition + 21);
					ResponseInputPosition2 = theResponse.indexOf('<input',ResponseNamePosition);
					ResponseNamePosition2 = theResponse.indexOf('name',ResponseInputPosition2);
					ResponsePositionElement2 = theResponse.substring(ResponseInputPosition2,ResponseNamePosition2 + 21);				
					if(ResponsePositionElement.contains('SAMLRes'))
					{
						SAMLResponseStart = theResponse.indexOf('value',ResponseInputPosition) + 7;
						SAMLResponseEnd = theResponse.indexOf('"',SAMLResponseStart);
						tempSAMLResponse = theResponse.substring(SAMLResponseStart,SAMLResponseEnd);
						SAMLResponse = tempSAMLResponse.replace(/\+/gi,'%2B')
					}
					else
					{
						RelayStateStart = theResponse.indexOf('value',ResponseInputPosition) + 7;
						RelayStateEnd = theResponse.indexOf('"',RelayStateStart);
						RelayState = theResponse.substring(RelayStateStart,RelayStateEnd);
					}					
					if(ResponsePositionElement2.contains('SAMLRes'))
					{
						SAMLResponseStart = theResponse.indexOf('value',ResponseInputPosition2) + 7;
						SAMLResponseEnd = theResponse.indexOf('"',SAMLResponseStart);
						tempSAMLResponse = theResponse.substring(SAMLResponseStart,SAMLResponseEnd);
						SAMLResponse = tempSAMLResponse.replace(/\+/gi,'%2B')
					}
					else
					{
						RelayStateStart = theResponse.indexOf('value',ResponseInputPosition2) + 7;
						RelayStateEnd = theResponse.indexOf('"',RelayStateStart);
						RelayState = theResponse.substring(RelayStateStart,RelayStateEnd);
					}
					samlFormData = 'SAMLResponse=' + SAMLResponse + '&RelayState=' + RelayState;			
					xhttp.open("POST", postLocation,false);
					xhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
					xhttp.setRequestHeader("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8");
					xhttp.setRequestHeader("Upgrade-Insecure-Requests", "1");
					xhttp.setRequestHeader("Cache-Control","max-age=0");
					xhttp.send(samlFormData);
					if (xhttp.readyState == 4 && xhttp.status == 200) 
					{
						this.pauseCookieChecker = false;
						this.resumeAutoPlayback();					
					}						
				}
				else
				{
					console.log('I see a SAML response, but it is not for uPerform.')							
					this.openCookieRefreshWindow();
				}				
			}
			else
			{
				if(xhttpError == true)
				{
					this.openCookieRefreshWindow();
				}
				else
				{
					alert('Session Expired. Upon closing this message, a new login window will appear. After logging in, press the play button to resume playback.');
					idpWindow = window.open('/gm/?','Login Required','width=1024,height=768');
				}
			}	
		}		
	};
	
	this.openCookieRefreshWindow = function()
	{
		console.log('Open Refresh fired');
		authWindow = window.open('/gm/','CookieRefresh','width=100,height=100');
		theTimer = setTimeout(function(){this.closeCookieRefreshWindow;},3000);	
	};
	
	this.closeCookieRefreshWindow = function()
	{
		//Windows doesn't acutally close.
		clearTimeout(theTimer);
		this.pauseCookieChecker = false;
		window.parent.focus();
		this.resumeAutoPlayback();
	};
	
	this.addGroup = function(o)
	{
		o.index = this.groups.length;
		this.groups.push(o);
	};

	this.getStepTotal = function()
	{
		return this.steps.length;
	};

	this.hasAudio = function()
	{
		var hasAudio = false;
		this.steps.each(function(item,index){
			if((item.audio !== "") && (item.audio != null))
			{
				hasAudio = true;
			}
		});
		return hasAudio;
	};

	this.hasFlashAudio = function()
	{
		var hasFlashAudio = false;
		this.steps.each(function(item,index){
			if((item.audio !== "") && (item.audio != null))
			{
				var ext = item.audio.substring(item.audio.lastIndexOf(".")+1).toLowerCase();
				if(ext == "swf")
				{
					if(Utils.browserDetection.isMobile())
					{
						item.audio = null;
					}
					hasFlashAudio = true;
				}
			}
		});
		return hasFlashAudio;
	};

	this.setInfoStepProperties = function()
	{
		this.steps.each(function(item,index){
			item.isInfoStep = (!item.hasActions() && (item != this.steps.getLast()));
		},this);
	};

	this.setStepInteractionIndexes = function()
	{
		var idx = 0;
		this.steps.each(function(item,index){
			if(!item.isInfoStep && item.assess)
			{
				item.interactionIndex = idx;
				idx++;
			}
		},this);
	};

	this.next = function()
	{
		if(this.currentStepIndex < (this.steps.length - 1)) 
        {
			var nextStepName = this.steps[this.currentStepIndex + 1].id;
            this.gotoStepById(nextStepName, 'next');
        }
	};
		
	this.back = function()
	{
		if(this.currentStepIndex > 0) 
        {
			var prevStepName = this.steps[this.currentStepIndex - 1].id;
            this.gotoStepById(prevStepName, 'prev');
        }
	};
    
    this.gotoStepById = function(stepId, prevOrNext)
    {
		this.checkCookie();
        if(!this.navEnabled) 
        {
            Utils.debug.trace('Navigation is currently disabled - Returning...');
            return;
        }

		EventHandler.disable();
		this.disableNav();

		if (this.currentStepObj)
        {
            this.currentStepObj.stopNotes();
            this.currentStepObj.resetNotes();
        }
		this.timerControl.reset();
		engine.animator.cancelAnimations();

		// Hide the audio loading image, as a user may have moved on before the audio finished loading
		if(engine.mode == engine.MODES.STANDARD.value || engine.mode == engine.MODES.AUTO_PLAYBACK.value)
		{
			$('audioLoading').hide();

			if(this.currentStepObj) 
			{
				this.audioStop();
				this.audioReset();
				this.disableAudio();
			}
		}
		else
		{
			$('footer').hide();
		}
        
        var step = this.getStepById(stepId);
        if(step)
        {
            Utils.debug.trace('Moving to step: ' + step.id);

			this.resetStepContentContainers();

			this.autoPlaybackTime = (step.autoPlaybackTime) ? step.autoPlaybackTime : 1500 ;
			
			// Set the current step index/object properties
            this.setCurrentStepIndex(step.index);
            this.setCurrentStepObj(step);
			
            // Reset all steps' "here" status
            this.resetstepsStatus();
            
            // Set the current step
            step.setAsCurrentStep();
			
			if(engine.mode == engine.MODES.STANDARD.value || engine.mode == engine.MODES.AUTO_PLAYBACK.value)
			{
				if(!this.initialized)
		        {
		        	engine.ui.onControllerInit();
		        	this.initialized = true;
		        }
				
				this.setStatus(stepId);
			}
			   
			if (document.activeElement){
				if (document.activeElement.tagName == "A" || document.activeElement.tagName == "a") {
	                var curElement = document.activeElement;
	            }
			}
			// Commit the Comm object data
			engine.comm.commit();
            
            // Fire the step navigation UI handler
            engine.ui.onGoToStep();
            
            // load swap image
            var swapImage = $('swapImage');
			if (typeof curElement != 'undefined') {
                curElement.focus();
            }
            if (!swapImage) {
	            var nextStepId = 0;
	            if(this.canMoveNext()){
	            	nextStepId = this.steps[this.currentStepIndex + 1].id;
	            	this.loadSwapImage(nextStepId);
	            }
	            step.initialize(); 
            } else {
            	step.swap();
            	if (prevOrNext == 'prev' || prevOrNext == 'next') {
                	this.loadSwapImage(this.steps[this.currentStepIndex].id);
                } else {
                	if (!this.steps.getLast()){
    	            	nextStepId = this.steps[this.currentStepIndex + 1].id;
    	            	this.loadSwapImage(nextStepId);
    	            }
                }
            }
        }
        else 
        {
            Utils.debug.trace('Error: Cannot locate step object named: ' + stepId);
            this.gotoNextAvailableStep(this.currentStepIndex);
        }
        
        if (Conf.ENABLE_DEBUGGER) 
        {
            Utils.debug.refresh();
        }
    };

    this.gotoNextAvailableStep = function(idx)
    {
    	this.enableNav();

    	var nextIdx = idx+1;
    	if(nextIdx >= this.totalSteps)
    	{
	    	return;
	    }

    	var nextStep = this.steps[nextIdx];
    	if(nextStep)
    	{
    		Utils.debug.trace('Going to next available step: '+nextIdx);
    		this.gotoStepByIndex(nextIdx);
    	}
    	else
    	{
    		this.gotoNextAvailableStep(nextIdx+1);
    	}
    };

	this.gotoStepByIndex = function(stepIndex)
	{
		this.gotoStepById(this.steps[stepIndex].id, '');
	};

    this.resetstepsStatus = function()
    {
		this.steps.each(function(item,index){
			item.here = false;
		});
    };
    
    this.getStepById = function(stepId)
    {
        for (var i = 0; i < this.steps.length; i++) 
        {
            if (this.steps[i].id == stepId) 
            {
                return this.steps[i];
            }
        }
        return false;
    };
	
	this.getStepByCsh = function(primaryCsh, seconaryCsh, tertiaryCsh, application)
	{
		var pSearchTempData = { partialMatchElement: null, partialMatchLength: 0 };
		
		for (var iStep = 0; iStep < this.steps.length; iStep ++)
		{
			var step = this.steps[iStep];
			if(step.getActionByCsh(primaryCsh, seconaryCsh, tertiaryCsh, application, pSearchTempData) != null && pSearchTempData.partialMatchElement == null)
			{//FULL MATCH
				return step;
			}
		}
		
		//PARTIAL MATCH, return first partial match
		return pSearchTempData.partialMatchElement;
	};

	this.getLastStep = function()
	{
		return this.steps[this.stepTotal-1];
	};

	this.setStatus = function(stepId)
	{
		var step;
		if (stepId != undefined || stepId != null){
			step = this.getStepById(stepId);
			Utils.debug.trace('Step ' + stepId);
		} else {
			step = this.getStepById(this.currentStepObj.id);
			Utils.debug.trace('Step' + this.currentStepObj.id);
		}
	    if(step)
	    {
			// Set the simState property of the suspendDataObj
			this.setSimState();
				
			// Persist suspendDataObj as a JSON string in the Comm object
			this.setSuspendData();
				
			engine.comm.setLocation(stepId);
				
			this.setProgressStatus();
	
			// Check if the Comm object in use automatically sets completion
			// when all steps have been viewed
			this.checkForCompletion();
	    }
	};
	
	this.validateThreshold = function()
	{
		if (engine.comm.completeOnThreshold){
			this.completionThreshold = engine.comm.getCompletionThreshold();
			
			if (this.completionThreshold == '' || this.completionThreshold == -1){
				if (Conf.SCORM_COMPLETION_THRESHOLD && !isNaN(Conf.SCORM_COMPLETION_THRESHOLD))
				{
					if (Conf.SCORM_COMPLETION_THRESHOLD > 1) {
						// completion threshold cannot be greater than 1
						this.completionThreshold = 1;
					} else if (Conf.SCORM_COMPLETION_THRESHOLD < 0) {
						// completion threshold cannot be less than 0
						this.completionThreshold = 0;
					} else {
						this.completionThreshold = (Math.round((Conf.SCORM_COMPLETION_THRESHOLD)*100))/100;
					}
					engine.comm.setCompletionThreshold(this.completionThreshold);
				}	
			}
		}
	};
	
	/**
	* Clear all canvas, image, and div elements contained within the step container
	* @method resetStepContentContainers
	*/
	this.resetStepContentContainers = function()
	{
		try
		{
			$('stepActionHandlers').getChildren().destroy();
			$('stepActionHandlers').empty();
			$('stepTooltips').getChildren().destroy();
			$('stepTooltips').empty();
			$('stepNoteImages').getChildren().destroy();
			$('stepNoteImages').empty();
			$('stepNotes').getChildren().destroy();
			$('stepNotes').empty();
			$('stepActionComposite').getChildren().destroy();
			$('stepActionComposite').empty();
			engine.toolTips.detach($$('.mootips'));

			if(engine.mode == engine.MODES.STANDARD.value || engine.mode == engine.MODES.AUTO_PLAYBACK.value)
			{
				$('stepBar').getChildren().destroy();
				$('stepBar').empty();
			}
		}
		catch(e)
		{
			Utils.debug.trace('Error resetting step containers: '+e.description || e,'error');
		}
	};

	this.cleanup = function()
	{
		this.resetStepContentContainers();
		$('stepImageOverlays').getChildren().destroy();
		$('stepImageOverlays').empty();
		var overlayCont = $('overlayCont');
		if (overlayCont){
			$('overlayCont').getChildren().destroy();
			$('overlayCont').empty();
		}
		this.steps.each(function(item){
			if (item.hasNotes()){
				this.notes.each(function(item){
					item.timerControl = null;
				},this);
			item = null;
			}
		},this);
		this.steps = null;
	};
	
	this.checkForCompletion = function()
	{
		if(this.completeOnAllStepsVisited)
		{
			// Set completion status to completed
			if(this.areAllStepsVisited())
			{
				Utils.debug.trace('In check for completion: All steps have been visited (and completeOnAllStepsVisited = true), sending completion...');
				engine.comm.setCompleted(this.completionStrings.completed);
			} else {
				if (this.meetsCompletionThreshold()){
					engine.comm.setCompleted(this.completionStrings.completed);
				}
			}
		}
	};
    
    this.disableNav = function()
    {
        this.navEnabled = false;
    };
	
	this.disableNavButtons = function()
	{
		$('nextBtn').setStyle('opacity', 0.30);
		$('backBtn').setStyle('opacity', 0.30);
		$('menuBtn').setStyle('opacity', 0.30);
	};
    
    this.enableNav = function()
    {
        this.navEnabled = true;
    };
	
	this.enableNavButtons = function()
	{
		$('nextBtn').setStyle('opacity', 1);
		$('backBtn').setStyle('opacity', 1);
		$('menuBtn').setStyle('opacity', 1);
	};
    
    this.setCurrentStepObj = function(stepObj)
    {
        this.currentStepObj = stepObj;
    };
    
    this.setCurrentStepIndex = function(stepIndex)
    {
        this.currentStepIndex = stepIndex;
    };
    
    this.checkNavState = function()
    {
		this.enableNav();
		
        if(this.canMoveNext()) 
        {
			$('nextBtn').setStyle('opacity', 1);
			Utils.dom.removeFilter($('nextBtn'));
			engine.ui.resetTabIndex($("nextBtn"));
			engine.ui.patchTitleOn($("nextBtn"));
        }
        else 
        {
			$('nextBtn').setStyle('opacity', 0.30);
			engine.ui.patchTitleOff($("nextBtn"));
        }
        
        if (this.canMoveBack()) 
        {
			$('backBtn').setStyle('opacity', 1);
			Utils.dom.removeFilter($('backBtn'));
			engine.ui.resetTabIndex($("backBtn"));
			engine.ui.patchTitleOn($("backBtn"));
        }
        else 
        {
			$('backBtn').setStyle('opacity', 0.30);
			 engine.ui.patchTitleOff($("backBtn"));
        }
    };
	
	this.canMoveNext = function()
	{
		return this.currentStepObj != this.steps.getLast();
	};
	
	this.canMoveBack = function()
	{
		return this.currentStepObj != this.steps[0];
	};
    
    this.hideAudioControls = function()
    {
        engine.ui.hideAudioControls();
    };
    
    this.loadAudio = function(file)
    {
		// If the sim is muted, return...
		if(this.isMuted){return;}

        if((this.currentStepObj.audio || file) && (Conf.AUDIO_TYPE != null)) 
        {
            this.enableAudio();

			this.audioStop();
			
			var audioFile = (file) ? file : this.currentStepObj.audio;
			engine.audio.load(engine.audioPath + audioFile);
        }
        else 
        {
            this.disableAudio();
        }
    };
	
	this.audioToggleEnabled = function()
	{
		this.isMuted = !this.isMuted;
		if(this.isMuted)
		{
			$('audioLabel').set('text',unescape(Lang.UI_LABEL_AUDIO_DISABLED));
			this.audioStop();
			this.disableAudio();
			$('audioDisableBtn').hide();
        	$('audioEnableBtn').show();
        	$('audioEnableBtn').getElements('a')[0].focus();
		}
		else
		{
			$('audioLabel').set('text',unescape(Lang.UI_LABEL_AUDIO_ENABLED));
			this.loadAudio();
			$('audioDisableBtn').show();
			$('audioDisableBtn').getElements('a')[0].focus();
        	$('audioEnableBtn').hide();
		}
		engine.ui.updateLayout();
	};
    
    this.disableAudio = function()
    {
        this.audioEnabled = false;
        engine.audio.remove();
		if(engine.mode == engine.MODES.STANDARD.value)
		{
			$('audioPauseBtn').hide();
			$('audioPlayBtn').show();
			$('audioStopBtn').setStyle('opacity', 0.30);
			$('audioPlayBtn').setStyle('opacity', 0.30);
		}
		if(engine.ui.iosAudioPromptOpen)
    	{
    		$('audioLoading').hide();

    		if(!engine.ui.animationStarted)
    		{
    			this.currentStepObj.renderComposite();
    		}

    		engine.ui.hideEnablePlaybackPrompt();
    	}
    };
    
    this.enableAudio = function()
    {
        this.audioEnabled = true;
    };
    
    this.audioTogglePlay = function()
    {
        if(!this.audioEnabled) 
        {
            return;
        }

        engine.ui.hideEnablePlaybackPrompt();
        
        if(engine.audio.isPlaying) 
        {
            engine.audio.pause();
			if(engine.mode == engine.MODES.STANDARD.value)
			{
				$('audioPauseBtn').hide();
				$('audioPlayBtn').show();
				$('audioStopBtn').setStyle('opacity', 1);
				$('audioPlayBtn').setStyle('opacity', 1);
			}
        }
        else 
        {
            engine.audio.play();
            this.onAudioStart();
        }
    };
    
    this.audioStop = function()
    {
        if(!this.audioEnabled) 
        {
            return;
        }
        
        engine.audio.stop();
        this.resetAudioControls();
    };

	this.audioReset = function()
	{
		if (!this.audioEnabled) 
        {
            return;
        }

		if(engine.mode == engine.MODES.STANDARD.value)
		{
			$('audioStopBtn').setStyle('opacity', 0.30);
			$('audioPlayBtn').setStyle('opacity', 0.30);
		}

		engine.audio.reset();
        this.resetAudioControls();
	};
    
    this.onAudioStart = function()
    {
		if(engine.mode == engine.MODES.STANDARD.value)
		{
			$('audioPauseBtn').show();
			$('audioPlayBtn').hide();
			$('audioStopBtn').setStyle('opacity', 1);
		}
		this.currentStepObj.onAudioStart();
    };

	this.onAudioLoad = function()
	{
		if(engine.mode == engine.MODES.STANDARD.value)
		{
			$('audioStopBtn').setStyle('opacity', 1);
			$('audioPlayBtn').setStyle('opacity', 1);
		}
		$('audioLoading').hide();
		this.currentStepObj.onAudioLoad();
	};
    
    this.onAudioComplete = function()
    {
    	this.resetAudioControls();
		this.currentStepObj.onAudioComplete();
    };

    this.resetAudioControls = function()
    {
    	if(engine.mode == engine.MODES.STANDARD.value)
		{
			$('audioPauseBtn').hide();
			$('audioPlayBtn').show();
			$('audioStopBtn').setStyle('opacity', 0.30);
			$('audioPlayBtn').setStyle('opacity', 1);
		}
    };

	this.startTimer = function()
	{
		if(this.playbackPaused){return;}

        this.timerControl.start({
			duration:this.autoPlaybackTime,
			interval:100,
			onCompletedCb:function(){
				this.onTimerCompleted();
			},
			onIntervalCb:function(elapsed,remaining){
				this.onTimerInterval(elapsed,remaining);
			}
		});
	};

	this.toggleAutoPlayback = function()
	{
		if(this.playbackPaused)
		{
			this.resumeAutoPlayback();
		}
		else
		{
			this.pauseAutoPlayback();
		}
	};

	this.resumeAutoPlayback = function()
	{
		if(!this.playbackPaused){return;}

		this.playbackPaused = false;
		$('playbackPauseBtn').show();
		$('playbackPauseBtn').getElements('a')[0].focus();
		$('playbackPlayBtn').hide();

		if(this.timerControl.hasStarted())
		{
			this.timerControl.resume();
			this.currentStepObj.resumeNotes();
		}
		else
		{
			this.currentStepObj.initPlayback();
			return;
		}		

		if(!this.timerControl.isActive())
		{
			if(engine.animator.started && engine.animator.paused)
			{
				engine.animator.resume();
			}
			else
			{
				this.currentStepObj.startAnimations();
			}
		}

		if(this.hasAudio() && !this.isMuted && !this.currentStepObj.audioCompleted)
		{
			if(!engine.audio.isPlaying && this.currentStepObj.hasAudio())
			{
				engine.audio.play();
			}
		}
	};

	this.pauseAutoPlayback = function()
	{
		if(this.playbackPaused){return;}

		this.playbackPaused = true;		
		$('playbackPlayBtn').show();
		$('playbackPlayBtn').getElements('a')[0].focus();
		$('playbackPauseBtn').hide();
		this.timerControl.pause();
		this.currentStepObj.pauseNotes();

		if(!this.timerControl.isActive())
		{
			if(engine.animator.started && !engine.animator.paused)
			{
				engine.animator.pause();
			}
		}

		if(this.hasAudio() && !this.isMuted)
		{
			if(engine.audio.isPlaying && this.currentStepObj.hasAudio()) 
			{
				engine.audio.pause();
			}
		}
	};

	this.onTimerCompleted = function()
	{
		if(!this.canMoveNext() || this.currentStepObj.animationComplete ||
			(this.currentStepObj.isInfoStep && !this.currentStepObj.hasNotes())){
		this.currentStepObj.onTimerDone();
		}
	};

	this.onTimerInterval = function(elapsed,remaining)
	{
		if(engine.mode == engine.MODES.STANDARD.value || engine.mode == engine.MODES.AUTO_PLAYBACK.value)
		{
			engine.ui.updateDuration(this.autoPlaybackTime,elapsed,remaining);
		}
	};

	// controller loads swap image
	this.loadSwapImage = function(stepName)
	{
		// get current image
		var step = this.getStepById(stepName);
        step.renderSwapImage();
	};
	
	
	this.advance = function()
	{
		this.checkCookie();
		if(engine.mode == engine.MODES.AUTO_PLAYBACK.value)
		{
			this.timerControl.stop();
			if (this.playbackPaused) {
				return;
			}
		}

		/* Close any tool-tips before advancing to the next step. */
		var tooltips = $$('.tip-wrap');
		for (var i=0; i<tooltips.length; i++) {
			tooltips[i].hide();
		}

		if(this.currentStepObj.hasActions())
		{
			var route = this.currentStepObj.getActiveAction().route || this.currentStepObj.getDefaultAction().route;
			if(route)
			{
				this.gotoStepById(route, 'next');
			}
			else
			{
				if(this.canMoveNext())
				{
					this.next();
				}
				else
				{
					Utils.debug.trace('Cannot advance, ending sim...');
					this.endSim();
				}
			}
		}
		else
		{
			if(this.canMoveNext())
			{
				this.next();
			}
			else
			{
				Utils.debug.trace('Cannot advance, ending sim...');
				this.endSim();
			}
		}
	};

	this.onActionCorrect = function()
	{
		EventHandler.disable();
		this.advance();
	};

	this.onActionIncorrect = function()
	{
		if(engine.mode == engine.MODES.SELF_TEST.value || engine.mode == engine.MODES.ASSESSMENT.value)
		{
			EventHandler.disable();
			this.currentStepObj.disable();
			this.showPromptForHelp();
		}
	};

	this.showPromptForHelp = function()
	{
		var o={};
		o.scope = this;
		o.label = unescape(engine.modeObj.name);
		o.txt = '<p>'+unescape(this.currentStepObj.helpText)+'</p>';
		o.onOk = function(){
			this.showHelp();
		};
		o.onCancel=function(){
			this.refuseHelp();
		};
		engine.dialog.confirm(o);
	};

	this.refuseHelp = function()
	{
		EventHandler.enable();
		engine.dialog.kill(true);
		this.currentStepObj.enable();
	};

	this.showHelp = function()
	{
		EventHandler.enable();

		if(this.currentStepObj.helpShown)
		{
			this.currentStepObj.renderComposite();
		}
		else
		{
			this.currentStepObj.renderHelpNotes();
			this.currentStepObj.renderActionVisuals();
			this.currentStepObj.renderComposite();
			this.currentStepObj.helpShown = true;
		}
		this.currentStepObj.enable();
	};

	this.endSim = function()
	{
		engine.comm.commit();

		if((engine.mode == engine.MODES.AUTO_PLAYBACK.value) && Conf.LOOP_AUTO_PLAYBACK)
		{
			Utils.debug.trace('In Auto-Playback Mode and loop option is true - Restarting...');
			this.restart();
			return;
		}
		EventHandler.disable();
		this.disableNav();

		this.resultsObj = this.getResults();
		var endMsg = this.getEndMessageContent(this.resultsObj);

		var o={};
		o.scope = this;
		o.label = engine.modeObj.name;
		o.txt = endMsg;
		o.finalizeLabel = (engine.mode == engine.MODES.ASSESSMENT.value && !engine.embedded) ? Lang.SEND_RESULTS : Lang.SIM_END;
		o.onFinalize = function(){
			this.finalize();
		};
		o.onRestart=function(){
			this.restart();
		};
		engine.dialog.end(o);
	};

	this.getResults = function()
	{
		var o = {};
		o.incStepNumberList = [];
		o.incStepNumbers = 0;
		o.score = 0;
		o.totalToInclude = 0;
		o.totalIncorrect = 0;
		o.lessonStatus = false;
		o.totalCorrect = 0;

		this.steps.each(function(item,index){
			if(item.assess && item.visited)
			{
				if(item.correct)
				{
					o.totalCorrect++;
				}
				else
				{
					o.totalIncorrect++;
					o.incStepNumberList.push(index+1);
				}
				o.totalToInclude++;
			}
		});

		o.incNumberList = o.incStepNumberList.join(', ');

		o.score = Math.round((o.totalCorrect/o.totalToInclude)*100);
		o.passed = (o.score >= Conf.PASSING_SCORE);
		o.lessonStatus = o.passed;

		return o;
	};

	this.getEndMessageContent = function(o)
	{
		var tmp = '';

		tmp += '<p>'+engine.modeObj.endMsg+'</p>';

		if(engine.mode == engine.MODES.ASSESSMENT.value || engine.mode == engine.MODES.SELF_TEST.value)
		{
			tmp += (o.passed) ? '<p>'+Lang.PASS+'</p>' : '<p>'+Lang.FAIL+'</p>';
			tmp += (Conf.INCLUDE_NUMBER_OF_TOTAL_STEPS) ? '<p><b>'+Lang.TOTAL_STEPS+'</b> '+o.totalToInclude+'</p>' : '';
			tmp += (Conf.INCLUDE_NUMBER_OF_INCORRECT_STEPS) ? '<p><b>'+Lang.NUMBER_INCORRECT_STEPS+'</b> '+o.totalIncorrect+'</p>' : '';
			tmp += (Conf.INCLUDE_GRADE) ? '<p><b>'+Lang.ACCURACY+'</b> '+o.score+'%</p>' : '';
			tmp += ((o.totalIncorrect > 0) && Conf.INCLUDE_WHICH_STEPS_INCORRECT) ? '<p><b>'+Lang.INCORRECT_STEPS+'</b> '+o.incNumberList+'</p>' : '';
		}

		return tmp;
	};

	this.finalize = function()
	{
		if(engine.mode == engine.MODES.ASSESSMENT.value || engine.mode == engine.MODES.SELF_TEST.value)
		{
			if(engine.embedded)
			{
				this.exposeDataModel(this.resultsObj);
			}
			else
			{
				this.setStatusAndScore(this.resultsObj);
			}
		}
		else
		{
			engine.exit();
		}
	};

	this.exposeDataModel = function(o)
	{
		engine.comm.setScore(o.score);
		if(o.passed)
		{
			// Passed
			engine.comm.setCompletionStatus(this.completionStrings.completed);
		}
		else
		{
			// Failed
			engine.comm.setCompletionStatus(this.completionStrings.incomplete);
		}
		engine.comm.commit();
		try
		{
			if(window.opener)
			{
				if(window.opener.sendSimApi)
				{
					//alert(engine.comm.getDataElementsObj()._data_elements);
					window.opener.sendSimApi(
						engine.comm.getDataElementsObj(),
						engine.simTitle,
						o.totalToInclude,
						o.totalIncorrect,
						o.incStepNumberList
					);
					engine.exit();
				}
			}
		}
		catch(e)
		{
			Utils.debug.trace('Error exposing data model to host course.'+(e.description || e),'error');
		}
	};

	this.setStatusAndScore = function(o)
	{
		if(engine.mode == engine.MODES.ASSESSMENT.value)
		{
			engine.comm.setScore(o.score);
		}
		
		if(o.passed)
		{
			// Passed
			engine.comm.setCompletionStatus(this.completionStrings.completed);
			engine.comm.setSuccessStatus('passed');
		}
		else
		{
			// Failed
			engine.comm.setCompletionStatus(this.completionStrings.incomplete);
			engine.comm.setSuccessStatus('failed');
		}

		if(engine.comm.enableManualSubmit && engine.mode == engine.MODES.ASSESSMENT.value)
		{
			engine.comm.sendResults(o);
		}
		else
		{
			engine.comm.commit();
			var func=function()
			{
				return engine.exit();
			};
			setTimeout(func,1000);
		}
	};
	
	this.setSimState = function()
	{
		var state = Utils.string.encodeState(this.getSimState());
		this.suspendDataObj.simState = state;
	};

	this.restart = function()
	{
		this.resetEverything();
		var stepId = this.steps[0].id;
		
		// Restart with the first step
		this.gotoStepById(stepId, '');
	};

	this.resetEverything = function()
	{
		this.steps.each(function(item, index){
			item.visited = false;
			item.here = false;
			item.reset();
		},this);
		this.resultsObj = null;
		this.enableNav();
	};
	
	//Persists suspendDataObj as a JSON string in the Comm object
	this.setSuspendData = function()
	{
		var suspend_data = JSON.encode(this.suspendDataObj);
		engine.comm.setSuspendData(suspend_data);
	};
	
	this.areAllStepsVisited = function()
	{
		// If there are no zeros in the sim state string,
		// all steps must have been visited
		if(this.suspendDataObj.simState)
		{
			var state = Utils.string.decodeState(this.suspendDataObj.simState);
			return (state.indexOf('0', state.length - 1) < 1);
		}
		else
		{
			return false;
		}
	};
	
	this.getTotalStepsVisited = function()
	{
		var total = 0;
		this.steps.each(function(item, index){
			if (item.visited || item.here)
			{
				total++;
			}
		});
		return total;
	};
	
	this.calculateVisited = function()
	{
		var stepTotal = this.getStepTotal();
		var viewedTotal = this.getTotalStepsVisited();
		if (this.areAllStepsVisited()) viewedTotal = stepTotal;
    	var visited = (Math.round((viewedTotal/stepTotal)*100))/100;
    	return visited;
	};
	
	this.setProgressStatus = function()
	{
		var visited = this.calculateVisited();
	    if (this.completionThreshold != -1 && (engine.mode == engine.MODES.STANDARD.value || engine.mode == engine.MODES.AUTO_PLAYBACK.value))
		{
	    		engine.comm.setProgressStatus(visited, this.completionThreshold);
		}
	};
	
	this.meetsCompletionThreshold = function()
    {
    	if (this.completionThreshold != -1 && engine.comm.completeOnThreshold){
    		var visited = this.calculateVisited();
    		if (visited >= this.completionThreshold){
    			return true;
    		} else {
    			return false;
    		}
    	} else {
    		return false;
    	}
    };
	
	this.getSimState = function()
	{
		var tmp = '';

		this.steps.each(function(item, index){
			tmp += (item.visited || item.here) ? 1 : 0;
		},this);

		return tmp;
	};
	
	this.resetSimState = function(v)
	{
		tmp = v.split('');
		tmp.each(function(item, index){
			if(item == '1')
			{
				this.steps[index].visited = true;
			}
		},this);
	};

	this.getPreviousCursorLocation = function()
	{
		return this.prevCursorLocation;
	};

	this.setPreviousCursorLocation = function(x,y)
	{
		this.prevCursorLocation = {x:x,y:y};
	};

	this.toString = function()
	{
		return 'Controller instance';
	};
}
