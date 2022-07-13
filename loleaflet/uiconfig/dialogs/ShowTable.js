/* -*- js-indent-level: 8 -*- */
/*
 * L.dialog.ShowTable
 * Calc 顯示隱藏的工作表
 *
 * Author: Firefly <firefly@ossii.com.tw>
 */
/* global $ _ _UNO */
L.dialog.ShowTable = {
	_dialog: undefined,

	init: function(map) {
		this._map = map;
	},

	run: function(/*parameter*/) {
		var map = this._map;
		if (!map.hasAnyHiddenPart()) {
			return;
		}
		var hiddenNames = map.getHiddenPartNames().split(',');
		var sels = '<div id="hideList" style="height:160px; overflow-y:auto; overflow-x:none; padding: 5px; border:1px #bbbbbb solid">';
		for (var i = 0 ; i < hiddenNames.length ; i++) {
			sels += '<div><label><input type="checkbox" value="' + hiddenNames[i] + '">' + hiddenNames[i] + '</label></div>';
		}
		sels += '</div>';

		this._dialog = L.DomUtil.createWithId('div', '', document.body);
		this._dialog.innerHTML = '<div><b>' + _('Hidden Sheets') + ' :</b></div>' + sels;

		$(this._dialog).dialog({
			title: _UNO('.uno:Show', 'spreadsheet', true),
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
						$('#hideList input:checkbox:checked').each(function() {
							map.showPage($(this).val())
						});
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
};
