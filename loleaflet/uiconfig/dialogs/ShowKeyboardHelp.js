/* -*- js-indent-level: 8 -*- */
/*
 * L.dialog.ShowKeyboardHelp
 * 顯示按鍵說明
 *
 * Author: Firefly <firefly@ossii.com.tw>
 */
/* global $ _ */
L.dialog.ShowKeyboardHelp = {
	_dialog: undefined,

	// init 只會在載入的第一次執行
	init: function(map) {
		this._map = map;
	},

	// 每次都會從這裡開始
	run: function(/*parameter*/) {
		var map = this._map;
		this._dialog = L.DomUtil.createWithId('div', 'KeyboardHelp', document.body);
		var $dialog = $(this._dialog);

		$.get('loleaflet-help.html', function(data) {
			$dialog.html(data);
		}).done(function() {
			var i, max;
			var translatableContent = $dialog.find('h1');
			for (i = 0, max = translatableContent.length; i < max; i++) {
				translatableContent[i].firstChild.nodeValue = translatableContent[i].firstChild.nodeValue.toLocaleString();
			}
			translatableContent = $dialog.find('h2');
			for (i = 0, max = translatableContent.length; i < max; i++) {
				translatableContent[i].firstChild.nodeValue = translatableContent[i].firstChild.nodeValue.toLocaleString();
			}
			translatableContent = $dialog.find('td');
			for (i = 0, max = translatableContent.length; i < max; i++) {
				translatableContent[i].firstChild.nodeValue = translatableContent[i].firstChild.nodeValue.toLocaleString();
			}
			translatableContent = $dialog.find('p');
			for (i = 0, max = translatableContent.length; i < max; i++) {
				translatableContent[i].firstChild.nodeValue = translatableContent[i].firstChild.nodeValue.toLocaleString();
			}

			// Display help according to document opened
			switch (map.getDocType()) {
			case 'text':
				$('#text-shortcuts').show();
				break;
			case 'spreadsheet':
				$('#spreadsheet-shortcuts').show();
				break;
			default:
				$('#presentation-shortcuts').show();
			}
		});

		var minHeight = (window.innerHeight * 0.8).toFixed();
		$dialog.dialog({
			title: _('Keyboard shortcuts'),
			position: {my: 'center', at: 'center', of: window},
			minWidth: 640,
			height: minHeight < 512 ? 512 : minHeight,
			autoOpen: true, // 自動顯示對話框
			modal: true,	// 獨占模式
			resizable: false, // 不能縮放視窗
			draggable: true, // 可以拖放視窗
			closeOnEscape: true, // 按 esc 視同關閉視窗
			close: function(/*e, ui*/) {
				// 對話框關閉就徹底移除，下次要重新建立
				$(this).dialog('destroy').remove();
			}
		});
	},
};
