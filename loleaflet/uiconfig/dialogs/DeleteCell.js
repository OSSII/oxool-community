/* -*- js-indent-level: 8 -*- */
/*
 * L.dialog.DeleteCell
 * Calc 刪除儲存格內容
 *
 * Author: Firefly <firefly@ossii.com.tw>
 */
/* global $ _ _UNO */
L.dialog.DeleteCell = {
	// dialog 要一直存在，所以要建立具有唯一 ID 的 dialog 元素
	$dialog: $(L.DomUtil.create('div', '', document.body)).uniqueId(),
	_deleteAll: false, // 全部刪除預設關閉
	_flags: '',

	// init 只會在載入的第一次執行
	init: function(map) {
		var that = this;
		this._map = map;
		this._id = '#' + this.$dialog.attr('id');
		this.$dialog.html('<div><b>' + _('Selection') + ' :</b><div>' +
		'<div style="padding-left:16px;"><label><input type="checkbox" name="deleteAll" value="A"> ' + _('Delete all') + '</label></div>' +
		'<table style="width:100%;border:0px;margin-top:12px;">' +
		'<tr>' +
		'<td style="width:50%"><label><input type="checkbox" name="checkGroup" value="S" checked> ' + _('Text') + '</label></td>' +
		'<td style="width:50%"><label><input type="checkbox" name="checkGroup" value="V" checked> ' + _('Numbers') + '</label></td>' +
		'</tr>' +
		'<tr>' +
		'<td><label><input type="checkbox" name="checkGroup" value="D" checked> ' + _('Date & time') + '</label></td>' +
		'<td><label><input type="checkbox" name="checkGroup" value="F" checked> ' + _('Formulas') + '</label></td>' +
		'</tr>' +
		'<tr>' +
		'<td><label><input type="checkbox" name="checkGroup" value="N" checked> ' + _('Comments') + '</label></td>' +
		'<td><label><input type="checkbox" name="checkGroup" value="T"> ' + _('Formats') + '</label></td>' +
		'</tr>' +
		'<tr>' +
		'<td><label><input type="checkbox" name="checkGroup" value="O"> ' + _('Objects') + '</label></td>' +
		'<td></td>' +
		'</tr>' +
		'</table>');

		// 全部刪除變更事件處理
		$(this._id + ' input[name=deleteAll]').change(function() {
			that._deleteAll = $(this).prop('checked'); // 紀錄狀態
			that._flags = that._deleteAll ? $(this).val() : ''; // 旗標
			// 其他選項能否選取，取決於「全部刪除」是否勾選
			$(that._id + ' input[name="checkGroup"]').prop('disabled', that._deleteAll);
		});

		this.$dialog.dialog({
			title: _UNO('.uno:Delete', 'spreadshee', true),
			closeText: _('Close'),
			position: {my: 'center', at: 'center', of: window},
			minWidth: 250,
			autoOpen: false, // 不自動顯示對話框
			modal: true,	// 獨占模式
			resizable: false, // 不能縮放視窗
			draggable: true, // 可以拖放視窗
			closeOnEscape: true, // 按 esc 視同關閉視窗
			open: function(/*event, ui*/) {
				that._flags = ''; // 清除旗標
				// 預設選取第一個 button
				$(this).siblings('.ui-dialog-buttonpane').find('button:eq(0)').focus(); 
			},
			buttons: [
				{
					text: _('OK'),
					click: function() {
						// 不是刪除全部
						if (!that._deleteAll) {
							// 取得被選取的 checkbox
							$(that._id + ' input[name="checkGroup"]:checked').each(function() {
								that._flags += $(this).val();
							});
						}
						var args = {
							Flags: {
								type: 'string',
								value: that._flags
							}
						};
						map.sendUnoCommand('.uno:Delete', args);
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

	// 每次都會從這裡開始
	run: function(/*parameter*/) {
		this.$dialog.dialog('open');		
	},
};
