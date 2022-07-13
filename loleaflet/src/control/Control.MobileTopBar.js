/* -*- js-indent-level: 8 -*- */
/*
 * L.Control.SearchBar
 */

/* global $ _ _UNO app */
L.Control.MobileTopBar = L.Control.extend({

	options: {
		doctype: 'text'
	},

	_bar: null,

	initialize: function (docType) {
		L.setOptions(this, {docType: docType});
	},

	onAdd: function (map) {
		this.map = map;
		this.create();
		// 暫時關掉選單按鈕
		$('#toolbar-hamburger').css('width', '0');

		map.on('updatepermission', this.onUpdatePermission, this);
	},

	getToolItems: function(docType) {
		var items = [
			{	// 分隔線
				type: 'break', id: 'undoredobreak',
				applyDocType: 'all', applyPermission: {'edit': true},
			},
			{	// 復原
				type: 'button',  id: 'undo',  img: 'undo', hint: _UNO('.uno:Undo'), uno: '.uno:Undo',
				applyDocType: 'all', applyPermission: {'edit': true},
				stateChange: true
			},
			{	// 重做
				type: 'button',  id: 'redo',  img: 'redo', hint: _UNO('.uno:Redo'), uno: '.uno:Redo',
				applyDocType: 'all', applyPermission: {'edit': true},
				stateChange: true
			},
			{	// 接受公式
				type: 'button', id: 'acceptformula', img: 'ok', hint: _('Accept'), applyDocType: {spreadsheet: true}, applyPermission: {'edit': true}, hidden: true
			},
			{	// 拒絕公式
				type: 'button', id: 'cancelformula', img: 'cancel', hint: _('Cancel'), applyDocType: {spreadsheet: true}, applyPermission: {'edit': true}, hidden: true
			},
			{	// 彈簧(撐開用)
				type: 'spacer', applyDocType: 'all', applyPermission: 'all'
			},
			{
				type: 'button',  id: 'mobile_wizard', img: 'mobile_wizard',
				applyDocType: 'all', applyPermission: {'edit': true},
			},
			{	// 插入選單
				type: 'button',  id: 'insertion_mobile_wizard', img: 'insertion_mobile_wizard',
				applyDocType: 'all', applyPermission: {'edit': true},
			},
			{	// 檢視註解
				type: 'button',  id: 'comment_wizard', img: 'mobile_comment_wizard',
				applyDocType: 'all', applyPermission: 'all'
			},
			{	// impress: 投影
				type: 'button', id: 'fullscreen-' + docType, img: 'fullscreen-presentation', hint: _UNO('.uno:FullScreen', docType),
				applyDocType: {presentation: true}, applyPermission: 'all'
			},
			{	// 使用者列表
				type: 'drop', id: 'userlist', img: 'users', hidden: true, html: L.control.createUserListWidget()
			},
		];

		return items;
	},

	create: function() {
		var toolItems = this.getToolItems(this.options.docType);
		var that = this;

		var toolbar = $('#toolbar-up');
		this._bar = toolbar.w2toolbar({
			name: 'actionbar',
			items: toolItems,
			onClick: function (e) {
				that.onClick(e, e.target, e.item);
				window.hideTooltip(this, e.target);
			}
		});

		this.map.uiManager.enableTooltip(toolbar);
		this.map.setupStateChangesForToolbar({toolbar: this._bar});

		toolbar.bind('touchstart', function(e) {
			that._bar.touchStarted = true;
			var touchEvent = e.originalEvent;
			if (touchEvent && touchEvent.touches.length > 1) {
				L.DomEvent.preventDefault(e);
			}
		});
	},

	onClick: function(e, id, item) {
		var toolbar = this._bar;

		// In the iOS app we don't want clicking on the toolbar to pop up the keyboard.
		if (!window.ThisIsTheiOSApp && id !== 'mobile_wizard' && id !== 'insertion_mobile_wizard') {
			this.map.focus(this.map.canAcceptKeyboardInput()); // Maintain same keyboard state.
		}

		if (item.disabled === true) {
			return;
		}

		if (item.uno) {
			this.map.executeAllowedCommand(item.uno);
		}
		else if (id === 'cancelformula') {
			this.map.dispatch('cancelformula');
		}
		else if (id === 'acceptformula') {
			this.map.dispatch('acceptformula');
		}
		else if (id === 'comment_wizard') {
			if (window.commentWizard) {
				window.commentWizard = false;
				app.sectionContainer.getSectionWithName(L.CSections.CommentList.name).removeHighlighters();
				this.map.fire('closemobilewizard');
				toolbar.uncheck(id);
			}
			else {
				if (window.insertionMobileWizard)
					this.onClick(null, 'insertion_mobile_wizard');
				else if (window.mobileWizard)
					this.onClick(null, 'mobile_wizard');
				window.commentWizard = true;
				var menuData =this.map._docLayer.getCommentWizardStructure();
				this.map.fire('mobilewizard', {data: menuData});
				toolbar.check(id);
			}
		}
		else if (id === 'fullscreen-drawing') {
			if (item.checked) {
				toolbar.uncheck(id);
			}
			else {
				toolbar.check(id);
			}
			L.toggleFullScreen();
		}
		else if (id === 'fullscreen-presentation') {
			// Call global onClick handler
			window.onClick(e, id, item);
		}
		else if (id === 'mobile_wizard') {
			if (window.mobileWizard) {
				window.mobileWizard = false;
				this.map.sendUnoCommand('.uno:SidebarHide');
				this.map.fire('closemobilewizard');
				toolbar.uncheck(id);
			}
			else {
				if (window.insertionMobileWizard)
					this.onClick(null, 'insertion_mobile_wizard');
				else if (window.commentWizard)
					this.onClick(null, 'comment_wizard');
				window.mobileWizard = true;
				this.map.sendUnoCommand('.uno:SidebarShow');
				this.map.fire('showwizardsidebar');
				toolbar.check(id);
			}
		}
		else if (id === 'insertion_mobile_wizard') {
			if (window.insertionMobileWizard) {
				window.insertionMobileWizard = false;
				this.map.fire('closemobilewizard');
				toolbar.uncheck(id);
			}
			else {
				if (window.mobileWizard)
					this.onClick(null, 'mobile_wizard');
				else if (window.commentWizard)
					this.onClick(null, 'comment_wizard');
				window.insertionMobileWizard = true;
				menuData = this.map.menubar.generateInsertMenuStructure();
				this.map.fire('mobilewizard', {data: menuData});
				toolbar.check(id);
			}
		}
		else if (id === 'userlist') {
			this.map.fire('openuserlist');
		}
	},

	onUpdatePermission: function(e) {
		if (this._bar) {
			var docType = this.map.getDocType(); // 文件類型
			var idArray = this._bar.get(); // 工具列所有 id
			idArray.forEach(function(id) {
				var item = this._bar.get(id);
				if (item) {
					var rightDocType = item.applyDocType === 'all' || (item.applyDocType && item.applyDocType[docType] === true);
					var rightPermission = item.applyPermission === 'all' || (item.applyPermission && item.applyPermission[e.perm] === true);
					if (rightDocType && rightPermission) {
						this._bar.show(id);
					} else {
						this._bar.hide(id);
					}
				}
			}.bind(this));
		}
	},
});

L.control.mobileTopBar = function (docType) {
	return new L.Control.MobileTopBar(docType);
};
