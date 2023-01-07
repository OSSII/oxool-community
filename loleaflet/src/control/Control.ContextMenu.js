/* -*- js-indent-level: 8; fill-column: 100 -*- */
/*
* Control.ContextMenu
*/

/* global $ _ _UNO */
L.Control.ContextMenu = L.Control.extend({
	options: {
		SEPARATOR: '---------',
		ASSIGNLAYOUT: '.uno:AssignLayout',

		/*
		 * Enter UNO commands that should appear in the context menu.
		 * Entering a UNO command under `general' would enable it for all types
		 * of documents. If you do not want that, whitelist it in document specific filter.
		 *
		 * UNOCOMMANDS_EXTRACT_START <- don't remove this line, it's used by unocommands.py
		 */
		whitelist: {
			/*
			 * UNO commands for menus are not available sometimes. Presence of Menu commands
			 * in following list is just for reference and ease of locating uno command
			 * from context menu structure.
			 */
			general: ['Cut', 'Copy', 'Paste', 'Delete',
					  'FormatPaintbrush', 'ResetAttributes',
					  'NumberingStart', 'ContinueNumbering', 'IncrementLevel', 'DecrementLevel',
					  'OpenHyperlinkOnCursor', 'EditHyperlink', 'CopyHyperlinkLocation', 'RemoveHyperlink',
					  'AnchorMenu', 'SetAnchorToPage', 'SetAnchorToPara', 'SetAnchorAtChar',
					  'SetAnchorToChar', 'SetAnchorToFrame',
					  'WrapMenu', 'WrapOff', 'WrapOn', 'WrapIdeal', 'WrapLeft', 'WrapRight', 'WrapThrough',
					  'WrapThroughTransparencyToggle', 'WrapContour', 'WrapAnchorOnly',
					  'ArrangeFrameMenu', 'ArrangeMenu', 'BringToFront', 'ObjectForwardOne', 'ObjectBackOne', 'SendToBack',
					  'RotateMenu', 'RotateLeft', 'RotateRight', 'TransformDialog', 'FormatLine', 'FormatArea',
					  'FormatChartArea', 'InsertTitles', 'InsertRemoveAxes',
					  'DeleteLegend', 'DiagramType', 'DataRanges', 'DiagramData', 'View3D',
					  'FormatWall', 'FormatFloor', 'FormatLegend', 'FormatTitle', 'FormatDataSeries',
					  'FormatAxis', 'FormatMajorGrid', 'FormatMinorGrid', 'FormatDataLabels',
					  'FormatDataLabel', 'FormatDataPoint', 'FormatMeanValue', 'FormatXErrorBars', 'FormatYErrorBars',
					  'FormatTrendline', 'FormatTrendlineEquation', 'FormatSelection', 'FormatStockLoss',
					  'FormatStockGain', 'InsertDataLabel' , 'DeleteDataLabel', 'ResetDataPoint',
					  'InsertTrendline', 'InsertMeanValue', 'InsertXErrorBars' , 'InsertYErrorBars', 'ResetAllDataPoints' , 'DeleteAxis',
					  'InsertAxisTitle', 'InsertMinorGrid', 'InsertMajorGrid' , 'InsertAxis', 'DeleteMajorGrid' , 'DeleteMinorGrid',
					  'SpellCheckIgnoreAll', 'LanguageStatus', 'SpellCheckApplySuggestion',
					  'NextTrackedChange', 'PreviousTrackedChange', 'RejectTrackedChange', 'AcceptTrackedChange'],

			text: ['TableInsertMenu',
				   'InsertRowsBefore', 'InsertRowsAfter', 'InsertColumnsBefore', 'InsertColumnsAfter',
				   'TableDeleteMenu', 'SetObjectToBackground', 'SetObjectToForeground',
				   'DeleteRows', 'DeleteColumns', 'DeleteTable',
				   'MergeCells', 'SetOptimalColumnWidth', 'SetOptimalRowHeight',
				   'UpdateCurIndex','RemoveTableOf',
				   'ReplyComment', 'DeleteComment', 'DeleteAuthor', 'DeleteAllNotes',
				   'SpellingAndGrammarDialog', 'FontDialog', 'FontDialogForParagraph',
				   'SpellCheckIgnore', '.uno:RemoveBullets'],

			spreadsheet: ['MergeCells', 'SplitCell', 'RecalcPivotTable', 'DataDataPilotRun', 'DeletePivotTable',
				      'FormatCellDialog', 'DeleteNote', 'SetAnchorToCell', 'SetAnchorToCellResize'],

			presentation: ['SetDefault'],
			drawing: []
		},
		// UNOCOMMANDS_EXTRACT_END <- don't remove this line, it's used by unocommands.py

		// This blacklist contains those menu items which should be disabled on mobile
		// phones even if they are allowed in general. We need to have only those items here
		// which are also part of the whitelist, otherwise the menu items are not visible
		// anyway.

		// For clarity, please keep this list in sections that are sorted in the same order
		// as the items appear in the whitelist arrays above. Also keep items on separate
		// lines as in the arrays above.
		mobileBlackList: [
			// general
			'TransformDialog', 'FormatLine', 'FormatArea',
			'InsertTitles', 'InsertRemoveAxes',
			'DiagramType', 'DataRanges',
			'FormatWall', 'FormatDataSeries', 'FormatXErrorBars', 'FormatYErrorBars',
			'FormatDataPoint', 'FormatAxis', 'FormatMajorGrid', 'FormatMinorGrid',
			'InsertTrendline', 'InsertXErrorBars' , 'InsertYErrorBars', 'FormatChartArea',
			'FormatMeanValue', 'DiagramData', 'FormatLegend', 'FormatTrendline',
			'FormatTrendlineEquation', 'FormatStockLoss', 'FormatStockGain', 'LanguageStatus',
			// text
			'SpellingAndGrammarDialog', 'FontDialog', 'FontDialogForParagraph',
			// spreadsheet
			'FormatCellDialog', 'DataDataPilotRun'
		],
	},

	onAdd: function (map) {
		this._prevMousePos = null;

		map._contextMenu = this;
		map.on('locontextmenu', this._onContextMenu, this);
		map.on('mousedown', this._onMouseDown, this);
		map.on('keydown', this._onKeyDown, this);
		map.on('closepopups', this._onClosePopup, this);
	},

	_onClosePopup: function () {
		$.contextMenu('destroy', '.leaflet-layer');
		this.hasContextMenu = false;
	},

	_onMouseDown: function(e) {
		this._prevMousePos = {x: e.originalEvent.pageX, y: e.originalEvent.pageY};

		if (this.hasContextMenu) {
			this._onClosePopup();
		}
	},

	_onKeyDown: function(e) {
		if (e.originalEvent.keyCode === 27 /* ESC */) {
			$.contextMenu('destroy', '.leaflet-layer');
		}
	},

	_onContextMenu: function(obj) {
		var map = this._map;
		if (!map.isEditMode()) {
			return;
		}

		if (this.hasContextMenu) {
			this._onClosePopup();
		}

		this._amendContextMenuData(obj);

		var contextMenu = this._createContextMenuStructure(obj);

		// Added by Firefly <Firefly@ossii.com.tw>
		// 桌面模式且開啟 Debug 模式，在右鍵選單最後，加上輸入框，方便輸入任何指令
		// .uno: 開頭, dialog:開頭, macro:開頭, 或 menu id
		if (window.mode.isDesktop() && window.protocolDebug === true) {
			var that = this;
			contextMenu['debugSep'] = this.options.SEPARATOR;
			contextMenu['debugRunCommand'] = {
				name: _('Command') + ' :',
				type: 'text',
				events: {
					click: function(e) {
						e.stopPropagation();
					},
					keyup: function(e) {
						if (e.keyCode === 13) { // 按下 enter 鍵
							map.sendUnoCommand(e.target.value);
							that._onClosePopup();
						}
						e.stopPropagation();
					},
					contextmenu: function(e) {
						e.stopPropagation();
					},
					paste: function(e) {
						e.stopPropagation();
					}
				}
			};
		}

		var spellingContextMenu = false;
		for (var menuItem in contextMenu) {
			if (menuItem.indexOf('.uno:SpellCheckIgnore') !== -1) {
				spellingContextMenu = true;
				break;
			}
		}
		if (window.mode.isMobile()) {
			window.contextMenuWizard = true;
			var menuData = L.Control.JSDialogBuilder.getMenuStructureForMobileWizard(contextMenu, true, '');
			map.fire('mobilewizard', {data: menuData});
		} else {
			L.installContextMenu({
				selector: '.leaflet-layer',
				className: 'oxool-font',
				trigger: 'none',
				build: function() {
					return {
						zIndex: 1000, // 避免被選單列遮住
						callback: function(key) {
							if (map._clip === undefined || !map._clip.filterExecCopyPaste(key)) {
								map.executeAllowedCommand(key);
								// For spelling context menu we need to remove selection
								if (spellingContextMenu)
									map._docLayer._clearSelections();
								// Give the stolen focus back to map
								if (key !== '.uno:InsertAnnotation')
									map.focus();
							}
						},
						items: contextMenu
					};
				}
			});

			$('.leaflet-layer').contextMenu(this._prevMousePos);
			this.hasContextMenu = true;
		}
	},

	_amendContextMenuData: function(obj) {
		// Add a 'delete' entry  for graphic selection on desktop and mobile device (in browser or app).
		if (this._map._docLayer.hasGraphicSelection()) {
			var insertIndex = -1;
			obj.menu.forEach(function(item, index) {
				if (item.command === '.uno:Paste') {
					insertIndex = index + 1;
				}
			});

			if (insertIndex != -1) {
				obj.menu.splice(insertIndex, 0,
					{ text: _('Delete'), type: 'command', command: '.uno:Delete', enabled: true });
			}
		}
	},

	_createContextMenuStructure: function(obj) {
		var docType = this._map.getDocType();
		var docWhitelist = this.options.whitelist[docType];
		var contextMenu = {};
		var sepIdx = 1, itemName;
		var isLastItemText = false;
		for (var idx in obj.menu) {
			var item = obj.menu[idx];
			if (item.enabled === 'false') {
				continue;
			}

			if (item.type === 'separator') {
				if (isLastItemText) {
					contextMenu['sep' + sepIdx++] = this.options.SEPARATOR;
				}
				isLastItemText = false;
			} else if (item.type === 'command') {
				// Only show whitelisted items
				// Command name (excluding '.uno:') starts from index = 5
				var commandName = item.command.substring(5);

				// Command might have paramateres (e.g. .uno:SpellCheckIgnore?Type:string=Grammar)
				var hasParam = false;
				if (commandName.indexOf('?')!== -1) {
					commandName = commandName.substring(0, commandName.indexOf('?'));
					hasParam = true;
				}

				// We use a special character dialog in spelling context menu with a parameter
				if (commandName === 'FontDialog' && !hasParam)
					continue;

				// 手機環境須特別過濾能用的指令
				if (window.mode.isMobile()) {
					// 忽略不在白名單的指令
					if (commandName !== 'None' &&
						this.options.whitelist.general.indexOf(commandName) === -1 &&
						docWhitelist.indexOf(commandName) === -1) {
						continue;
					}
					// 忽略黑名單的指令
					if (this.options.mobileBlackList.indexOf(commandName) !== -1) {
						continue;
					}
				}

				// 指令不在全域白名單中，就不加入右鍵選單
				// 白名單來源就是 menubar 所有的 id
				if (!this._map.isAllowedCommand(item.command)) {
					continue;
				}

				if (hasParam || commandName === 'None' || commandName === 'FontDialogForParagraph' || commandName === 'Delete') {
					itemName = window.removeAccessKey(item.text);
					itemName = itemName.replace(' ', '\u00a0');
				} else {
					// Get the translated text associated with the command
					itemName = _UNO(item.command, docType, 'popup');
					// 沒有翻譯
					if (itemName === commandName) {
						itemName = window.removeAccessKey(item.text);
					}
				}

				contextMenu[item.command] = {
					// Using 'click' and <a href='#' is vital for copy/paste security context.
					name: (window.mode.isMobile() ? itemName : '<a href="#" class="context-menu-link">' +  itemName + '</a'),
					isHtmlName: true,
				};

				// 頁面配置不會設定目前式樣，得自己找出來
				if (item.command.startsWith(this.options.ASSIGNLAYOUT)) {
					var layoutNo = item.command.substring(34);
					var assignLayout = this._map['stateChangeHandler'].getItemValue(this.options.ASSIGNLAYOUT);
					if (assignLayout === layoutNo) {
						item.checktype = 'checkmark';
						item.checked = 'true';
					}
				}

				if (item.checktype !== undefined) {
					contextMenu[item.command].checktype = item.checktype;
					contextMenu[item.command].checked = (item.checked === 'true');
				}

				isLastItemText = true;
			} else if (item.type === 'menu') {
				// Get the translated text associated with the command
				itemName = _UNO(item.command, docType, false);
				// 沒有翻譯
				if (itemName === commandName) {
					itemName = window.removeAccessKey(item.text);
				}
				var submenu = this._createContextMenuStructure(item);
				// ignore submenus with all items disabled
				if (Object.keys(submenu).length === 0) {
					continue;
				}

				contextMenu[item.command] = {
					name: itemName,
					command: item.command,
					items: submenu
				};
				isLastItemText = true;
			}

			// 如果非手機模式，且有指令，設定該選項的 icon function.
			if (!window.mode.isMobile() && item.command) {
				contextMenu[item.command].icon = this._map.contextMenuIcon.bind(this._map);
			}
		}

		// Remove separator, if present, at the end
		var lastItem = Object.keys(contextMenu)[Object.keys(contextMenu).length - 1];
		if (lastItem !== undefined && lastItem.startsWith('sep')) {
			delete contextMenu[lastItem];
		}

		return contextMenu;
	}
});

