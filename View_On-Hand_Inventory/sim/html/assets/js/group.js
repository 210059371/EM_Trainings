/**
* Class defining the group object
* @param {Object} o A param that specifies the Step class configuration
* @requires Engine
* @constructor
*/
function Group(o)
{
	for (var prop in o)
	{
		this[prop] = o[prop];
	}

	this.open = false;
	this.menuItemHeight = 20;
	this.steps = [];
	this.caption = unescape(this.caption);
	this.index = engine.controller.groups.length;
	this.stepMenuEntries = [];
	this.open = false;
	engine.controller.groups.push(this);
	
	this.addStep = function(o)
	{
		o.parent = this;
		o.childIndex = this.steps.length;
		this.steps.push(o);
	};

	this.getMenuContent = function()
	{
		var i = this.index;
		var caption = this.caption;

		var tbl = new Element('table');
		var tr = new Element('tr');
		
		var tbody = new Element('tbody');
		tbl.adopt(tbody);

		var tr = new Element('tr');
		tbody.adopt(tr);

		var groupToggle = new Element('td');
		tr.adopt(groupToggle);
		
		var img = (this.open) ? 'menu_minus.png' : 'menu_plus.png';
		var groupToggleImg = new Element('img', {
				'id': 'groupToggleImg_'+i,
				'src': engine.skinPath+img
			});
		groupToggle.adopt(groupToggleImg);

		var groupIcon = new Element('td');
		tr.adopt(groupIcon);
		var groupIconImg = new Element('img', {
				'src': engine.skinPath+'menu_group.png'
			});
		groupIcon.adopt(groupIconImg);
		
		var label = new Element('td', {
			'class': 'menuEntryGroupLabel',
			'html': caption.trim()
		});
		tr.adopt(label);

		var container = new Element('div', {
			'class': 'menuEntryGroupContainer',
			'id': 'menuEntryGroup'+i,
			'tabindex': 0,
			'groupIdx': i,
			'role': 'listitem',
			'role': 'group',
			'title': Lang.ACCESSIBILITY_CLOSED+' '+Lang.ACCESSIBILITY_MENU_ITEM+': '+caption.trim(),
			'events': {
				'click': function(e){
					e.stop();
					engine.ui.toggleGroupMenuEntry(i);
				},
				'focus': function(e){
					engine.ui.setMenuFocused(true,this);
				},
				'blur': function(e){
					engine.ui.setMenuFocused(false,null);
				},
				'keydown': function(e){
					if(e.code == 13)
					{
						engine.ui.toggleGroupMenuEntry(i);
						e.stop();
					}
				}
			}
		},this);
		container.adopt(tbl);

		return container;
	};

	this.updateMenuToggleImage = function()
	{
		var img = (this.open) ? 'menu_minus.png' : 'menu_plus.png';
		$('groupToggleImg_'+this.index).src = engine.skinPath+img;
	};

	this.updateMenuTitle = function()
	{
		var str = (this.open) ? Lang.ACCESSIBILITY_OPEN : Lang.ACCESSIBILITY_CLOSED;
		var tempEle = new Element('div', {
			'html': unescape(this.caption.trim())
		});		
		$('menuEntryGroup'+this.index).set('title',str+' '+Lang.ACCESSIBILITY_MENU_ITEM+': '+tempEle.get('text'));
	};
	
	/**
	 * Return a useful string depiction of this group object
	 * @method toString
	 * @return {String} The name of this group object
	 */
	this.toString = function()
	{
		return "Group: "+this.caption;
	};
}
