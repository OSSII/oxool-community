/* -*- js-indent-level: 8 -*- */
/*
 * L.dialog.MoveTable
 * Calc 移動或複製工作表
 *
 * Author: Firefly <firefly@ossii.com.tw>
 */
/* global $ _ _UNO */
L.dialog.MoveTable = {
	_dialog: undefined,

	init: function(map) {
		this._map = map;
	},

	run: function(/*parameter*/) {
		var map = this._map;
		var that = this;
		var partNames = map._docLayer._partNames;
		var options = '';
		for (var i = 0 ; i < partNames.length ; i++) {
			if (!map.isHiddenPart(i)) {
				options += '<option value="' + (i+1) + '">' + partNames[i] + '</option>';
			}
		}
		options += '<option value="32767">' + _('- move to end position -') + '</option>';
		this._dialog = L.DomUtil.createWithId('div', '', document.body);
		this._dialog.innerHTML = '<div><label><input type="radio" id="movepart" name="copypart" value="move" checked> ' + _('Move') + '</label>&nbsp;&nbsp;' +
		'<label><input type="radio" id="copypart" name="copypart" value="copy"> ' + _('Copy') + '</label></div>' +
		'<div style="margin-top:16px;"><b>' + _('Insert before') + '</b></div>' +
		'<select id="moveTo" size="10" style="width: 100%;">' + options + '</select>';

		$('#movepart').checkboxradio();
		$('#copypart').checkboxradio();

		$(this._dialog).dialog({
			title: _UNO('.uno:Move', 'spreadsheet', true),
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
		var map = this._map;
		var partNames = map._docLayer._partNames;
		var currPart = map.getCurrentPartNumber();
		// 移動或複製
		var copy = $('input[type=radio][name=copypart]:checked').val() === 'copy';
		var itemVal = parseInt($('#moveTo').val());
		var pos;

		if (itemVal === null) {
			pos = currPart + 2;
			if (pos > partNames.length)
				pos = 32767; // 最後
		} else {
			pos = parseInt(itemVal);
		}

		var params = {
			DocName: {
				type: 'string',
				value: map.getDocName()
			},
			Index: {
				type: 'long',
				value: pos
			},
			Copy: {
				type: 'boolean',
				value: copy
			}
		}
		map.sendUnoCommand('.uno:Move', params);
	}
};