L.control.contextMenu = function (options) {
	return new L.Control.ContextMenu(options);
};

// Using 'click' and <a href='#' is vital for copy/paste security context.
L.installContextMenu = function(options) {
	var map = L.Map.THIS; // L.Map.THIS 指向 map(定義在 src/main.js 中)
	var docType = map.getDocType();

	// 沒有預設的 callback 就用自己的
	if (options.callback === undefined) {
		options.callback = function(itemKey/*, opt*/) {
			// 執行白名單命令(如果有的話)
			map.executeAllowedCommand(itemKey);
		};
	}

	if (options.events === undefined) {
		options.events = {};
	}
	// 放入我們自己的 preShow
	if (options.events.preShow === undefined) {
		options.events.preShow = function(/*trigger, event*/) {
			$.SmartMenus.hideAll(); // 強制隱藏 Menubar 選單
			L.hideAllToolbarPopup(); // 強制隱藏所有 Toolbar 選單
		};
	}

	if (options.events.show === undefined) {
		options.events.show = function(/*options*/) {
			// do nothing.
		}.bind(map);
	}
	if (options.events.hide === undefined) {
		options.events.hide = function(/*options*/) {
			// do nothing.
		}.bind(map);
	}
	if (options.events.activated === undefined) {
		options.events.activated = function(/*options*/) {
			// do nothing.
		}.bind(map);
	}

	options.itemClickEvent = 'click';
	var rewrite = function(items) {
		if (items === undefined)
			return;
		var keys = Object.keys(items);
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			if (items[key] === undefined) {
				continue;
			}

			// 沒有指定選項名稱
			if (items[key].name === undefined) {
				// key 是 uno 指令，就以指令名稱作為選項名稱
				if (map.isUnoCommand(key)) {
					items[key].name = _UNO(key, docType, 'popup');
				 } else {
					continue;
				 }
			}

			// 如果有設定 icon 圖示，就把圖示字串存起來
			if (items[key].icon && typeof(items[key].icon) === 'string') {
				items[key]._savedIcon = items[key].icon;
			}

			// 只要沒有自訂 icon function，就用我們自己的 icon function
			if (typeof(items[key].icon) !== 'function') {
				items[key].icon = (map.contextMenuIcon).bind(map);
			}

			if (!items[key].isHtmlName) {
				// window.app.console.log('re-write name ' + items[key].name);
				items[key].name = '<a href="#" class="context-menu-link">' + items[key].name + '</a>';
				items[key].isHtmlName = true;
			}
			rewrite(items[key].items);
		}
	};
	rewrite(options.items);
	$.contextMenu(options);
};

// Add by Firefly <firefly@ossii.com.tw>
// 強制隱藏所有 toolbar 選單
L.hideAllToolbarPopup = function() {
	var w2uiPrefix = '#w2ui-overlay';
	var $dom = $(w2uiPrefix);
	// type 為 color & text-color 會在最頂層？(搔頭)
	if ($dom.length > 0) {
		$dom.removeData('keepOpen')[0].hide();
	} else { // 隱藏所有 Toolbar 選單(如果有的話)
		for (var key in window.w2ui) {
			$dom = $(w2uiPrefix + '-' + key);
			if ($dom.length > 0) {
				$dom.removeData('keepOpen')[0].hide();
			}
		}
	}
};
