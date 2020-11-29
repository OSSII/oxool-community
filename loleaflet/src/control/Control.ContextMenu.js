/* -*- js-indent-level: 8 -*- */
/*
* Control.ContextMenu
*/

/* global $ _ _UNO */
L.Control.ContextMenu = L.Control.extend({
	options: {
		SEPARATOR: '---------',
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
			general: ['Cut', 'Copy', 'Paste', 'PasteSpecialMenu', 'PasteUnformatted',
					  'NumberingStart', 'ContinueNumbering', 'IncrementLevel', 'DecrementLevel',
					  'OpenHyperlinkOnCursor', 'CopyHyperlinkLocation', 'RemoveHyperlink',
					  'AnchorMenu', 'SetAnchorToPage', 'SetAnchorToPara', 'SetAnchorAtChar',
					  'SetAnchorToChar', 'SetAnchorToFrame',
					  'WrapMenu', 'WrapOff', 'WrapOn', 'WrapIdeal', 'WrapLeft', 'WrapRight', 'WrapThrough',
					  'WrapThroughTransparent', 'WrapContour', 'WrapAnchorOnly',
					  'ArrangeFrameMenu', 'ArrangeMenu', 'BringToFront', 'ObjectForwardOne', 'ObjectBackOne', 'SendToBack', 'GropuMenu', 'FormatGroup', 'FormatUngroup', 'EnterGroup', 'LeaveGroup',
					  'TransformDialog', 'FormatLine', 'FormatArea',
					  'RotateMenu', 'RotateLeft', 'RotateRight', 'FormatPaintbrush'],

			text: ['TableInsertMenu',
				   'InsertRowsBefore', 'InsertRowsAfter', 'InsertColumnsBefore', 'InsertColumnsAfter',
				   'TableDeleteMenu',
				   'DeleteRows', 'DeleteColumns', 'DeleteTable',
				   'MergeCells', 'SetOptimalColumnWidth', 'SetOptimalRowHeight',
				   'UpdateCurIndex','RemoveTableOf',
				   'ReplyComment', 'DeleteComment', 'DeleteAuthor', 'DeleteAllNotes',
				   'FormatPaintbrush', 'CharacterMenu', 'ParagraphMenu'],
			asuswriter:['FormatPaintbrush','ResetAttributes','Rotate180','InsertAnnotation',
				   'AlignCenter','AlignDown','AlignMiddle','AlignUp','ObjectAlignLeft','ObjectAlignRight',
				   'FlipHorizontal','FlipVertical'],
			asuscalc:['OriginalSize','FitCellSize'],

			spreadsheet: ['MergeCells', 'SplitCell', 'RecalcPivotTable', 'FormatCellDialog'],

			presentation: ['TransformDialog', 'FormatLine', 'FormatArea'],
			drawing: []
		}
		// UNOCOMMANDS_EXTRACT_END <- don't remove this line, it's used by unocommands.py
	},



	onAdd: function (map) {
		this._prevMousePos = null;

		map.on('updatepermission', this._onUpdatePermission, this); // Check Permission
	},

	// Add by Firefly <firefly@ossii.com.tw>
	// Right-click menu only in edit mode.
	_onUpdatePermission: function(e) {
		if (e.perm === 'edit') {
			this._map.on('locontextmenu', this._onContextMenu, this);
			this._map.on('mousedown', this._onMouseDown, this);
			this._map.on('keydown', this._onKeyDown, this);
		}
	},

	_onMouseDown: function(e) {
		this._prevMousePos = {x: e.originalEvent.pageX, y: e.originalEvent.pageY};

		$.contextMenu('destroy', '.leaflet-layer');
	},

	_onKeyDown: function(e) {
		if (e.originalEvent.keyCode === 27 /* ESC */) {
			$.contextMenu('destroy', '.leaflet-layer');
		}
	},

	_onContextMenu: function(obj) {
		var map = this._map;
		if (map._permission !== 'edit' && map._permission !== 'view') {
			return;
		}

		var contextMenu = this._createContextMenuStructure(obj);
		L.installContextMenu({
			selector: '.leaflet-layer',
			className: 'loleaflet-font',
			trigger: 'none',
			zIndex: 1100,
			build: function() {
				return {
					callback: function(key) {
						// Modify by Firefly <firefly@ossii.com.tw>
						// 把插入註解的行為統一化
						if (key === '.uno:InsertAnnotation')
							map.insertComment();
						else {
							map.sendUnoCommand(key);
							// Give the stolen focus back to map
							map.focus();
						}
					},
					items: contextMenu
				};
			}
		});

		$('.leaflet-layer').contextMenu(this._prevMousePos);
	},

	_createContextMenuStructure: function(obj) {
		var docType = this._map.getDocType();
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
				continue;
			}
			else if (item.type === 'command') {
				// Only show whitelisted items
				// Command name (excluding '.uno:') starts from index = 5
				var commandName = item.command.substring(5);
				if (this.options.whitelist.general.indexOf(commandName) === -1 &&
					!(docType === 'text' && this.options.whitelist.text.indexOf(commandName) !== -1) &&
					!(docType === 'spreadsheet' && this.options.whitelist.spreadsheet.indexOf(commandName) !== -1) &&
					!(docType === 'presentation' && this.options.whitelist.presentation.indexOf(commandName) !== -1) &&
					!(docType === 'drawing' && this.options.whitelist.drawing.indexOf(commandName) !== -1) &&
                    !(docType === 'text' && this.options.whitelist.asuswriter.indexOf(commandName) !== -1) &&
                    !(docType === 'spreadsheet' && this.options.whitelist.asuscalc.indexOf(commandName) !== -1)) {
					continue;
				}

				// Get the translated text associated with the command
				itemName = _UNO(item.command, docType, true);

				contextMenu[item.command] = {
					name: _(itemName)
				};

				if (item.checktype !== undefined) {
					contextMenu[item.command].checktype = item.checktype;
					contextMenu[item.command].checked = (item.checked === 'true');
				}
				isLastItemText = true;
			} else if (item.type === 'menu') {
				itemName = item.text;
				if (itemName.replace('~', '') === 'Paste Special') {
					itemName = _('Internal Paste Special');
				}
				var submenu = this._createContextMenuStructure(item);
				// ignore submenus with all items disabled
				if (Object.keys(submenu).length === 0) {
					continue;
				}

				contextMenu[item.command] = {
					name: _(itemName).replace(/\(~[A-Za-z]\)/, '').replace('~', ''),
					items: submenu
				};
				isLastItemText = true;
			} else {
				console.debug('未知的 item.type', item);
			}
			contextMenu[item.command].icon = (function(opt, $itemElement, itemKey, item) {
				return this._map.contextMenuIcon($itemElement, itemKey, item);
			}).bind(this)
		}

		// Remove separator, if present, at the end
		var lastItem = Object.keys(contextMenu)[Object.keys(contextMenu).length - 1];
		if (lastItem !== undefined && lastItem.startsWith('sep')) {
			delete contextMenu[lastItem];
		}

		return contextMenu;
	},
});

L.control.contextMenu = function (options) {
	return new L.Control.ContextMenu(options);
};

// Using 'click' and <a href='#' is vital for copy/paste security context.
L.installContextMenu = function(options) {
	options.itemClickEvent = 'click';
	// Modify by Firefly <firefly@ossii.com.tw>
	options.events = {
		// 顯示右鍵選單前
		show: function (/*options*/) {
			$.SmartMenus.hideAll(); // 強制隱藏 Menubar 選單
			L.hideAllToolbarPopup(); // 強制隱藏所有 Toolbar 選單
		}
	};

	var rewrite = function(items) {
		if (items === undefined)
			return;
		var keys = Object.keys(items);
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			if (items[key] === undefined)
				continue;
			if (!items[key].isHtmlName) {
				console.debug('re-write name ' + items[key].name);
				items[key].name = '<span>' + items[key].name + '</span>';
				items[key].isHtmlName = true;
			}
			rewrite(items[key].items);
		}
	}
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
