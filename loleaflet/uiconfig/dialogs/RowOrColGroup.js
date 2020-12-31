/* -*- js-indent-level: 8 -*- */
/**
 * L.dialog.RowOrColGroup
 *
 * @description calc 選擇列或欄群組
 * @author Firefly <firefly@ossii.com.tw>
 */
/* global $ _ _UNO */
L.dialog.RowOrColGroup = {
	_dialog: undefined,

	initialize: function() {
		// do nothing.
	},

	run: function(/*parameter*/) {
		var map = this._map;
		// 不是試算表文件就結束
		if (map.getDocType() !== 'spreadsheet') return;

		this._dialog = L.DomUtil.createWithId('div', '', document.body);
		this._uniqueId = $(this._dialog).uniqueId().attr('id'); // 唯一 ID
		var rowsId = this._uniqueId + 'Rows';
		var columnsId = this._uniqueId + 'Columns';

		this._dialog.innerHTML =
		'<fieldset>'
		+ '<legend>' + _('Include') + '</legend>'
		+ '<input type="radio" name="grouptype" id="' + rowsId + '" value="R" checked>'
		+ '<label for="' + rowsId + '">&nbsp;' + _('Row') + '</label><br>'
		+ '<input type="radio" name="grouptype" id="' + columnsId + '" value="C">'
		+ '<label for="' + columnsId + '">&nbsp;' + _('Column') + '</label>'
		+ '</fieldset>';

		$(this._dialog).dialog({
			title: _UNO('.uno:Group', 'spreadsheet', true),
			position: {my: 'center', at: 'center', of: window},
			minWidth: 200,
			autoOpen: true, // 自動顯示對話框
			modal: true,
			resizable: false,
			draggable: true,
			closeOnEscape: true,
			close: function(/*e, ui*/) {
				// 對話框關閉就徹底移除，下次要重新建立
				$(this).dialog('destroy').remove();
			},
			buttons: [
				{
					text: _('OK'),
					click: function() {
						var rowOrCol = $('input[name=grouptype]:checked').val();
						var args = {
							RowOrCol: {
								type: 'string',
								value: rowOrCol
							}
						}
						map.sendUnoCommand('.uno:Group', args);
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
