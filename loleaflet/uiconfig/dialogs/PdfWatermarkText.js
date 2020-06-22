/* -*- js-indent-level: 8 -*- */
/*
 * L.dialog.PdfWatermarkText
 * 設定列印或下載為 pdf 的浮水印文字
 *
 * Author: Firefly <firefly@ossii.com.tw>
 */
/* global $ _ */
L.dialog.PdfWatermarkText = {
	// dialog 要一直存在，所以要建立具有唯一 ID 的 dialog 元素
	$dialog: $(L.DomUtil.create('div', '', document.body)).uniqueId(),

	// init 只會在載入的第一次執行
	init: function(map) {
		var that = this;
		this._map = map;
		this._id = this.$dialog.attr('id');
		this._watermarkTextId = this._id + '_watermarkText';
		this.$dialog.html(
			_('Watermark text') + ' : <input type=text id="' + this._watermarkTextId + '" /><br>' +
			'<strong><small>' + _('If no needed, please leave it blank.') + '</small></strong>'
		);

		this.$dialog.dialog({
			title: _('Add watermark'),
			closeText: _('Close'),
			position: {my: 'center', at: 'center', of: window},
			minWidth: 250,
			autoOpen: false, // 不自動顯示對話框
			modal: true,	// 獨占模式
			resizable: false, // 不能縮放視窗
			draggable: true, // 可以拖放視窗
			closeOnEscape: true, // 按 esc 視同關閉視窗
			open: function(/*event, ui*/) {
				// 預設選取第一個 button
				$(this).siblings('.ui-dialog-buttonpane').find('button:eq(0)').focus();
			},
			buttons: [
				{
					text: _('OK'),
					click: function() {
						var text = $('#' + that._watermarkTextId).val().trim();
						var watermarkText = (text !== '') ? ',Watermark=' + text + 'WATERMARKEND' : '';
						map.showBusy(_('Downloading...'), false);
						map._socket.sendMessage('downloadas ' +
							'name=' + encodeURIComponent(that._args.name) + ' ' +
							'id=' + that._args.id + ' ' +
							'format=pdf ' +
							'options=' + that._args.options + watermarkText);
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
	run: function(param) {
		this._args = param.args;
		if (this._args === undefined) {
			return;
		}
		this._map.hideBusy();
		this.$dialog.dialog('open');
	},
};
