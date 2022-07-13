/* -*- js-indent-level: 8 -*- */
/*
 * L.dialog.GotoPage
 * Write 和 Calc 前往頁面對話盒
 *
 * Author: Firefly <firefly@ossii.com.tw>
 */
/* global $ _ _UNO */
L.dialog.GotoPage = {
	_dialog: undefined,

	init: function(map) {
		this._map = map;
	},

	run: function(/*parameter*/) {
		var numPages, currPage;
		var options = '', selected = '';
		var names, i;
		var map = this._map;
		var docLayer = map._docLayer;
		var docType = map.getDocType();

		if (docType === 'text') {
			numPages = map.getNumberOfPages();
			currPage = map.getCurrentPageNumber();
			for (i = 0 ; i < numPages; i ++) {
				selected = (i === currPage ? ' selected' : '');
				options += '<option value="' + i + '"' + selected + '>' + parseInt(i + 1) + '</option>';
			}
		}
		else if (docType === 'spreadsheet') {
			numPages = map.getNumberOfParts();
			currPage = map.getCurrentPartNumber();
			names = docLayer._partNames;
			for (i = 0 ; i < numPages; i ++) {
				selected = (i === currPage ? ' selected' : '');
				if (!map.isHiddenPart(i)) {
					options += '<option value="' + i + '"' + selected + '>' + names[i] + '</option>';
				}
			}
		}

		this._dialog = L.DomUtil.createWithId('div', '', document.body);
		this._dialog.innerHTML = '<select id="GotoPage" name="GotoPage" size="10" style="width:100%; overflow-y: auto">' + options +
		'</select>';

		$(this._dialog).dialog({
			title: _UNO('.uno:GotoPage', 'text', true),
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
						var targetPage = parseInt($('#GotoPage').val());
						if (docType === 'text') {
							map.goToPage(targetPage);
						}
						else if (docType === 'spreadsheet') {
							map.setPart(targetPage);
						}
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
