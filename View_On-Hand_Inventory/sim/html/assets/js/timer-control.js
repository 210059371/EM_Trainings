
/**
 * TimerControl Class
 * @Developer Sean K. Friese (sean.friese@ancile.com)
 *
 * Usage:
 * -----
 * 
 * var timer = new TimerControl(this);
 * 
 * timer.start({
 * 		duration:5000,
 * 		interval:10,
 * 		onCompletedCb:function(){
 * 			someFunction();
 * 		},
 * 		onIntervalCb:function(elapsed,remaining){
 * 			someOtherFunction(elapsed,remaining);
 * 		}
 * });
 */

(function()
{
	/**
	 * Constructor - initiate with the new operator
	 * @param {Object} scope Object instantiating this instance
	 */
	this.TimerControl = function(scope)
	{
		this.scope = scope;
	};
	
	TimerControl.prototype = { 
		intervalFunc: function(_this)
		{ 
			return function()
			{
				if(_this.duration && !isNaN(_this.duration))
				{
					var currentTime = _this._time();
					var difference = currentTime - _this.startTime;

					_this.remaining = _this.duration-difference;
					_this.elapsed = difference;

					if(isNaN(_this.remaining) || _this.remaining <= 0)
					{
						_this.onCompleted();
					}
					else
					{
						_this.onInterval();
					}
				}
				else
				{
					_this.onInterval();
				}
				
			}; 
		},

		_time: Date.now || function()
		{
			return +new Date;
		},
		 
		start: function(o)
		{
			if(this.started && this.active){this.stop();}

			this.reset();

			this.started = true;
			this.active = true;
			this.paused = false;
			this.duration = o.duration;
			this.remaining = o.duration;
			this.interval = o.interval || 100;
			this.onCompletedCb = o.onCompletedCb || function(){};
			this.onIntervalCb = o.onIntervalCb || function(){};
			this.startTime = this._time();

			this.intervalID = setInterval(this.intervalFunc(this), this.interval);
		},

		pause: function()
		{
			if(this.started && this.active && !this.paused)
			{
				this.pausedTime = this._time();
				clearInterval(this.intervalID);
				this.active = false;
				this.paused = true;
			}
		},

		resume: function()
		{
			if(this.started && !this.active && this.paused)
			{
				this.active = true;
				this.paused = false;
				var difference = (this.pausedTime > 0) ? this._time() - this.pausedTime : 0;
				this.startTime += difference;
				this.intervalID = setInterval(this.intervalFunc(this), this.interval);
			}
		},
		 
		stop: function()
		{
			if(this.started && this.active)
			{
				this.startTime = this._time();
				clearInterval(this.intervalID);
				this.pausedTime = 0;
				this.active = false;
				this.paused = false;
			}
		},

		reset: function()
		{
			if(this.intervalID)
			{
				clearInterval(this.intervalID);
			}
			this.onCompletedCb = function(){};
			this.onIntervalCb = function(){};
			this.duration = null;
			this.remaining = null;
			this.elapsed = null;
			this.pausedTime = null;
			this.intervalID = null; 
			this.interval = null;
			this.paused = false;
			this.active = false;
			this.started = false;
		},

		isActive: function()
		{
			return this.active;
		},

		hasStarted: function()
		{
			return this.started;
		},
		
		onCompleted: function()
		{
			this.stop();
			this.onIntervalCb.apply(this.scope,[this.duration,0]);
			this.onCompletedCb.apply(this.scope);
		},
		
		onInterval: function()
		{
			this.onIntervalCb.apply(this.scope,[this.elapsed,this.remaining]);
		},

		toString: function()
		{
			return 'TimerControl instance';
		}
	};
})();