/* -*- js-indent-level: 8 -*- */
/*
 * L.dialog.InsertTable
 * Writer : 插入工作表
 *
 * Author: Firefly <firefly@ossii.com.tw>
 */
/* global $ _ _UNO vex */
L.dialog.InsertTable = {
	_dialog: undefined,

	init: function(map) {
		this._map = map;
	},

	run: function(/*parameter*/) {
		var that = this;
		this._dialog = L.DomUtil.createWithId('div', '', document.body);

		this._dialog.innerHTML = '<fieldset>' +
		'<legend><b>' + _('Position') + ' :</b></legend>' +
		'<div><label><input type="radio" name="Position" value="before" checked> ' + _('Before current sheet') + '</label></div>' +
		'<div><label><input type="radio" name="Position" value="after"> ' + _('After current sheet') + '</label></div>' +
		'</field>';

		this._dialog.innerHTML += '<fieldset style="margin-top:12px;">' +
		'<legend><b>' + _('Sheet') + ' :</b></legend>' +
		'<div>' + _('No. of sheets') + ': <input id="sheets" style="width:70px" value="1"></div>' +
		'<div>' + _('Name') + ' : ' + '<input type="text" id="sheetName" style="margin-top:12px;padding:5px 0px 5px;" placeholder="' + _('Automatic naming') + '"></div>' +
		'</field>';

		$('#sheets').spinner({
			min: 1,
			max: 100,
			spin: function(e, ui) {
				$('#sheetName').prop('disabled', ui.value > 1);
			},
			change: function(/*e, ui*/) {
				var val = $('#sheets').spinner('value');
				if (val === null || val === 0) {
					val = 1;
					$('#sheets').spinner('value', val);
				}

				$('#sheetName').prop('disabled', val > 1);
			}
		});

		$(this._dialog).dialog({
			title: _UNO('.uno:Insert', 'spreadsheet', true),
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
						that._okCommand();
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

	// 按下 OK 按鈕
	_okCommand: function() {
		var map = this._map;
		var currPart = this._map.getCurrentPartNumber(); // 目前所在的工作表編號
		var pos = $('input[type=radio][name=Position]:checked').val(); // 插在之前或之後
		var sheets = $('#sheets').spinner('value'); // 插入幾頁
		var sheetName = $('#sheetName').val().trim(); // 工作表名稱(插入一頁適用)
		var args = {};
		console.debug('currPart', currPart);
		// 決定是否需要指定工作表名稱
		if (sheets === 1) {
			if (sheetName.length > 0 && !map.isSheetnameValid(sheetName)) {
				var msg =_('Invalid sheet name.\nThe sheet name must not be empty or a duplicate of \nan existing name and may not contain the characters [ ] * ? : / \\ \nor the character \' (apostrophe) as first or last character.');
				vex.dialog.alert(msg.replace(/\n/g, '<br>'));
				return;
			} else {
				args = {
					Name: {
						type: 'string',
						value: sheetName
					},
					Index: {
						type: 'long',
						value: currPart + (pos === 'before' ? 1 : 2)
					}
				};
				map.sendUnoCommand('.uno:Insert', args);
			}
		} else {
			args = {
				Name: {
					type: 'string',
					value: ''
				},
				Index: {
					type: 'long',
					value: currPart + (pos === 'before' ? 1 : 2)
				}
			};
			for (var i = 0; i < sheets ; i++) {
				map.sendUnoCommand('.uno:Insert', args);
				args.Index.value++;
			}
		}
	},
};
