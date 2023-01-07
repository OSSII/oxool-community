/* -*- js-indent-level: 8 -*- */
/*
 * L.Control.Tabs is used to switch sheets in Calc
 */

/* global $ _ _UNO Hammer */
L.Control.Tabs = L.Control.extend({
	onAdd: function(map) {
		map.on('updatepermission', this._onUpdatePermission, this);
		this._initialized = false;
	},

	_onUpdatePermission: function(e) {
		if (this._map.getDocType() !== 'spreadsheet') {
			return;
		}

		if (!this._initialized) {
			this._initialize();
		}
		setTimeout(function() {
			$('.spreadsheet-tab').contextMenu(e.perm === 'edit');
		}, 100);

		if (window.mode.isMobile()) {
			if (e.perm === 'edit') {
				document.getElementById('spreadsheet-toolbar').style.display = 'block';
			}
			else {
				document.getElementById('spreadsheet-toolbar').style.display = 'none';
			}
		}
	},

	_initialize: function () {
		this._initialized = true;
		this._tabsInitialized = false;
		this._spreadsheetTabs = {};
		this._tabForContextMenu = 0;
		var map = this._map;
		var tableCell = document.getElementById('tb_spreadsheet-toolbar_right');
		tableCell.style.verticalAlign = 'middle';
		this._tabsCont = L.DomUtil.create('div', 'spreadsheet-tabs-container', tableCell);
		var that = this;
		function areTabsMultiple() {
			var numItems = $('.spreadsheet-tab').length;
			if (numItems === 1) {
				return false;
			}
			return true;
		}

		// 手機模式和其他模式右鍵選單須分開處理
		if (window.mode.isMobile()) {
			this._menuItem = {
				'insertsheetbefore': {name: _('Insert sheet before this'),
					callback: (this._insertSheetBefore).bind(this)
				},
				'insertsheetafter': {name: _('Insert sheet after this'),
					callback: (this._insertSheetAfter).bind(this)
				},
				'.uno:Remove': {
					name: _UNO('.uno:Remove', 'spreadsheet', true),
					callback: function() {map.executeAllowedCommand('.uno:Remove');}
				},
				'.uno:RenameTable': {name: _UNO('.uno:RenameTable', 'spreadsheet', true),
					callback: function() {map.executeAllowedCommand('.uno:RenameTable');}
				},
				'.uno:Show': {
					name: _UNO('.uno:Show', 'spreadsheet', true),
					callback: function() {map.executeAllowedCommand('.uno:Show');}
				},
				'.uno:Hide': {
					name: _UNO('.uno:Hide', 'spreadsheet', true),
					callback: function() {map.executeAllowedCommand('.uno:Hide');}
				},
				'movesheetleft': {
					name: _('Move Sheet Left'),
					callback: (this._moveSheetLeft).bind(this)
				},
				'movesheetright': {
					name: _('Move Sheet Right'),
					callback: (this._moveSheetRight).bind(this)
				},
				'.uno:ToggleSheetGrid': {
					name: _UNO('.uno:ToggleSheetGrid', 'spreadsheet', true),
					callback: function() {map.executeAllowedCommand('.uno:ToggleSheetGrid');}
				}
			};
		} else {
			this._menuItem = {
				// 前方插工作表
				'insertsheetbefore': {
					icon: '.uno:InsertColumnsBefore',
					name: _('Insert sheet before this'),
					callback: (this._insertSheetBefore).bind(this)
				},
				// 後方插工作表
				'insertsheetafter': {
					icon: '.uno:InsertColumnsAfter',
					name: _('Insert sheet after this'),
					callback: (this._insertSheetAfter).bind(this)
				},
				// 刪除工作表
				'.uno:Remove': {
					visible: function() {
						return (areTabsMultiple && !map.isPartProtected());
					}
				},
				// 重新命名工作表
				'.uno:RenameTable': {
					name: _UNO('.uno:RenameTable', 'spreadsheet', true),
					callback: function() {
						map.executeAllowedCommand('.uno:RenameTable');
					},
					/* visible: function() {
						return !map.isPartProtected();
					} */
				},
				// 移動或複製工作表
				'.uno:Move': {
				},
				/* // 選取全部工作表
				'.uno:TableSelectAll': {
					callback: function() {
						map.sendUnoCommand('.uno:TableSelectAll');
					}
				},
				// 取消選取全部工作表
				'.uno:TableDeselectAll': {

				}, */
				'sep01': '--',
				// 隱藏工作表
				'.uno:Hide': {
					visible: areTabsMultiple
				},
				// 顯示工作表
				'.uno:Show': {
					visible: function() {
						return that._map.hasAnyHiddenPart();
					}
				},
				'sep02': '--',
				// 檢視格線
				'.uno:ToggleSheetGrid': {
				}
			};
			L.installContextMenu({
				selector: '.spreadsheet-tab',
				className: 'oxool-font',
				trigger: 'none',
				items: this._menuItem,
				zIndex: 1000
			});
		}

		map.on('updateparts', this._updateDisabled, this);
	},

	_updateDisabled: function (e) {
		var parts = e.parts;
		var selectedPart = e.selectedPart;
		var docType = e.docType;

		if (docType === 'text') {
			return;
		}
		if (docType === 'spreadsheet') {
			if (!this._tabsInitialized) {
				// make room for the preview
				var docContainer = this._map.options.documentContainer;
				L.DomUtil.addClass(docContainer, 'spreadsheet-document');
				this._tabsInitialized = true;
			}

			// Save scroll position
			var horizScrollPos = 0;
			var scrollDiv = L.DomUtil.get('spreadsheet-tab-scroll');
			if (scrollDiv) {
				horizScrollPos = scrollDiv.scrollLeft;
			}

			if ('partNames' in e) {
				while (this._tabsCont.firstChild) {
					this._tabsCont.removeChild(this._tabsCont.firstChild);
				}
				var ssTabScroll = L.DomUtil.create('div', 'spreadsheet-tab-scroll', this._tabsCont);
				ssTabScroll.id = 'spreadsheet-tab-scroll';
				if (!window.mode.isMobile())
					ssTabScroll.style.overflow = 'hidden';

				this._tabsCont.style.display = 'grid';

				var menuItemMobile = {};
				Object.assign(menuItemMobile,
					{
						'insertsheetbefore': this._menuItem['insertsheetbefore'],
						'insertsheetafter': this._menuItem['insertsheetafter'],
						'.uno:RenameTable': this._menuItem['.uno:RenameTable'],
					}
				);
				if (this._map.hasAnyHiddenPart()) {
					Object.assign(menuItemMobile, {
						'.uno:Show': this._menuItem['.uno:Show'],
					});
				}
				if (this._map.getNumberOfVisibleParts() !== 1) {
					Object.assign(menuItemMobile,
						{
							'.uno:Remove': this._menuItem['.uno:Remove'],
							'.uno:Hide': this._menuItem['.uno:Hide'],
						}
					);
				}

				if (window.mode.isMobile()) {
					Object.assign(menuItemMobile,
						{
							'.uno:ToggleSheetGrid': this._menuItem['.uno:ToggleSheetGrid'],
							'.uno:SetTabBgColor': this._menuItem['.uno:SetTabBgColor'],
						}
					);
					var menuData = L.Control.JSDialogBuilder.getMenuStructureForMobileWizard(menuItemMobile, true, '');
				}

				var frame = L.DomUtil.create('div', '', ssTabScroll);
				frame.setAttribute('draggable', false);
				frame.setAttribute('id', 'first-tab-drop-site');
				this._addDnDHandlers(frame);

				for (var i = 0; i < parts; i++) {
					if (e.hiddenParts.indexOf(i) !== -1)
						continue;
					var id = 'spreadsheet-tab' + i;
					var tab = L.DomUtil.create('button', 'spreadsheet-tab', ssTabScroll);

					if (window.mode.isMobile()) {
						(new Hammer(tab, {recognizers: [[Hammer.Press]]}))
							.on('press', function (j) {
								return function(e) {
									this._tabForContextMenu = j;
									this._setPart(e);
									window.contextMenuWizard = true;
									if (!this._map.isReadOnlyMode()) this._map.fire('mobilewizard', {data: menuData});
								};
							}(i).bind(this));
					} else if (this._map.isEditMode()) {
						L.DomEvent.on(tab, 'dblclick', function(j) {
							return function() {
								// window.app.console.err('Double clicked ' + j);
								this._tabForContextMenu = j;
								this._map.executeAllowedCommand('.uno:RenameTable');
							};
						}(i).bind(this));
						L.DomEvent.on(tab, 'contextmenu', function(j) {
							return function(e) {
								this._setPart(e);
								this._tabForContextMenu = j;
								$('#spreadsheet-tab' + j).contextMenu({x: e.x, y: e.y});
							};
						}(i).bind(this));
					}

					tab.textContent = e.partNames[i];
					tab.id = id;
					this._setTabInfo(i, tab);

					L.DomEvent
						.on(tab, 'click', L.DomEvent.stopPropagation)
						.on(tab, 'click', L.DomEvent.stop)
						.on(tab, 'click', this._setPart, this)
						.on(tab, 'click', this._map.focus, this._map);
					this._addDnDHandlers(tab);
					this._spreadsheetTabs[id] = tab;
				}
			}
			for (var key in this._spreadsheetTabs) {
				var part = parseInt(key.match(/\d+/g)[0]);
				L.DomUtil.removeClass(this._spreadsheetTabs[key], 'spreadsheet-tab-selected');
				if (part === selectedPart) {
					L.DomUtil.addClass(this._spreadsheetTabs[key], 'spreadsheet-tab-selected');
					var pInfo = this._map.getPartProperty(part); // 讀取工作表屬性
					if (pInfo) {
						var bgColor = pInfo.backgroundColor();
						if (bgColor !== '') {
							$(this._spreadsheetTabs[key]).css('border-bottom-color', bgColor);
						}
					}
				}
			}

			// Restore horizontal scroll position
			scrollDiv = L.DomUtil.get('spreadsheet-tab-scroll');
			if (scrollDiv) {
				if (this._map.insertPage && this._map.insertPage.scrollToEnd) {
					this._map.insertPage.scrollToEnd = false;
					scrollDiv.scrollLeft = scrollDiv.scrollWidth;
				}
				else {
					scrollDiv.scrollLeft = horizScrollPos;
				}
			}
		}
	},

	_addDnDHandlers: function(element) {
		if (!this._map.isReadOnlyMode()) {
			element.setAttribute('draggable', true);
			element.addEventListener('dragstart', this._handleDragStart.bind(this), false);
			element.addEventListener('dragenter', this._handleDragEnter, false);
			element.addEventListener('dragover', this._handleDragOver, false);
			element.addEventListener('dragleave', this._handleDragLeave, false);
			element.addEventListener('drop', this._handleDrop.bind(this), false);
			element.addEventListener('dragend', this._handleDragEnd, false);
		}
	},

	_setPart: function (e) {
		var part =  e.target.id.match(/\d+/g)[0];
		if (part !== null) {
			this._map._docLayer._clearReferences();
			this._map.setPart(parseInt(part), /*external:*/ false, /*calledFromSetPartHandler:*/ true);
		}
	},

	/**
	 * 設定工作表標籤(未選取狀態)
	 * @param {*} idx
	 * @param {*} tab
	 */
	_setTabInfo: function(idx, tab) {
		var pInfo = this._map.getPartProperty(idx);
		if (pInfo) {
			// 設定標籤背景及文字顏色
			var bgColor = pInfo.backgroundColor();
			if (bgColor !== '') {
				var linearColor = '(#f8f8f8,' + bgColor + ')'; // 背景層漸
				$(tab).css({
					'background-color': bgColor,
					'background': 'linear-gradient' + linearColor,
					'color': pInfo.isDark() ? '#ffffff' : '#000000'
				});
			}
			// 工作表是否保護
			if (pInfo.isProtected()) {
				var span = L.DomUtil.create('span', 'spreadsheet-tab-protected', tab);
				tab.insertBefore(span, tab.firstChild);
			}
		}
	},

	//selected sheet is moved to new index
	_moveSheet: function (newIndex) {
		this._map.sendUnoCommand('.uno:Move?Copy:bool=false&UseCurrentDocument:bool=true&Index=' + newIndex);
	},

	_moveSheetLeft: function () {
		var targetIndex = this._map._docLayer._partNames.indexOf(this._map._docLayer._partNames[this._map._docLayer._selectedPart]);
		//core handles sheet with 1 base indexing
		// 0 index means last sheet
		if (targetIndex <= 0) return;
		this._moveSheet(targetIndex);
	},

	_moveSheetRight: function () {
		var targetIndex = this._map._docLayer._partNames.indexOf(this._map._docLayer._partNames[this._map._docLayer._selectedPart]) + 3;
		this._moveSheet(targetIndex);
	},

	_insertSheetBefore: function() {
		this._map.insertPage(this._tabForContextMenu);
	},

	_insertSheetAfter: function() {
		this._map.insertPage(this._tabForContextMenu + 1);
	},

	_handleDragStart: function(e) {
		this._setPart(e);
		e.dataTransfer.effectAllowed = 'move';
	},

	_handleDragEnter: function() {

	},

	_handleDragOver: function(e) {
		if (e.preventDefault) {
			e.preventDefault();
		}

		// By default we move when dragging, but can
		// support duplication with ctrl in the future.
		e.dataTransfer.dropEffect = 'move';

		this.classList.add('tab-dropsite');
		return false;
	},

	_handleDragLeave: function() {
		this.classList.remove('tab-dropsite');
	},

	_handleDrop: function(e) {
		if (e.stopPropagation) {
			e.stopPropagation();
		}
		e.target.classList.remove('tab-dropsite');
		var targetIndex = this._map._docLayer._partNames.indexOf(e.target.innerText);

		this._moveSheet(targetIndex+2);
	},

	_handleDragEnd: function() {
		this.classList.remove('tab-dropsite');
	}
});

L.control.tabs = function (options) {
	return new L.Control.Tabs(options);
};
