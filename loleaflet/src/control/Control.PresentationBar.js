/* -*- js-indent-level: 8 -*- */
/*
 * L.Control.PresentationBar
 */

/* global $ _UNO */
L.Control.PresentationBar = L.Control.extend({
	options: {
		shownavigation: true
	},

	_bar: null, // 紀錄自己的 toolbar

	onAdd: function (map) {
		this.map = map;
		this.create();

		map.on('wopiprops', this.onWopiProps, this);
		map.on('updatepermission', this.onUpdatePermission, this);
	},

	create: function() {
		var that = this;
		var toolbar = $('#presentation-toolbar');
		this._bar = toolbar.w2toolbar({
			name: 'presentation-toolbar',
			hidden: true,
			items: [
				{type: 'html',  id: 'left'},
				{type: 'button',  id: 'presentation', img: 'presentation', hidden:true, hint: this._getItemUnoName('presentation'), uno: '.uno:Presentation', stateChange: true},
				{type: 'button',  id: 'presentationcurrentslide', img: 'presentationcurrentslide', hidden:true, hint: this._getItemUnoName('presentationcurrentslide'), uno: '.uno:PresentationCurrentSlide', stateChange: true},
				{type: 'break', id: 'presentationbreak', hidden:true},
				{type: 'button',  id: 'insertpage', img: 'insertpage', hint: this._getItemUnoName('insertpage'), uno: '.uno:InsertPage', stateChange: true, disabled: true},
				{type: 'button',  id: 'duplicatepage', img: 'duplicatepage', hint: this._getItemUnoName('duplicatepage'), uno: '.uno:DuplicatePage', stateChange: true, disabled: true},
				{type: 'button',  id: 'deletepage', img: 'deletepage', hint: this._getItemUnoName('deletepage'), uno: '.uno:DeletePage', stateChange: true, disabled: true},
				{type: 'html',  id: 'right'}
			],
			onClick: function (e) {
				// In the iOS app we don't want clicking on the toolbar to pop up the keyboard.
				if (!window.ThisIsTheiOSApp) {
					that.map.focus(that.map.canAcceptKeyboardInput()); // Maintain same keyboard state.
				}
				// 被點擊的選項
				var clickedItem = (e.subItem ? e.subItem : e.item);
				// item 沒有自己的 onClick 事件，才執行系統的 onClick 事件
				if (typeof(clickedItem.onClick) !== 'function') {
					// 該選項有指定 uno 指令
					if (clickedItem.uno) {
						that.map.executeAllowedCommand(clickedItem.uno);
					}
				}
				window.hideTooltip(this, e.target);
			}
		});

		this.map.uiManager.enableTooltip(toolbar);

		toolbar.bind('touchstart', function() {
			this._bar.touchStarted = true;
		});

		this.map.setupStateChangesForToolbar({toolbar: this._bar});
	},

	_getItemUnoName: function(id) {
		var docType = this.map.getDocType();
		switch (id) {
		case 'presentation':
			return docType === 'presentation' ? _UNO('.uno:Presentation', 'presentation') : '';
		case 'presentationcurrentslide':
			return docType === 'presentation' ? _UNO('.uno:PresentationCurrentSlide', 'presentation') : '';
		case 'insertpage':
			return docType === 'presentation' ? _UNO('.uno:TaskPaneInsertPage', 'presentation') : _UNO('.uno:InsertPage', 'presentation');
		case 'duplicatepage':
			return docType === 'presentation' ? _UNO('.uno:DuplicateSlide', 'presentation') : _UNO('.uno:DuplicatePage', 'presentation');
		case 'deletepage':
			return docType === 'presentation' ? _UNO('.uno:DeleteSlide', 'presentation') : _UNO('.uno:DeletePage', 'presentation');
		}
		return '';
	},

	// 切換縮圖視窗工具列上的投影按鈕
	_switchPresentationButton: function(isOff) {
		if (!isOff && this.map.getDocType() === 'presentation') {
			this._bar.show('presentation', 'presentationcurrentslide', 'presentationbreak');
		} else {
			this._bar.hide('presentation', 'presentationcurrentslide', 'presentationbreak');
		}
	},

	onWopiProps: function(e) {
		this._switchPresentationButton(e.HideExportOption === true);
	},

	onUpdatePermission: function(e) {
		this._switchPresentationButton(this.map['wopi'].HideExportOption === true);
		if (e.perm === 'edit') {
			$('#presentation-toolbar').show();
		} else {
			$('#presentation-toolbar').hide();
		}
	},
});

L.control.presentationBar = function (options) {
	return new L.Control.PresentationBar(options);
};
