/* -*- js-indent-level: 8 -*- */
/*
 * L.dialog.CommonSymbols
 * 插入常用符號
 *
 * Author: Firefly <firefly@ossii.com.tw>
 */
/* global $ _ UNOKey */
L.dialog.CommonSymbols = {
	_dialog: L.DomUtil.create('div', 'lokdialog', document.body),
	_commandName: '.uno:InsertSymbol', // 指令名稱

	// initialize 只會在載入的第一次執行
	initialize: function() {
		var that = this;
		var map = this._map;
		var table = this._map._allowedCommands.commonSymbolsData;
		if (table === null) {
			return;
		}

		var symbolTabs = L.DomUtil.create('div', '', this._dialog);
		var ul = L.DomUtil.create('ul', '', symbolTabs);

		ul.style.background = 'transparent none';
		ul.style.border = 'none';
		ul.style.borderBottom = '1px solid #4297d7';
		ul.style.borderBottomLeftRadius = 0;
		ul.style.borderBottomRightRadius = 0;
		for (var i = 0 ; i < table.length ; i ++) {
			var id = 'symbolTab-' + i;
			var li = L.DomUtil.create('li', '', ul);
			var ahref = L.DomUtil.create('a', '', li);
			ahref.href = '#' + id;
			ahref.innerText = table[i].Type;
			ahref.style.padding='.15em .15em';

			var symbols = L.DomUtil.createWithId('div', id, symbolTabs);
			symbols.style.padding = '10px 0px 10px 0px';
			for (var j = 0 ; j < table[i].Symbols.length ; j++) {
				var sym = L.DomUtil.create('a', 'oxool-symbol', symbols);
				sym.innerText = table[i].Symbols[j].Text;
				sym.symbolData = table[i].Symbols[j];
				// 被點擊的話，執行這裡
				L.DomEvent.on(sym, 'click', function (e) {
					var data = e.target.symbolData;
					var args = {
						Symbols: {
							type: 'string',
							value: data.Text
						}
					};
					// 有指定字型名稱的話
					if (data.Font !== '') {
						args['FontName'] = {'type': 'string', 'value': data.Font};
					}
					map.focus();
					map.sendUnoCommand('.uno:InsertSymbol', args);
					if (typeof data.Rewind === 'number' && map._docLayer && map._docLayer.isCursorVisible()) {
						for (var k=0 ; k < data.Rewind ; k++) {
							// 送出向左按鍵
							map._textInput._sendKeyEvent(0, UNOKey.LEFT);
						}
					}
				}, this);
				if (table[i].Symbols[j].Desc !== '') {
					sym.title = table[i].Symbols[j].Desc;
				}
				if (table[i].Symbols[j].Font !== '') {
					sym.style.fontFamily = '\'' + table[i].Symbols[j].Font + '\'';
				}
			}
		}
		$(symbolTabs).tabs();
		$(this._dialog).dialog({
			title: _('Common symbols'),
			position: {my: 'left center', at: 'right center', of: window},
			minWidth: 300,
			autoOpen: false,
			modal: false,
			resizable: true,
			draggable: true,
			closeOnEscape: true,
			close: function(/*e, ui*/) {
				map.stateChangeHandler.setItemProperty(that._commandName, 'false');
				map.focus();
			},
			buttons: [
				{
					text: _('More symbols'),
					click: function() {
						$(this).dialog('close');
						map.sendUnoCommand(that._commandName);
					}
				}
			]
		});
	},

	// 每次都會從這裡開始
	run: function(/* param */) {
		// 常用符號表在 Toolbar.Extensions.js 中，initializeDocumentPresets() 載入
		// 檢查有無該語系的常用符號表，請參考 uiconfig/symbols/zh-TW.json
		if (this._map._allowedCommands.commonSymbolsData === null) {
			// 沒有載入的話，直接執行 '.uno:InsertSymbol'
			this._map.sendUnoCommand(this._commandName);
			return;
		}
		var isOpen = $(this._dialog).dialog('isOpen'); // 是否已開啟
		if (isOpen) {
			$(this._dialog).dialog('close'); // 關掉
			isOpen = false;
		} else {
			$(this._dialog).dialog('open'); // 打開
			isOpen = true;
		}
		// 設定該指令狀態
		this._map.stateChangeHandler.setItemProperty(this._commandName, isOpen ? 'true' : 'false');
	},
};
