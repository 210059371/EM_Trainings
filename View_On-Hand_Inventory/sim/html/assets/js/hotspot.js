/**
* Class used to create action notes
* @param {Object} o A param that specifies the Step class configuration
* @constructor
*/
function Hotspot(o)
{
	for (var prop in o)
	{
		this[prop] = o[prop];
	}

	this.render = function(index)
	{
		/*
		hotspot:{
			rectangle:{x:45,y:160,width:100,height:20},
			backColor:{a:255,r:255,g:255,b:0},
			borderColor:{a:255,r:255,g:215,b:0},
			borderWidth:3,
			transparency:50
		}
		*/
		var r = this.rectangle;
		var transFix = (this.transparency-100);
		var opac = -transFix/100;
		var bdColor = "rgb("+this.borderColor.r+","+this.borderColor.g+","+this.borderColor.b+")";
		var bgColor = "rgb("+this.backColor.r+","+this.backColor.g+","+this.backColor.b+")";
		
		var hs = new Element('div',{
			'id':'stepNoteHotspot_'+index,
			'class':'stepNoteHotspot'
		});
		hs.setStyle('border-color',bdColor);
		hs.setStyle('border-width',this.borderWidth);
		hs.setStyle('width',r.width);
		hs.setStyle('height',r.height);
		hs.setStyle('left',r.x - this.borderWidth);
		hs.setStyle('top',r.y - this.borderWidth);
		
		var fill = new Element('div');
		fill.setStyle('background-color',bgColor);
		fill.setStyle('width',r.width);
		fill.setStyle('height',r.height);
		fill.setStyle('opacity',opac);

		hs.adopt(fill);
		$('stepNotes').adopt(hs);
		Utils.dom.setOpacity(0, $(hs));
		$(hs).setStyle("display", "none");
	}
}
