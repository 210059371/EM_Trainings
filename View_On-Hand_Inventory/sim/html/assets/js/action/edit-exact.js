/** 
* Defines the ActionEditExact object for edit actions that must be entered exactly as expected
* @requires Action
* @extends Action
* @constructor
*/
var ActionEditExact = new Class({
    Extends: ActionEdit,
    
	initialize: function(o)
	{
		this.parent(o); //will call initalize of ActionEdit
		this.actionMode = "editExact";
	},

	assess: function(e)
	{
		Utils.debug.trace('Entered: '+this.textField.value);

		if(Conf.REQUIRE_ENTER_PRESS)
		{
			if(e.realkeyCode == 13)
			{
				if(!this.text)
				{
					this.markCorrect();
					return;
				}

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

				var actionValue = txt;
				var szCompare = entry;
				var szInputText = entry;
				
				// Fix IME issue: convert all IDEOGRAPHIC SPACEs (U3000) to NORMAL SPACEs (U20)
				// Pulled from previous version of sim output for Korean IME requirements (1/31/2008 - 2.11.1)
				actionValue = this.doReplace(actionValue, String.fromCharCode(12288), String.fromCharCode(32));
				szCompare  = this.doReplace(szCompare, String.fromCharCode(12288), String.fromCharCode(32));

				if((actionValue == szCompare ) || (this.fixIME(actionValue,szCompare))) 
				{
					this.markCorrect();
					return;
				}
				else
				{
					this.markIncorrect();
					return;
				}
			}
		}
		else
		{
			if(e.realkeyCode == 13)
			{
				if(!this.text)
				{
					this.markCorrect();
					return;
				}

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

				if(entry == txt)
				{
					this.markCorrect();
				}
				else
				{
					this.markIncorrect();
				}
			}

			if(this.textField.value.length > 0)
			{
				var textEntryLength = this.textField.value.length;
                //this.text = this.text.replace("%25","%");
				var textValueSubstr = this.text.substr(0,textEntryLength);

				if(this.caseSensitive)
				{
					var entry = this.textField.value;
					var txtSubstr = textValueSubstr;
					var txt = this.text;
				}
				else
				{
					var entry = this.textField.value.toLowerCase();
					var txtSubstr = textValueSubstr.toLowerCase();
					var txt = this.text.toLowerCase();
				}

				if(engine.mode != engine.MODES.AUTO_PLAYBACK.value)
				{
					if(entry == txt)
					{
						this.markCorrect();
						return;
					}
				}

				if(entry != txtSubstr)
				{
					this.textField.value = this.textField.value.substr(0,this.textField.value.length-1);
					this.markIncorrect();
				}
			}
		}
	},

	fixIME: function(szString,szCom)
	{
		var code1,code2;
		var i = szString.length;
		var j = szCom.length;
		if(i!=j)
		return false;

		for(var i=0;i<szString.length;i++)
		{
			code1=szString.charCodeAt(i);
			code2=szCom.charCodeAt(i);

			if(code1 != code2)
			{
				if(!((code1-code2 ==65248) || (code2-code1==65248)))
				return false;
			}
		}

		return true;
	},

	doReplace: function(szText, szSeperate, szReplace)
	{
		var arrText = szText.split(szSeperate);

		szText = "";
		for(var i=0;i<arrText.length;i++)
		{
			if(i+1 < arrText.length)
			{
				szText += arrText[i] + szReplace;
			}
			else
			{
				szText += arrText[i];
			}
		}

		return szText;
	}
});