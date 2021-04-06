/* -*- js-indent-level: 8 -*- */
/*
 * L.dialog.RemoveTable
 * Calc: 刪除工作表
 *
 * Author: Firefly <firefly@ossii.com.tw>
 */
/* global $ _ _UNO */
L.dialog.RemoveTable = {
	_dialog: undefined,

	init: function(map) {
		this._map = map;
	},

	run: function(/*parameter*/) {
		var map = this._map;
		var currPart = map.getCurrentPartNumber();
		var currName = map._docLayer._partNames[currPart];
		this._dialog = L.DomUtil.createWithId('div', '', document.body);
		this._dialog.innerHTML = '<p>' +
		_('Are you sure you want to delete sheet, %sheet% ?').replace('%sheet%', currName) +
		'</p>';

		$(this._dialog).dialog({
			title: _UNO('.uno:Remove', 'spreadsheet', true),
			position: {my: 'center', at: 'center', of: window},
			minWidth: 320,
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
						map.deletePage(currPart);
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
}
