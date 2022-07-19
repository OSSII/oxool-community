/* -*- js-indent-level: 8 -*- */
/*
 * L.Control.StatusBar
 */

/* global $ w2ui _ _UNO */
L.Control.StatusBar = L.Control.extend({

	_bar: null, // 紀錄自己的 toolbar

	initialize: function () {
	},

	onAdd: function (map) {
		this.map = map;
		map.on('doclayerinit', this.onDocLayerInit, this);
		map.on('commandvalues', this.onCommandValues, this);
		map.on('updatepermission', this.onPermissionChanged, this);
		this.create();

		$(window).resize(function() {
			if ($(window).width() !== map.getSize().x) {
				var statusbar = w2ui['actionbar'];
				statusbar.resize();
			}
		});
	},

	onRemove: function() {
		// 移除 toolbar item state change 註冊
		this.map.setupStateChangesForToolbar({toolbar: this._bar, remove: true});

		this.map.off('doclayerinit', this.onDocLayerInit, this);
		this.map.off('commandvalues', this.onCommandValues, this);
		this.map.off('updatepermission', this.onPermissionChanged, this);
	},

	hideTooltip: function(toolbar, id) {
		if (toolbar.touchStarted) {
			setTimeout(function() {
				toolbar.tooltipHide(id, {});
			}, 5000);
			toolbar.touchStarted = false;
		}
	},

	onClick: function(e, id, item, subItem) {
		if ('actionbar' in w2ui && w2ui['actionbar'].get(id) !== null) {
			var toolbar = w2ui['actionbar'];
			item = toolbar.get(id);
		}

		// In the iOS app we don't want clicking on the toolbar to pop up the keyboard.
		if (!window.ThisIsTheiOSApp && id !== 'zoomin' && id !== 'zoomout' && id !== 'mobile_wizard' && id !== 'insertion_mobile_wizard') {
			this.map.focus(this.map.canAcceptKeyboardInput()); // Maintain same keyboard state.
		}

		if (item.disabled) {
			return;
		}

		var docLayer = this.map._docLayer;

		if (item.uno) {
			this._map.executeAllowedCommand(item.uno);
		}
		else if (id === 'zoomin' && this.map.getZoom() < this.map.getMaxZoom()) {
			this.map.zoomIn(1, null, true /* animate? */);
		}
		else if (id === 'zoomout' && this.map.getZoom() > this.map.getMinZoom()) {
			this.map.zoomOut(1, null, true /* animate? */);
		}
		else if (item.scale) {
			this.map.setZoom(item.scale, null, true /* animate? */);
		}
		else if (id === 'zoomreset') {
			this.map.setZoom(this.map.options.zoom, null, true);
		}
		else if (id === 'prev' || id === 'next') {
			if (docLayer._docType === 'text') {
				this.map.goToPage(id);
			}
			else {
				this.map.setPart(id);
			}
		}
		else if (id === 'searchprev') {
			this.map.search(L.DomUtil.get('search-input').value, true);
		}
		else if (id === 'searchnext') {
			this.map.search(L.DomUtil.get('search-input').value);
		}
		else if (id === 'cancelsearch') {
			this._cancelSearch();
		}
		else if (id.startsWith('StatusBarFunc') && subItem) {
			e.done(function () {
				var menu = w2ui['actionbar'].get('StatusBarFunc');
				if (subItem.id === '1') { // 'None' was clicked, remove all other options
					menu.selected = ['1'];
				}
				else { // Something else was clicked, remove the 'None' option from the array
					var index = menu.selected.indexOf('1');
					if (index > -1) {
						menu.selected.splice(index, 1);
					}
				}
				var value = 0;
				for (var it = 0; it < menu.selected.length; it++) {
					value = +value + parseInt(menu.selected[it]);
				}
				var command = {
					'StatusBarFunc': {
						type: 'unsigned short',
						value: value
					}
				};
				this.map.sendUnoCommand('.uno:StatusBarFunc', command);
			}.bind(this));
		}
		else if (id === 'userlist') {
			this.map.fire('openuserlist');
		}
		else if (id === 'signstatus') {
			this.map.sendUnoCommand('.uno:Signature');
		}
	},

	create: function() {
		var toolbar = $('#toolbar-down');
		var that = this;

		{
			this._bar = toolbar.w2toolbar({
				name: 'actionbar',
				items: [
					{type: 'html',  id: 'search',
						html: '<div class="oxool-font">' +
					'<label for="search-input" class="visuallyhidden" aria-hidden="false">Search:</label>' +
					'<input size="15" id="search-input" placeholder="' + _('Search') + '"' +
					'style="padding: 3px; border-radius: var(--border-radius); border: 1px solid var(--color-border)"/>' +
					'</div>'
					},
					{type: 'button',  id: 'searchprev', img: 'prev', hint: _UNO('.uno:UpSearch'), disabled: true},
					{type: 'button',  id: 'searchnext', img: 'next', hint: _UNO('.uno:DownSearch'), disabled: true},
					{type: 'button',  id: 'cancelsearch', img: 'cancel', hint: _('Cancel the search'), hidden: true},
					{type: 'html',  id: 'left'},
					{type: 'html',  id: 'right'},
					{type: 'drop', id: 'userlist', img: 'users', hidden: true, html: L.control.createUserListWidget()},
					{type: 'break', id: 'userlistbreak', hidden: true, mobile: false },
					{type: 'button',  id: 'prev', img: 'prev', hint: _UNO('.uno:PageUp', 'text')},
					{type: 'button',  id: 'next', img: 'next', hint: _UNO('.uno:PageDown', 'text')},
					{type: 'break', id: 'prevnextbreak'},
				].concat(window.mode.isTablet() ? [] : [
					{type: 'button',  id: 'zoomreset', img: 'zoomreset', hint: _('Reset zoom')},
					{type: 'button',  id: 'zoomout', img: 'zoomout', hint: _UNO('.uno:ZoomMinus')},
					{type: 'menu-radio', id: 'zoom', text: '100',
						selected: 'zoom100',
						mobile: false,
						items: [
							{ id: 'zoom20', text: '20', scale: 1},
							{ id: 'zoom25', text: '25', scale: 2},
							{ id: 'zoom30', text: '30', scale: 3},
							{ id: 'zoom35', text: '35', scale: 4},
							{ id: 'zoom40', text: '40', scale: 5},
							{ id: 'zoom50', text: '50', scale: 6},
							{ id: 'zoom60', text: '60', scale: 7},
							{ id: 'zoom70', text: '70', scale: 8},
							{ id: 'zoom85', text: '85', scale: 9},
							{ id: 'zoom100', text: '100', scale: 10},
							{ id: 'zoom120', text: '120', scale: 11},
							{ id: 'zoom150', text: '150', scale: 12},
							{ id: 'zoom175', text: '175', scale: 13},
							{ id: 'zoom200', text: '200', scale: 14},
							{ id: 'zoom235', text: '235', scale: 15},
							{ id: 'zoom280', text: '280', scale: 16},
							{ id: 'zoom335', text: '335', scale: 17},
							{ id: 'zoom400', text: '400', scale: 18},
						]
					},
					{type: 'button',  id: 'zoomin', img: 'zoomin', hint: _UNO('.uno:ZoomPlus')}
				]),
				onClick: function (e) {
					that.hideTooltip(this, e.target);
					// 被點擊的選項
					var clickedItem = (e.subItem ? e.subItem : e.item);
					// item 沒有自己的 onClick 事件，才執行系統的 onClick 事件
					if (typeof(clickedItem.onClick) !== 'function') {
						that.onClick(e, e.target, e.item, e.subItem);
					}
				},
				onRefresh: function() {
					$('#tb_actionbar_item_userlist .w2ui-tb-caption').addClass('oxool-font');
					window.setupSearchInput();
				}
			});
			this.map.uiManager.enableTooltip(toolbar);
		}

		toolbar.bind('touchstart', function() {
			w2ui['actionbar'].touchStarted = true;
		});

		this.map.on('zoomend', function () {
			var zoomPercent = 100;
			var zoomSelected = null;
			switch (that.map.getZoom()) {
			case 1:  zoomPercent =  20; zoomSelected = 'zoom20'; break;  // 0.2102
			case 2:  zoomPercent =  25; zoomSelected = 'zoom25'; break;  // 0.2500
			case 3:  zoomPercent =  30; zoomSelected = 'zoom30'; break;  // 0.2973
			case 4:  zoomPercent =  35; zoomSelected = 'zoom35'; break;  // 0.3535
			case 5:  zoomPercent =  40; zoomSelected = 'zoom40'; break;  // 0.4204
			case 6:  zoomPercent =  50; zoomSelected = 'zoom50'; break;  // 0.5
			case 7:  zoomPercent =  60; zoomSelected = 'zoom60'; break;  // 0.5946
			case 8:  zoomPercent =  70; zoomSelected = 'zoom70'; break;  // 0.7071
			case 9:  zoomPercent =  85; zoomSelected = 'zoom85'; break;  // 0.8409
			case 10: zoomPercent = 100; zoomSelected = 'zoom100'; break; // 1
			case 11: zoomPercent = 120; zoomSelected = 'zoom120'; break; // 1.1892
			// Why do we call this 150% even if it is actually closer to 140%
			case 12: zoomPercent = 150; zoomSelected = 'zoom150'; break; // 1.4142
			case 13: zoomPercent = 170; zoomSelected = 'zoom170'; break; // 1.6818
			case 14: zoomPercent = 200; zoomSelected = 'zoom200'; break; // 2
			case 15: zoomPercent = 235; zoomSelected = 'zoom235'; break; // 2.3784
			case 16: zoomPercent = 280; zoomSelected = 'zoom280'; break; // 2.8284
			case 17: zoomPercent = 335; zoomSelected = 'zoom335'; break; // 3.3636
			case 18: zoomPercent = 400; zoomSelected = 'zoom400'; break; // 4
			default:
				var zoomRatio = that.map.getZoomScale(that.map.getZoom(), that.map.options.zoom);
				zoomPercent = Math.round(zoomRatio * 100);
				break;
			}
			w2ui['actionbar'].set('zoom', {text: zoomPercent, selected: zoomSelected});
		});
	},

	onDocLayerInit: function () {
		var map = this.map;
		var statusbar = this._bar;
		var docType = this.map.getDocType();
		var isReadOnly = !map.isPermissionEdit();

		var languageStatus = function(e) {
			var id = 'LanguageStatus';
			var item = statusbar.get(id);
			item.disabled = e.disabled();
			item.checked = e.checked();
			if (e.hasValue()) {
				var code = e.value();
				var language = _(code);
				var split = code.split(';');
				if (split.length > 1) {
					language = _(split[0]);
					code = split[1];
				}
				item.text = language;
				item.selected = language;
			}
			statusbar.refresh(id);
		};

		var insertMode = function(e) {
			var state = (e.state === 'true' || e.state === 'false') ? e.state : '';
			var mode = e.checked() ? _('Insert') : _('Overwrite');
			this.html = '<div id="InsertMode" class="oxool-font insert-mode-' + state + '" title="' + _('Entering text mode') + '" style="padding: 5px 5px;">' + mode + '</div>';
			statusbar.refresh(this.id);

			if (state === '') {return;}

			if (!e.checked() && map.hyperlinkPopup) {
				map.hyperlinkUnderCursor = null;
				map.closePopup(map.hyperlinkPopup);
				map.hyperlinkPopup = null;
			}
		};

		switch (docType) {
		case 'spreadsheet':
			{
				statusbar.insert('left', [
					{type: 'break', id: 'break1'},
					{
						type: 'button', id: 'StatusDocPos', text: '', hint: _('Number of Sheets') + '(' + _('Click to go to the specified worksheet') + ')',
						onClick: function() {
							L.dialog.run('GotoPage');
						},
						stateChange: function(e) {
							map.simpleStateChecker(e, this); // 檢查 checked & disabled
							this.text = e.value();
							statusbar.refresh(this.id);
						}
					},
					{type: 'break', id: 'break2'},
					{
						type: 'html', id: 'RowColSelCount',
						html: '',
						stateChange: function(e) {
							var value = e.hasValue() ? e.value() : '';
							map.simpleStateChecker(e, this); // 檢查 checked & disabled
							this.html = '<div title="' + _('Selected range of cells') + '" style="padding: 5px 5px;">' + value + '</div>';
							statusbar.refresh(this.id);
						}
					},
					{type: 'break', id: 'break3', tablet: false},
					{
						type: 'html', id: 'InsertMode', mobile: false, tablet: false,
						html: '',
						stateChange: insertMode
					},
					{type: 'break', id: 'break4', tablet: false},
					{
						type: 'menu-radio', id: 'LanguageStatus', mobile: false,
						stateChange: languageStatus

					},
					{type: 'break', id: 'break5', tablet: false},
					{
						type: 'menu-radio', id: 'StatusSelectionMode', mobile: false, tablet: false,
						text: _('Standard selection'),
						selected: '0',
						items: [
							{id: '0', text: _('Standard selection'), uno: '.uno:StatusSelectionMode'},
							{id: '1', text: _('Extending selection'), uno: '.uno:StatusSelectionModeExt'},
							{id: '2', text: _('Adding selection'), uno: '.uno:StatusSelectionModeExp'}
						],
						stateChange: function(e) {
							map.simpleStateChecker(e, this); // 檢查 checked & disabled
							// 有值才改變內容
							if (e.hasValue()) {
								var selectedItem = this.items[parseInt(e.value())];
								this.text = selectedItem.text;
								this.selected = selectedItem.id;
							}
							// 更新此 toolbar 項目
							statusbar.refresh(this.id);
						}
					},
					{type: 'break', id: 'break8', mobile: false, tablet: false},
					{
						type: 'html', id: 'StateTableCell', mobile: false, tablet: false,
						html: '',
						stateChange: function(e) {
							var value = e.hasValue() ? e.value() : '';
							map.simpleStateChecker(e, this); // 檢查 checked & disabled
							this.html = '<div title="' + _('Choice of functions') + '" style="padding: 5px 5px;">' + value + '</div>';
							statusbar.refresh(this.id);
						}
					},
					{
						type: 'menu-check', id: 'StatusBarFunc', caption: '', selected: ['2', '512'], tablet: false,
						items: [
							{id: '2', text: _('Average')},
							{id: '8', text: _('CountA')},
							{id: '4', text: _('Count')},
							{id: '16', text: _('Maximum')},
							{id: '32', text: _('Minimum')},
							{id: '512', text: _('Sum')},
							{id: '8192', text: _('Selection count')},
							{id: '1', text: _('None')}
						],
						stateChange: function(e) {
							var state = e.state;
							this.selected = [];
							// Check 'None' even when state is 0
							if (state === '0') {
								state = 1;
							}
							for (var it = 0; it < this.items.length; it++) {
								if (this.items[it].id & state) {
									this.selected.push(this.items[it].id);
								}
							}
							statusbar.refresh(this.id);
						}
					},
					{type: 'break', id: 'break9', mobile: false},
					{
						type: 'html', id: 'PermissionMode', mobile: false, tablet: false,
						html: this._getPermissionModeHtml(isReadOnly)
					}
				]);
			}
			break;

		case 'text':
			{
				statusbar.insert('left', [
					{type: 'break', id: 'break1'},
					{
						type: 'button', text: '', id: 'StatePageNumber', hint: _('Number of Pages') + '(' + _('Click to go to the specified page') + ')',
						onClick: function() {
							L.dialog.run('GotoPage');
						},
						stateChange: function(e) {
							map.simpleStateChecker(e, this); // 檢查 checked & disabled
							this.text = e.value();
							statusbar.refresh(this.id);
						}
					},
					{type: 'break', id: 'break2'},
					{
						type: 'button', text: '', id: 'StateWordCount', hint: _('Word Counter') + '(' + _('Click to open the Detailed Word Count dialog') + ')',
						mobile: false, tablet: false,
						onClick: function() {
							map.sendUnoCommand('.uno:WordCountDialog');
						},
						stateChange: function(e) {
							map.simpleStateChecker(e, this); // 檢查 checked & disabled
							this.text = e.value();
							statusbar.refresh(this.id);
						}
					},
					{type: 'break', id: 'pagestylebreak'},
					{
						type: 'button', text: '', id: 'PageStyle', hint: _('Page Style') + '(' + _('Click to open the styles dialog') + ')',
						mobile: false, tablet: false,
						onClick: function() {
							map.sendUnoCommand('.uno:PageDialog');
						},
						stateChange: function(e) {
							map.simpleStateChecker(e, this); // 檢查 checked & disabled
							this.text = e.value();
							statusbar.refresh(this.id);
						}
					},
					{type: 'break', id: 'break5', mobile: false, tablet: false},
					{
						type: 'html', id: 'InsertMode', mobile: false, tablet: false,
						html: '',
						stateChange: insertMode
					},
					{type: 'break', id: 'break6', mobile: false, tablet: false},
					{
						type: 'menu-radio', id: 'LanguageStatus', mobile: false,
						stateChange: languageStatus
					},
					{type: 'break', id: 'break8', mobile: false},
					{
						type: 'html', id: 'PermissionMode', mobile: false, tablet: false,
						html: this._getPermissionModeHtml(isReadOnly)
					}
				]);
			}
			break;

		case 'presentation':
			{
				statusbar.insert('left', [
					{type: 'break', id: 'break1'},
					{
						type: 'html', id: 'PageStatus',
						html: '',
						stateChange: function(e) {
							map.simpleStateChecker(e, this); // 檢查 checked & disabled
							this.html = '<div class="oxool-font" title="' + _('Number of Slides') + '" style="padding: 5px 5px;">' + (e.hasValue() ? e.value() : '') + '</div>';
							statusbar.refresh(this.id);
						}
					},
					{type: 'break', id: 'break2', mobile: false, tablet: false},
					{
						type: 'menu-radio', id: 'LanguageStatus', mobile: false,
						stateChange: languageStatus
					},
					{type: 'break', id: 'break8', mobile: false},
					{
						type: 'html', id: 'PermissionMode', mobile: false, tablet: false,
						html: this._getPermissionModeHtml(isReadOnly)
					}
				]);
			}
			break;
		case 'drawing':
			{
				statusbar.insert('left', [
					{type: 'break', id: 'break1'},
					{
						type: 'html', id: 'PageStatus',
						html: '<div id="PageStatus" class="oxool-font" title="' + _('Number of Pages') + '" style="padding: 5px 5px;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp</div>'
					},
					{type: 'break', id: 'break2', mobile: false, tablet: false},
					{type: 'menu-radio', id: 'LanguageStatus',
						mobile: false
					},
					{type: 'break', id: 'break8', mobile: false},
					{
						type: 'html', id: 'PermissionMode', mobile: false, tablet: false,
						html: this._getPermissionModeHtml(isReadOnly)
					}
				]);
			}
			break;
		}

		this._checkStatusPermission();

		this.map.fire('updateuserlistcount');

		window.updateVisibilityForToolbar(statusbar);

		if (statusbar) {
			statusbar.refresh();
			this.map.setupStateChangesForToolbar({toolbar: statusbar});
		}

		// Added by Firefly <firefly@ossii.com.tw>
		// 使用者自訂存放於 localstorage
		var showStatusbar = this.map.uiManager.getSavedStateOrDefault('ShowStatusbar');
		this.map.sendUnoCommand('.uno:StatusBarVisible', {
			StatusBarVisible: {
				type: 'boolean',
				value: showStatusbar
			}
		});

		// 監控狀態列顯示與否
		this.map.stateChangeHandler.on('.uno:StatusBarVisible', function(e) {
			// 編輯模式才可以顯示/隱藏狀態列
			if (this.map.isPermissionEdit()) {
				if (e.checked()) {
					this.map.uiManager.showStatusBar();
				} else {
					this.map.uiManager.hideStatusBar();
				}
			}
		}, this);
	},

	_cancelSearch: function() {
		var toolbar = w2ui['actionbar'];
		var searchInput = L.DomUtil.get('search-input');
		this.map.resetSelection();
		toolbar.hide('cancelsearch');
		toolbar.disable('searchprev');
		toolbar.disable('searchnext');
		searchInput.value = '';

		this.map._onGotFocus();
	},

	_getPermissionModeHtml: function(isReadOnly) {
		return '<div id="PermissionMode" class="' +
			(isReadOnly
				? 'status-readonly-mode" title="' + _('Permission Mode') + '">' + _('Read-only') + '</div>'
				: 'status-edit-mode" title="' + _('Permission Mode') + '">' + _('Edit') + '</div>');
	},

	onPermissionChanged: function(/* event */) {
		this._checkStatusPermission();
	},

	_checkStatusPermission: function() {
		var isReadOnly = !this._map.isPermissionEdit();
		var docType = this._map.getDocType();
		// 更新編輯權限顯示
		$('#PermissionMode').parent().html(this._getPermissionModeHtml(isReadOnly));
		// 依據權限顯示或隱藏某些狀態
		if (isReadOnly) {
			switch (docType) {
			case 'spreadsheet':
				this._bar.hide('break2', 'RowColSelCount', 'break3', 'InsertMode', 'break4', 'LanguageStatus',
					'break5', 'StatusSelectionMode', 'break8', 'StateTableCell', 'StatusBarFunc');
				break;
			case 'text':
				this._bar.hide('pagestylebreak', 'PageStyle', 'break5', 'InsertMode', 'break6', 'LanguageStatus');
				break;
			case 'presentation':
			case 'drawing':
				this._bar.hide('break2', 'LanguageStatus');
				break;
			}
			// 唯讀模式狀態列強制顯示
			$('#toolbar-down').show();
		} else {
			switch (docType) {
			case 'spreadsheet':
				this._bar.show('break2', 'RowColSelCount', 'break3', 'InsertMode', 'break4', 'LanguageStatus',
					'break5', 'StatusSelectionMode', 'break8', 'StateTableCell', 'StatusBarFunc');
				break;
			case 'text':
				this._bar.show('pagestylebreak', 'PageStyle', 'break5', 'InsertMode', 'break6', 'LanguageStatus');
				break;
			case 'presentation':
			case 'drawing':
				this._bar.show('break2', 'LanguageStatus');
				break;
			}
		}
	},

	onCommandValues: function(e) {
		if (e.commandName === '.uno:LanguageStatus' && L.Util.isArray(e.commandValues)) {
			var translated, neutral;
			var constLang = '.uno:LanguageStatus?Language:string=';
			var constDefault = 'Default_RESET_LANGUAGES';
			var constNone = 'Default_LANGUAGE_NONE';
			var resetLang = _('Reset to Default Language');
			var noneLang = _('None (Do not check spelling)');
			var languages = [];
			e.commandValues.forEach(function (language) {
				languages.push({ translated: _(language.split(';')[0]), neutral: language });
			});
			languages.sort(function (a, b) {
				return a.translated < b.translated ? -1 : a.translated > b.translated ? 1 : 0;
			});

			var toolbaritems = [];
			toolbaritems.push({ text: noneLang,
			 id: 'nonelanguage',
			 uno: constLang + constNone });


			for (var lang in languages) {
				translated = languages[lang].translated;
				neutral = languages[lang].neutral;
				var splitNeutral = neutral.split(';');
				toolbaritems.push({ id: neutral, text: translated, uno: constLang + encodeURIComponent('Default_' + splitNeutral[0]) });
			}

			toolbaritems.push({ id: 'reset', text: resetLang, uno: constLang + constDefault });

			this._bar.set('LanguageStatus', {items: toolbaritems});
		}
	},
});

L.control.statusBar = function () {
	return new L.Control.StatusBar();
};
