/** 
* Defines the ActionEditRegEx object for edit actions that support text entry matched against a regular expression
* @requires Action
* @extends Action
* @constructor
*/
var ActionEditRegEx = new Class({
    Extends: ActionEdit,
    
	initialize: function(o)
	{
		this.parent(o); //will call initalize of ActionEdit
		this.actionMode = "editRegex";
	},

	assess: function(e)
	{
		Utils.debug.trace('Entered: '+this.textField.value);

		if(e.realkeyCode == 13 || e.realkeyCode == 9)
		{
			if(!this.text && !this.pattern)
			{
				this.markCorrect();
				return;
			}
		}
		
		if(e.realkeyCode == 13)
		{
			var txt = this.textField.value;
			if(txt === ""){return;}
			
			var pattern = (this.pattern) ? unescape(this.pattern) : this.text;
			var re = new RegExp(pattern);
			
			if(re.test(txt))
			{
				this.markCorrect();
			}
			else
			{
				this.markIncorrect();					
			}
		}
	}
});