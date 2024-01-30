/**
* Class used to create action notes
* @param {Object} o A param that specifies the Step class configuration
* @constructor
*/
function Note(o)
{
	for (var prop in o)
	{
		this[prop] = o[prop];
	}

	this.rectangle.top = parseInt(this.rectangle.y);
	this.rectangle.left = parseInt(this.rectangle.x);
	this.rectangle.right = parseInt(this.rectangle.x)+parseInt(this.rectangle.width);
	this.rectangle.bottom = parseInt(this.rectangle.y)+parseInt(this.rectangle.height);
	this.timerControl = new TimerControl(this);
	this.noteAnimator = new NoteAnimator();

	this.render = function(ctx, index, notetail)
	{
		var pointer = this.pointer;
		var rectangle = this.rectangle;
		var borderColor = this.borderColor;
		var backColor = this.backColor;
		var borderWidth = this.borderWidth;
		var foreColor = this.foreColor;
		var icon = this.icon;
		var rect = this.rectangle;
		
		if($chk(pointer))
		{
			if (typeof(notetail) == "undefined" || notetail == true) {
			var pointTo = new Point(pointer.x, pointer.y);
		}
		}
		else
		{
			var pointTo = undefined;
		}

		if (rect.top < 3) rect.top += 3;
		
		var bdWidth = borderWidth;
		var bdA = parseFloat(borderColor.a/255);
		var bkA = parseFloat(backColor.a/255);
		var bdColor = "rgba("+borderColor.r+","+borderColor.g+","+borderColor.b+","+bdA+")";
		var bgColor = "rgba("+backColor.r+","+backColor.g+","+backColor.b+","+bkA+")";

		if(bdWidth == 0)
		{
			bdColor = bgColor;
		}

		if($chk(this.hotspot))
		{
			this.drawHotspot(index);
		}
	
		var container = 'noteContainer_'+index;
		this.drawNoteShape(rect, bdWidth, bdColor, bgColor, this.cornerRadius, pointTo,ctx);
		this.drawNoteImage($(container));
		this.drawNoteIcon($(container));
		this.renderHyperlinks($(container));
	};

	this.drawHotspot = function(index)
	{
		var hs = new Hotspot(this.hotspot).render(index);
	};

	this.drawNoteShape = function(rect, bdWidth, bdColor, bgColor, cornerRad, pointTo,ctx)
	{
		var alpha = 100;
		var arr = this.getDrawPoints(rect, pointTo);

		if(bdWidth == 0)
		{
			bdColor = bgColor;
		}
		
		if(!bgColor)
		{
			alpha = 0;
			bgColor = "rgba(255,255,0,255)";
		}

		ctx.beginPath(bgColor, alpha);

		if(cornerRad > 0)
		{
			var theta, angle, cx, cy, px, py;
			var theta = Math.PI/4;

			ctx.moveTo(arr[0].x + cornerRad, arr[0].y);
			
			for (var i=1; i< arr.length; i++)
			{
				this.drawEdge(arr[i], rect, cornerRad,ctx);
			}

			this.drawEdge(arr[0], rect, cornerRad,ctx);
		}
		else
		{
			ctx.moveTo(arr[0].x, arr[0].y);

			for (var i=1; i< arr.length; i++)
			{
				ctx.lineTo(arr[i].x, arr[i].y);
			}

			ctx.lineTo(arr[0].x, arr[0].y);
		}

		/*
		var lingrad = ctx.createLinearGradient(0,0,0,this.rectangle.bottom);
		lingrad.addColorStop(0, this.getLighterRgbColorValues(this.backColor,25));
		lingrad.addColorStop(0.2, bgColor);
		lingrad.addColorStop(0.98, bgColor);
		lingrad.addColorStop(1, this.getDarkerRgbColorValues(this.backColor,25));

		ctx.fillStyle = lingrad;
		*/

		ctx.shadowOffsetX = 3;
		ctx.shadowOffsetY = 3;
		ctx.shadowBlur = 7;
		ctx.shadowColor = "rgba(0,0,0,0.5)";
		
		ctx.fillStyle = "rgb("+this.backColor.r+","+this.backColor.g+","+this.backColor.b+")";
		ctx.fill();

		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx.shadowBlur = 0;
		ctx.shadowColor = "rgba(0,0,0,0)";

		ctx.lineWidth = bdWidth;
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		ctx.strokeStyle = bdColor;

		ctx.stroke();		
	};

	this.getLighterRgbColorValues = function(colorObj,lightenBy)
	{
		var rPercent = parseInt((colorObj.r/255)*100)+lightenBy;
		var gPercent = parseInt((colorObj.g/255)*100)+lightenBy;
		var bPercent = parseInt((colorObj.b/255)*100)+lightenBy;

		var r = (rPercent < 100) ? parseInt((rPercent/100)*255) : 255;
		var g = (gPercent < 100) ? parseInt((gPercent/100)*255) : 255;
		var b = (bPercent < 100) ? parseInt((bPercent/100)*255) : 255;

		return "rgb("+r+","+g+","+b+")";
	};

	this.getDarkerRgbColorValues = function(colorObj,darkenBy)
	{
		var rPercent = parseInt((colorObj.r/255)*100)-darkenBy;
		var gPercent = parseInt((colorObj.g/255)*100)-darkenBy;
		var bPercent = parseInt((colorObj.b/255)*100)-darkenBy;

		var r = (rPercent > 0) ? parseInt((rPercent/100)*255) : 0;
		var g = (gPercent > 0) ? parseInt((gPercent/100)*255) : 0;
		var b = (bPercent > 0) ? parseInt((bPercent/100)*255) : 0;

		return "rgb("+r+","+g+","+b+")";
	};

	this.drawCurve = function(x, y, w, h, cornerRadius, angle, corner,ctx)
	{
		var cx, cy, px, py;
		var theta = Math.PI/4;

		if (corner == 1)      {	var varW = 0; var varH = 0; }	// top-left
		else if (corner == 2) {	var varW = w; var varH = 0; }	// top-right
		else if (corner == 3) {	var varW = w; var varH = h; }	// bottom-right
		else if (corner == 4) {	var varW = 0; var varH = h; }	// bottom-left

		for (var i=0; i<2; i++)
		{
			cx = x + (varW == 0? cornerRadius: varW - cornerRadius) + (Math.cos(angle + (theta/2))*cornerRadius/Math.cos(theta/2));
			cy = y + (varH == 0? cornerRadius: varH - cornerRadius) + (Math.sin(angle + (theta/2))*cornerRadius/Math.cos(theta/2));
			px = x + (varW == 0? cornerRadius: varW - cornerRadius) + (Math.cos(angle + theta)*cornerRadius);
			py = y + (varH == 0? cornerRadius: varH - cornerRadius) + (Math.sin(angle + theta)*cornerRadius);
			
			ctx.quadraticCurveTo(cx, cy, px, py);
			
			angle += theta;
		}
	};

	this.drawEdge = function(point, rect, cornerRadius,ctx)
	{
		switch(point.corner)
		{
			case 0:
				ctx.lineTo(point.x, point.y);
				break;
			case 1:
				ctx.lineTo(point.x, point.y + cornerRadius);
				this.drawCurve(rect.left, rect.top, (rect.right - rect.left), (rect.bottom - rect.top), cornerRadius, Math.PI, 1,ctx);
				break;
			case 2:
				ctx.lineTo(point.x - cornerRadius, point.y);
				this.drawCurve(rect.left, rect.top, (rect.right - rect.left), (rect.bottom - rect.top), cornerRadius, -Math.PI/2, 2,ctx);
				break;
			case 3:
				ctx.lineTo(point.x, point.y - cornerRadius);
				this.drawCurve(rect.left, rect.top, (rect.right - rect.left), (rect.bottom - rect.top), cornerRadius, 0, 3,ctx);
				break;
			case 4:
				ctx.lineTo(point.x + cornerRadius, point.y);
				this.drawCurve(rect.left, rect.top, (rect.right - rect.left), (rect.bottom - rect.top), cornerRadius, Math.PI/2, 4,ctx);
				break;
		}
	};

	this.getDrawPoints = function(rect, pointTo)
	{
		var point1 = new Point();
		var point2 = new Point();
		var aPoints = new Array(new Point(rect.left, rect.top, 1), new Point(rect.right, rect.top, 2), new Point(rect.right, rect.bottom, 3), new Point(rect.left, rect.bottom, 4));

		// Check if pointTo is undefined
		if(!pointTo)
		{
			return aPoints;
		}

		// Check if pointTo is in the rectangle
		if((pointTo.x >= rect.left && pointTo.x <= rect.right) && (pointTo.y >= rect.top && pointTo.y <= rect.bottom))
		{
			//trace('point is within rect - returning...');
			return aPoints;
		}
		
		// left side, top half
		if (pointTo.x <= rect.x
		&& pointTo.y <= (rect.top + Math.round(rect.height / 2))
		&& pointTo.y >= (rect.top - rect.x + pointTo.x))
		{
			var aPoints = new Array(new Point(rect.left, rect.top, 1), new Point(rect.right, rect.top, 2), new Point(rect.right, rect.bottom, 3), new Point(rect.left, rect.bottom, 4));

			point1.x = rect.x;
			point2.x = rect.x;

			point1.y = rect.y + Math.round(rect.height / 8);
			point2.y = rect.y + 3 * Math.round(rect.height / 8);

			aPoints.splice(4, 0, point2, pointTo, point1);
		}

		// left side, bottom half
		if (pointTo.x <= rect.x
		&& pointTo.y >= (rect.top + Math.round(rect.height / 2))
		&& pointTo.y <= (rect.x - pointTo.x + rect.bottom))
		{
			var aPoints = new Array(new Point(rect.left, rect.top, 1), new Point(rect.right, rect.top, 2), new Point(rect.right, rect.bottom, 3), new Point(rect.left, rect.bottom, 4));

			point1.x = rect.x;
			point2.x = rect.x;

			point1.y = rect.y + 5 * Math.round(rect.height / 8);
			point2.y = rect.y + 7 * Math.round(rect.height / 8);

			aPoints.splice(4, 0, point2, pointTo, point1);
		}

		// top side, left half
		if (pointTo.y <= rect.y
		&& pointTo.x <= (rect.x + Math.round(rect.width / 2))
		&& pointTo.x >= (rect.x - rect.y + pointTo.y))
		{
			var aPoints = new Array(new Point(rect.left, rect.top, 1), new Point(rect.right, rect.top, 2), new Point(rect.right, rect.bottom, 3), new Point(rect.left, rect.bottom, 4));

			point1.y = rect.y;
			point2.y = rect.y;

			point1.x = rect.x + Math.round(rect.width / 8);
			point2.x = rect.x + 3 * Math.round(rect.width / 8);

			aPoints.splice(1, 0, point1, pointTo, point2);
		}

		// top side, right half
		if (pointTo.y <= rect.y
		&& pointTo.x >= (rect.x + Math.round(rect.width / 2))
		&& pointTo.x <= (rect.right + rect.top - pointTo.y))
		{
			var aPoints = new Array(new Point(rect.left, rect.top, 1), new Point(rect.right, rect.top, 2), new Point(rect.right, rect.bottom, 3), new Point(rect.left, rect.bottom, 4));

			point1.y = rect.y;
			point2.y = rect.y;

			point1.x = rect.x + 5 * Math.round(rect.width / 8);
			point2.x = rect.x + 7 * Math.round(rect.width / 8);

			aPoints.splice(1, 0, point1, pointTo, point2);
		}

		// right side, top half
		if (pointTo.x >= rect.right
		&& pointTo.y <= (rect.top + Math.round(rect.height / 2))
		&& pointTo.y >= (rect.top - pointTo.x + rect.right))
		{
			var aPoints = new Array(new Point(rect.left, rect.top, 1), new Point(rect.right, rect.top, 2), new Point(rect.right, rect.bottom, 3), new Point(rect.left, rect.bottom, 4));

			point1.x = rect.right;
			point2.x = rect.right;

			point1.y = rect.y + Math.round(rect.height / 8);
			point2.y = rect.y + 3 * Math.round(rect.height / 8);

			aPoints.splice(2, 0, point1, pointTo, point2);
		}

		// right side, bottom half
		if (pointTo.x >= rect.right
		&& pointTo.y >= (rect.top + Math.round(rect.height / 2))
		&& pointTo.y <= (rect.bottom + pointTo.x - rect.right))
		{
			var aPoints = new Array(new Point(rect.left, rect.top, 1), new Point(rect.right, rect.top, 2), new Point(rect.right, rect.bottom, 3), new Point(rect.left, rect.bottom, 4));

			point1.x = rect.right;
			point2.x = rect.right;

			point1.y = rect.y + 5 * Math.round(rect.height / 8);
			point2.y = rect.y + 7 * Math.round(rect.height / 8);

			aPoints.splice(2, 0, point1, pointTo, point2);
		}

		// bottom side, right half
		if (pointTo.y >= rect.bottom
		&& pointTo.x >= (rect.x + Math.round(rect.width / 2))
		&& pointTo.x <= (rect.right + pointTo.y - rect.bottom))
		{
			var aPoints = new Array(new Point(rect.left, rect.top, 1), new Point(rect.right, rect.top, 2), new Point(rect.right, rect.bottom, 3), new Point(rect.left, rect.bottom, 4));

			point1.y = rect.bottom;
			point2.y = rect.bottom;

			point1.x = rect.x + 5 * Math.round(rect.width / 8);
			point2.x = rect.x + 7 * Math.round(rect.width / 8);

			aPoints.splice(3, 0, point2, pointTo, point1);
		}

		// bottom side, left half
		if (pointTo.y >= rect.bottom
		&& pointTo.x <= (rect.x + Math.round(rect.width / 2))
		&& pointTo.x >= (rect.x - pointTo.y + rect.bottom))
		{
			var aPoints = new Array(new Point(rect.left, rect.top, 1), new Point(rect.right, rect.top, 2), new Point(rect.right, rect.bottom, 3), new Point(rect.left, rect.bottom, 4));

			point1.y = rect.bottom;
			point2.y = rect.bottom;

			point1.x = rect.x + Math.round(rect.width / 8);
			point2.x = rect.x + 3 * Math.round(rect.width / 8);

			aPoints.splice(3, 0, point2, pointTo, point1);
		}
		
		return aPoints;
	};

	this.drawNoteImage = function(container)
	{
		// Note image...
		var img = new Image();
		var self = this;
		img.onload = function()
		{
			if($chk(container)){
				var noteImage = Utils.dom.createImageElement("noteImage"+self.index, container, this.width, this.height, self.image.rectangle.x, self.image.rectangle.y, "stepNoteImage");
			}
			noteImage.src = this.src;
		}
		img.onerror = function()
		{
			Utils.debug.trace("Error: Cannot load note image.");
		}
		img.src = engine.imagePath+this.image.file;
	};

	this.drawNoteIcon = function(container)
	{
		if(this.icon.file == "noteicon_0.png"){return;}

		// Note icon image...
		var img = new Image();
		var self = this;
		img.onload = function()
		{
			if($chk(container)){
				var noteIcon = Utils.dom.createImageElement("noteIcon"+self.index, container, self.icon.rectangle.width, self.icon.rectangle.height, self.icon.rectangle.x, self.icon.rectangle.y, "stepNoteIcon");
			}
			noteIcon.src = this.src;
		}
		img.onerror = function()
		{
			Utils.debug.trace("Error: Cannot load note icon.");
		}
		img.src = engine.noteIconPath+this.icon.file;
	};

	this.renderHyperlinks = function(container)
	{
		if(!$chk(this.image.hyperlinks)){return;}

		this.image.hyperlinks.each(function(item,index){

			var r = item.rectangle;
			var d = new Element('div',{
				'class':'noteHyperlink',
				'styles':{
					'top':r.y,
					'left':r.x,
					'width':r.width,
					'height':r.height
				}
			});

			var img = new Element('img',{
				'src':engine.SPACER,
				'events':{
					'mousedown':function(){
						var url = unescape(item.url);
						if(url.indexOf('javascript:') === 0)
						{
							if (url.substring(url.indexOf(':')+1, url.indexOf(',')) == "gotoStepByIndex")
							{
								var stepIndex = url.substring(url.indexOf(',')+1)-1;
								engine.controller.gotoStepByIndex(stepIndex);
							}
							else {Utils.debug.trace("Error: cannot create step index");}
						}
						else
						{
							Utils.window.open(url,null,null,null,"resizable");
						}
					}
				}
			});
			d.adopt(img);
			$('stepNotes').adopt(d);
		});
	};
		
	this.display = function(index){
		var noteContainer = 'noteContainer_'+index;
		var hs = 'stepNoteHotspot_'+index;
		switch (engine.mode){
			case engine.MODES.AUTO_PLAYBACK.value:
				// bypass display of note but continue with animation
				if (!this.visible && this.modes != null && this.modes.indexOf(engine.MODES.AUTO_PLAYBACK.value) > -1)
				{
					this.durationReset(noteContainer, hs, false);
				} else if (this.displayNoteTime == 0) {
					this.entryDisplay(noteContainer, hs);
				} else if (this.displayNoteTime > 0) {
					this.startDisplay(noteContainer, hs, this.displayNoteTime);
				}
				break;
			case engine.MODES.STANDARD.value:
				if (this.standardTime == 0) {
					this.entryDisplay(noteContainer, hs);
				} else if (this.standardTime > 0) {
					this.startDisplay(noteContainer, hs, this.standardTime);
				}
				break;
			case engine.MODES.SELF_TEST.value:
				if (this.selfTime == 0) {
					this.entryDisplay(noteContainer, hs);
				} else if (this.selfTime > 0) {
					this.startDisplay(noteContainer, hs, this.selfTime);
				}
				break;
			case engine.MODES.ASSESSMENT.value:
				if (this.assessTime == 0) {
					this.entryDisplay(noteContainer, hs);
				} else if (this.assessTime > 0) {
					this.startDisplay(noteContainer, hs, this.assessTime);
				}
				break;
		}
	};
	
	this.showHotspot = function(hs)
	{
		if($chk(this.hotspot) && $chk($(hs)))
		{
			$(hs).setStyle('display', 'block');
			Utils.dom.setOpacity(100, $(hs));
		}
	};
	
	this.hideHotspot = function(hs)
	{
		if($chk(this.hotspot) && $chk($(hs)))
		{
			$(hs).setStyle('display', 'none');
		}
	};
	
	this.startDisplay = function(noteContainer, hs, time)
	{
		if(engine.controller.playbackPaused){return;}

        this.timerControl.start({
			duration:time,
			interval:100,
			onCompletedCb:function(){
				this.displayTimerCompleted(noteContainer, hs)
			}
		});
	};
	
	this.displayTimerCompleted = function(noteContainer, hs)
	{
		this.stopNoteTimer();
		if (engine.mode == engine.MODES.STANDARD.value && this.standardEntryAnimation == "display" ||
				engine.mode == engine.MODES.SELF_TEST.value && this.selfEntryAnimation == "display" ||
				engine.mode == engine.MODES.ASSESSMENT.value && this.assessEntryAnimation == "display" ||
				engine.mode == engine.MODES.AUTO_PLAYBACK.value && this.entryAnimation == "display")
		{
			this.entryDisplay(noteContainer, hs);
		}
		if (engine.mode == engine.MODES.AUTO_PLAYBACK.value && this.entryAnimation == "fadein" ||
				engine.mode == engine.MODES.STANDARD.value && this.standardEntryAnimation == "fadein" ||
				engine.mode == engine.MODES.SELF_TEST.value && this.selfEntryAnimation == "fadein" ||
				engine.mode == engine.MODES.ASSESSMENT.value && this.assessEntryAnimation == "fadein")
		{
			this.noteAnimator.animateFadeInChain(this, noteContainer, hs);
		}
		var resetTimer = true;
		this.durationReset(noteContainer, hs, resetTimer);
	};
	
	this.durationReset = function(noteContainer, hs, resetTimer)
	{
		if (engine.mode == engine.MODES.AUTO_PLAYBACK.value){
			if (this.duration == 0){
				// subtract display time from auto playback
				var animationTime = this.calculateAnimationTime();
				if (resetTimer){
					this.stopNoteTimer();
					this.timerControl.reset();
				}
				this.startDuration(noteContainer, hs, animationTime);
			} else if (this.duration > 0){
				if (resetTimer){
					this.stopNoteTimer();
					this.timerControl.reset();
				}
				this.startDuration(noteContainer, hs, this.duration);
			}
		}
	};
	
	this.startDuration = function(noteContainer, hs, durationTime)
	{
		if(engine.controller.playbackPaused){return;}

		this.timerControl.start({
			duration:durationTime,
			interval:100,
			onCompletedCb:function(){
				this.durationCompleted(noteContainer, hs)
			}
		});
	};
	
	this.durationCompleted = function(noteContainer, hs)
	{
		
		this.stopNoteTimer();
		// default action only starts animation
		var n = engine.controller.currentStepObj.getMaximumNote();
		if (this === n && engine.controller.currentStepObj.getNoAction() && !engine.audio.isPlaying){
			this.startAnimation();
		} else if (this.actionid != "" && this.isDefaultAction()){
			this.startAnimation();
		} 
		this.durationDone(noteContainer, hs);
	};
	
	this.startAnimation = function()
	{
		engine.controller.currentStepObj.startAnimations();
	};
	
	this.durationDone = function(noteContainer, hs){
		if (this.duration > 0){
			if (this.exitAnimation == "fadeout") { 
				this.noteAnimator.animateFadeOutChain(this, noteContainer, hs);
			}
			if (this.exitAnimation == "hide") {
				this.exitHideNote(noteContainer, hs);
				this.hideHotspot(hs);
				this.exitDisplayActionHotspot();
			}
		}
		
		this.setTimerDone();
	};
	
	this.setTimerDone = function()
	{
		var n = engine.controller.currentStepObj.getMaximumNote();
		if (this === n){
			// for info only step
			if (engine.controller.currentStepObj.isInfoStep){
				engine.controller.currentStepObj.animationComplete = true;
			}

			if (!engine.controller.timerControl.isActive() && engine.controller.currentStepObj.animationComplete){
				// set enough time for the fade out to work
				var timeout = 0;
			/* upc-18377
				if (this.duration > 0 && this.exitAnimation == "fadeout"){
					timeout = 1000;
					setTimeout(function(){
						engine.controller.currentStepObj.onTimerDone();
					},timeout);
				} else {
					engine.controller.currentStepObj.onTimerDone();
				}
			*/
				engine.controller.currentStepObj.onTimerDone();	
	
			}
		}
	};
	
	this.isDefaultAction = function(){
		var isDefaultAction = false;
		var act = engine.controller.currentStepObj.getDefaultAction();
		if (act != null && this.actionid == act.actionid){
			isDefaultAction = true;
		}
		return isDefaultAction;
	};
	
	this.calculateAnimationTime = function() {
		var animationTime = engine.controller.currentStepObj.autoPlaybackTime - this.displayNoteTime;
		return animationTime;
	};
	
	this.entryDisplay = function(noteContainer, hs){
		if (engine.mode == engine.MODES.AUTO_PLAYBACK.value && this.entryAnimation == "fadein" ||
				engine.mode == engine.MODES.STANDARD.value && this.standardEntryAnimation == "fadein" ||
				engine.mode == engine.MODES.SELF_TEST.value && this.selfEntryAnimation == "fadein" ||
				engine.mode == engine.MODES.ASSESSMENT.value && this.assessEntryAnimation == "fadein")
		{
			this.noteAnimator.animateFadeInChain(this, noteContainer, hs);
		} else {
			this.entryDisplayAll(noteContainer, hs);
		}
		// timer control does not have to be reset
		this.durationReset(noteContainer, hs, false);
	};
	
	this.entryDisplayAll = function(noteContainer, hs){
		this.entryDisplayNote(noteContainer);
		this.showHotspot(hs);
		this.entryDisplayActionHotspot();
	};
	
	this.entryDisplayNote = function(noteContainer){
		if($chk($(noteContainer))){
			$(noteContainer).setStyle('display', 'block');
			Utils.dom.setOpacity(100, $(noteContainer));
			
			if(Utils.browserDetection.browser == "ie" && Utils.browserDetection.version < 9)
			{
				Utils.dom.removeFilter($(noteContainer));
			}
		}
	};
	
	this.exitHideNote = function(noteContainer){
		if($chk($(noteContainer))){
			$(noteContainer).setStyle('display', 'none');
		}
	};
	
	this.entryDisplayActionHotspot = function(){
		
		if ($chk(this.actionid)){
			if (engine.controller.currentStepObj.showActionNoteVisuals()){
				var actionContainer = this.actionid;
				if($chk($(actionContainer))){
					$(actionContainer).setStyle('display', 'block');
					Utils.dom.setOpacity(100, $(actionContainer));
				}
			}
		}
	};
	
	this.exitDisplayActionHotspot = function(){
		if ($chk(this.actionid)){
			var actionContainer = this.actionid;
			if($chk($(actionContainer))){
				$(actionContainer).setStyle('display', 'none');
			}
		}
	};
	
	this.resumeNoteTimer = function()
	{
		this.timerControl.resume();
	};
	
	this.pauseNoteTimer = function()
	{
		this.timerControl.pause();
	};
	
	this.resetNoteTimer = function()
	{
		this.timerControl.reset();
	};
	
	this.stopNoteTimer = function()
	{
		if (this.timerControl.isActive){
			this.timerControl.stop();
		}
	};
	
}
