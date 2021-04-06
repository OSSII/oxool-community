/* -*- js-indent-level: 8 -*- */
/*
 * L.dialog.RenameTable
 * Calc: 更改工作表名稱
 *
 * Author: Firefly <firefly@ossii.com.tw>
 */
/* global $ _ _UNO vex */
L.dialog.RenameTable = {
	_dialog: undefined,

	init: function(map) {
		this._map = map;
	},

	run: function(/*parameter*/) {
		var that = this;
		var map = this._map;
		var currPart = map.getCurrentPartNumber();
		var currName = map._docLayer._partNames[currPart];
		this._dialog = L.DomUtil.createWithId('div', '', document.body);
		this._dialog.innerHTML = '<p>' +
		'<label for="sheetName"><b>' + _('Enter new sheet name') + ' :</b>' +
		'<label><input type="text" id="sheetName" style="margin-top:12px;padding:5px 0px 5px;width:100%" value="' + currName + '" spellcheck="false">' +
		'</p>';

		$(this._dialog).dialog({
			title: _UNO('.uno:RenameTable', 'spreadsheet', true),
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
		var val = $('#sheetName').val();
		var currPart = this._map.getCurrentPartNumber();
		if (this._map.isSheetnameValid(val, currPart)) {
			this._map.renamePage(val, currPart);
		} else {
			var msg = _('Invalid sheet name.\nThe sheet name must not be empty or a duplicate of \nan existing name and may not contain the characters [ ] * ? : / \\ \nor the character \' (apostrophe) as first or last character.');
			vex.dialog.alert(msg.replace(/\n/g, '<br>'));
		}
	},
}
