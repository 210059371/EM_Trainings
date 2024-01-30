/** 
* Defines the ActionEditFreeText object for edit actions that support freetext entry
* @requires Action
* @extends Action
* @constructor
*/
var ActionEditFreeText = new Class({
    Extends: ActionEdit,
    
	initialize: function(o)
	{
		this.parent(o); //will call initalize of ActionEdit
		this.actionMode = "editFreetext";
	},

	assess: function(e)
	{
		Utils.debug.trace('Entered: '+this.textField.value);

		if(e.realkeyCode == 13 || e.realkeyCode == 9)
		{
			if(!this.text || this.text == "")
			{
				this.markCorrect();
				return;
			}
		}

		if(e.realkeyCode == 13)
		{
			if(this.caseSensitive)
			{
				var entry = this.textField.value;
				var txt = this.text;
			}
			else
			{
				var entry = this.textField.value.toLowerCase();
				var txt = this.text.toLowerCase();
			}

			if(entry != '' || entry == txt)
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