/* -*- js-indent-level: 8 -*- */
/*
 * L.dialog.BindingLineDialog
 * Writer 自訂裝訂線
 *
 * Author: Firefly <firefly@ossii.com.tw>
 */
/* global $ _ */
L.dialog.BindingLineDialog = {
	// dialog 要一直存在，所以要建立具有唯一 ID 的 dialog 元素
	$dialog: $(L.DomUtil.create('div', '', document.body)).uniqueId(),
	_defaultText: '裝訂線',
	_defaultFont: '標楷體',

	// init 只會在載入的第一次執行
	init: function(map) {
		this._map = map;

		// 取得 OxOOL 字型列表
		var fontList = map.getFontList();

		this._id = this.$dialog.attr('id');
		this._textId = this._id + '_text';
		this._colorPickerId = this._id + '_colorPicker';
		this._fontSelectId = this._id + '_fontSelect';
		this._fontSizetId = this._id + '_fontSize';
		this._whatPageId = this._id + '_whatPage';
		this._positionId = this._id + '_position';
		this._boundaryId = this._id + '_boundary';
		this.$dialog.html(
			'<p>' +
			_('Text') + ' : <span style="width:220px;display:inline-block"><input type="text" id="' + this._textId + '" value="' + this._defaultText + '" style="width:200px"></span> ' +
			_('Color') + ' : <input id="' + this._colorPickerId + '" value="#000000">' +
			'</p>' +
			'<p>' +
			_('Font') + ' : <span style="width:220px;display:inline-block"><select id="' + this._fontSelectId + '"></select></span> ' +
			_('Size') + ' : <select id="' + this._fontSizeId + '"></select>' +
			'</p>' +
			'<fieldset><legend>' + _('Insert') + '</legend>' +
			'<label><input type="radio" name="' + this._whatPageId + '" value="1">' + _('First page') + '</label> ' +
			'<label><input type="radio" name="' + this._whatPageId + '" value="2" checked>' + _('Current page') + '</label> ' +
			'<label><input type="radio" name="' + this._whatPageId + '" value="3">' + _('All pages') + '</label>' +
			'</fieldset>' +
			'<fieldset><legend>' + _('Position') + '</legend>' +
			'<label><input type="radio" name="' + this._positionId + '" value="L" checked>' + _('Left') + '</label> ' +
			'<label><input type="radio" name="' + this._positionId + '" value="R">' + _('Right') + '</label> ' +
			'<label><input type="radio" name="' + this._positionId + '" value="T">' + _('Top') + '</label>' +
			'<label><input type="radio" name="' + this._positionId + '" value="B">' + _('Bottom') + '</label>' +
			'</fieldset>' +
			'<p>' + _('Distance boundary') + ' : <input id="' + this._boundaryId + '" value="1.0"> ' + _('cm') + '</p>'
		);

		$('#'+this._colorPickerId).spectrum({
			type: 'color',
			preferredFormat: 'hex',
			showPalette: false,
			showPaletteOnly: true,
			togglePaletteOnly: true,
			hideAfterPaletteSelect: true,
			showAlpha: false,
			allowEmpty: false
		});

		$('#' + this._boundaryId).spinner({
			max: 100,
			min: 0,
			step: 0.1,
			numberFormat: 'n'
		});

		var $fontSelect = $('#'+this._fontSelectId);
		for (var fontName in fontList) {
			var item = {
				text: fontName,
				value: fontName
			};
			if (fontName === this._defaultFont) {
				item.selected = true;
			}
			$fontSelect.append($('<option>', item));
		}

		var $fontSize = $('#'+this._fontSizeId);
		var sizeArray = [8, 9, 10, 10.5, 11, 12, 13, 14, 15, 16];
		$.each(sizeArray, function(i, val) {
			var sizeItem = {
				text: val,
				value: val
			};
			if (val === 10.5) {
				sizeItem.selected = true;
			}
			$fontSize.append($('<option>', sizeItem));
		});

		var that = this;
		this.$dialog.dialog({
			title: _('Binding line'),
			closeText: _('Close'),
			position: {my: 'center', at: 'center', of: window},
			minWidth: 450,
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
						var text = $('#' + that._textId).val().trim();
						var color = $('#' + that._colorPickerId).val();
						var numColor = parseInt('0x' + color.substring(1)); // 轉成十進位數字
						var font = $('#' + that._fontSelectId).val();
						var size = $('#' + that._fontSizeId).val();
						var whatPage = $('input[name=' + that._whatPageId + ']:checked').val();
						var position = $('input[name=' + that._positionId + ']:checked').val();
						var boundary = $('#' + that._boundaryId).val();
						// 如果沒有輸入文字，就用預設文字
						if (text === '') {
							text = that._defaultText;
						}
						var macro = 'macro:///OxOOL.BindingLine.insert(' + text + ', ' + numColor + ', ' + font + ', ' + size + ', ' + whatPage + ',' + position + ', ' + boundary +')';
						console.debug('send macro:', macro);
						that._map.sendUnoCommand(macro);
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

		$fontSelect.selectmenu({
			width: 200
		}).selectmenu('menuWidget').css({
			'height': '200px',
			'width': '200px'
		});

		$fontSize.selectmenu({
			width: 90
		}).selectmenu('menuWidget').css({
			'height': '200px',
		});
	},

	// 每次都會從這裡開始
	run: function(/*parameter*/) {
		this.$dialog.dialog('open');
	},
};
