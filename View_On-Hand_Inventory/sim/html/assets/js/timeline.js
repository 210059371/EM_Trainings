(function(){
	/**
	* Class used to control the timeline bar within the UI
	* @constructor
	* @requires Engine
	* @requires Lang
	* @requires Utils
	* @requires MooTools
	*/
	this.Timeline = function()
	{
		this.entryElements = [];
		
		this.initialize = function(steps)
		{
			$('timelineBar').setStyle("left",0);
			$('timelineBar').setStyle('bottom', $('footer').getStyle("min-height"));

			this.create(steps);
		};

		this.create = function(steps)
		{
			var total = steps.length;
			steps.each(function(item,index){
				var e = new Element('div',{
					'id':'timelineEntry_'+index,
					'class':'timelineEntry',
					'tabindex':-1,
					'title':unescape(Lang.UI_LABEL_STEP_NUMBER.replace('%s',(index+1)).replace('%t',total))
				});
				e.index = index;
				e.onclick=function()
				{
					engine.controller.gotoStepByIndex(this.index);
				}
				$('timelineEntries').appendChild(e);
				var de = new Element('div',{
					'id':'timelineEntry_'+index+'_duration',
					'class':'durationEntry',
					'tabindex':-1,
					'width':'100%',
					'height':'100%'
				});
				e.adopt(de);
				var img = Utils.dom.createImageElement("timelineEntry_"+index+"_img",de,10,10,0,0,"");
				img.src = engine.SPACER;			
				this.entryElements.push(e);
			},this);
		};

		this.getBarHeight = function()
		{
			return $('timelineBar').offsetHeight;
		};

		this.updateStyles = function(currentIndex)
		{
			this.entryElements.each(function(item, index){
				var opac = (index < currentIndex) ? 0.75 : 0.25;
				var w = (engine.mode == engine.MODES.AUTO_PLAYBACK.value) ? '1%' : '100%';
				if(index == currentIndex)
				{
					$('timelineEntry_'+index+'_duration').setStyle('width', w);
					$('timelineEntry_'+index+'_duration').setStyle('opacity', 1);
				}
				else
				{
					$('timelineEntry_'+index+'_duration').setStyle('width', '100%');
					$('timelineEntry_'+index+'_duration').setStyle('opacity', opac);
				}
			});

			$(this.entryElements[currentIndex].id).setStyle('opacity', 1);
		};

		this.updateDuration = function(total,remaining,currentIndex)
		{
			var dur = parseInt((remaining/total)*100);
			$('timelineEntry_'+currentIndex+'_duration').setStyle('width',dur+'%');
		};

		this.updateLayout = function(viewWidth,footerHeight)
		{
			//timelineBar
			try
			{
				$('timelineBar').setStyle('bottom',footerHeight);
				$('timelineBar').setStyle('width',viewWidth);
			}
			catch(e){Utils.debug.trace("Error in Timeline.updateLayout setting timelineEntryBar style width ("+w+"): "+e);}

			//timelineEntries
			try
			{
				var w = $('timelineEntries').offsetWidth;
				var len = this.entryElements.length;
				this.entryElements.each(function(item, index){
					item.style.width = (w/len)-1 + 'px';
				});
			}
			catch (e){Utils.debug.trace("Error in Timeline.updateLayout setting entryElements width ("+w+"): "+e);}
		};

		this.cleanup = function()
		{
			this.entryElements = null;
			$('timelineBar').getChildren().destroy();
			$('timelineBar').destroy();
		};
	};
})();