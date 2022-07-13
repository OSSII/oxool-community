/* -*- js-indent-level: 8 -*- */
/*
 * L.dialog.ExampleDialog
 *
 * 動態載入 Dialog 範例，命名原則是：
 * "L.dialog." 不變，後面接上不和別人重複的名稱，這個名稱同時也是不含.js副檔名的名稱
 *
 * 以本檔案為例：
 * 在程式中下達 map.fire('executeDialog', {dialog: 'ExampleDialog'[,其他參數...]});
 * 1. 就會載入動態載入 ExampleDialog.js 檔案。
 * 2. 第一次載入，會把 map 傳給 init
 * 3. 之後會呼叫 run，並把當初 map.fire() 指定的物件，當作參數傳過去，所以若要傳遞額外參數，
 *    請自行加在[,其他參數...]部份即可。
 * 4. 以後每次呼叫，都只會從 3 開始。
 *
 * Author: Firefly <firefly@ossii.com.tw>
 * Note: 這是設計 Dialog 範本，本例是以 jquery-ui 撰寫，
 *       使用方法參閱：https://jqueryui.com/
 */
/* global $ _ */
L.dialog.ExampleDialog = {
	_dialog: undefined,

	// init 只會在載入的第一次執行
	init: function(map) {
		this._map = map;
	},

	// 每次都會從這裡開始
	run: function(/*parameter*/) {
		this._dialog = L.DomUtil.createWithId('div', '', document.body);
		this._dialog.innerHTML = '';
		$(this._dialog).dialog({
			title: _(''),
			position: {my: 'center', at: 'center', of: window},
			minWidth: 250,
			autoOpen: true, // 自動顯示對話框
			modal: true,	// 獨占模式
			resizable: false, // 不能縮放視窗
			draggable: true, // 可以拖放視窗
			closeOnEscape: true, // 按 esc 視同關閉視窗
			close: function(/*e, ui*/) {
				// 對話框關閉就徹底移除，下次要重新建立
				$(this).dialog('destroy').remove();
			},
			buttons: [
				{
					text: _('OK'),
					click: function() {
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
