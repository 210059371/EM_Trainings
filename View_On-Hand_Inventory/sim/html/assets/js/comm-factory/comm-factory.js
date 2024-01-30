/** 
* CommFactory JavaScript factory method for all communication.
* @classDescription This class acts as the factory method for all communication
* @param {String} apiVerStr A param that specifies the API version string (conf/Conf.js - Conf.API_TYPE)
* @return {CommFactory} Returns an instance of the CommFactory class
* @type {Object}
* @constructor
*/
var CommFactory = function(apiTypeStr,apiName)
{
	Utils.debug.trace('CommFactory will use: '+apiTypeStr,'comm');
	switch(apiTypeStr)
	{
		case "AICC":
			return new CommFactoryAicc();
			
		case "SCORM1.2":
			return new CommFactoryScorm12();

		case "SCORM2004":
			return new CommFactoryScorm2004();

		case "COOKIE":
			Utils.debug.trace('Cookie name: '+apiName,'comm');
			return new CommFactoryCookie({name:apiName,'lifetime':Conf.COOKIE_LIFETIME_IN_HOURS});

		case "CUSTOM":
			return new CommFactoryCustom();

		default:
			Utils.debug.trace('CommFactory was not passed a valid type - Using COOKIE mode','comm');
			Utils.debug.trace('Cookie name: '+apiName,'comm');
			return new CommFactoryCookie({name:apiName,'lifetime':Conf.COOKIE_LIFETIME_IN_HOURS});
	}
};
