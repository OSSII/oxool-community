/* -*- js-indent-level: 8 -*- */
/*
 * L.dialog.AddTableAtEnd
 * Calc: 於結尾插入工作表
 *
 * Author: Firefly <firefly@ossii.com.tw>
 */
/* global $ _ _UNO vex */
L.dialog.AddTableAtEnd = {
	_dialog: undefined,

	init: function(map) {
		this._map = map;
	},

	run: function(/*parameter*/) {
		var that = this;
		this._dialog = L.DomUtil.createWithId('div', '', document.body);
		this._dialog.innerHTML = '<p>' +
		'<label for="sheetName"><b>' + _('Enter new sheet name') + ' :</b>' +
		'<label><input type="text" id="sheetName" style="margin-top:12px;padding-top:5px;padding-bottom:5px;width:100%" spellcheck="false" placeholder="' + _('Automatic naming') + '">' +
		'</p>';

		$(this._dialog).dialog({
			title: _UNO('.uno:Add', 'spreadsheet', true),
			position: {my: 'center', at: 'center', of: window},
			minWidth: 250,
			autoOpen: true, // 自動顯示對話框
			modal: true,
			resizable: false,
			//draggable: true,
			closeOnEscape: true,
			close: function(/*e, ui*/) {
				// 對話框關閉就徹底移除，下次要重新建立
				$(this).dialog('destroy').remove();
			},
			buttons: [
				{
					text: _('OK'),
					click: function() {
						that._checkValid();
						$(this).dialog('close');
					}
				},
				{
					text: _('Cancel'),
					click: function() {
						$(this).dialog('close');
					}
				}
			]
		});
	},

	_checkValid: function() {
		var map = this._map;
		var val = $('#sheetName').val().trim();
		// 有輸入工作表名稱，需檢查是否合法
		if (val.length > 0 && !map.isSheetnameValid(val)) {
			var msg = _('Invalid sheet name.\nThe sheet name must not be empty or a duplicate of \nan existing name and may not contain the characters [ ] * ? : / \\ \nor the character \' (apostrophe) as first or last character.');
			vex.dialog.alert(msg.replace(/\n/g, '<br>'));
		} else {
			var args = {
				Name: {
					type: 'string',
					value: val
				},
				Index: {
					type: 'long',
					value: 32767
				}
			};
			map.sendUnoCommand('.uno:Insert ', args);
		}
	},
}
