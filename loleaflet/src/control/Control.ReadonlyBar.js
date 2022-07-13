/* -*- js-indent-level: 8 -*- */
/*
 * L.Control.ReadonlyBar
 */

/* global L $ _ */
L.Control.ReadonlyBar = L.Control.extend({
	_bar: null,

	onAdd: function(map) {
		this._map = map;
		this._docName = this._map.getFileName();
		this.builder = new L.control.notebookbarBuilder({mobileWizard: this, map: map, cssClass: 'notebookbar'});
		this.$mainNav = $('.main-nav');
		this.$mainNav.css('display', 'none'); // 隱藏導覽列
		this._initLayout(); // 初始化工具列
	},

	onRemove: function() {
		L.DomUtil.remove(this._bar); // 移除工具列的 dom element
		this.$mainNav.css('display', 'flex'); // 顯示導覽列
		delete this.builder;
	},

	_initLayout: function() {
		// 建立工具列的 dom element
		this._bar = L.DomUtil.createWithId('div', 'oxool-readonlybar');
		// 插在導覽列之後
		this.$mainNav.after(this._bar);

		// 一、依據檔案類別建立圖示
		var iconClass = 'document-logo';
		switch (this._map.getDocType()) {
		case 'text':
			iconClass += ' writer-icon-img';
			break;
		case 'spreadsheet':
			iconClass += ' calc-icon-img';
			break;
		case 'presentation':
			iconClass += ' impress-icon-img';
			break;
		case 'drawing':
			iconClass += ' draw-icon-img';
			break;
		}

		this._shortcutsBar = L.DomUtil.create('div', 'document-shortcuts-bar', this._bar);

		// 如果可以匯出的話或是列印的話，建立工具列
		this.createShortcutsBar();

		// 二、建立檔名顯示區
		var documentNameHeader = L.DomUtil.create('div', 'document-name-header', this._bar);
		documentNameHeader.title = this._docName;
		L.DomUtil.create('div', iconClass, documentNameHeader);
		var documentName = L.DomUtil.create('div', 'document-name', documentNameHeader);
		$(documentName).text(this._docName);

		// 三、建立關閉按鈕(如果有的話)
		if (L.Params.closeButtonEnabled) {
			var closeButton = L.DomUtil.create('div', 'closebuttonimage', this._bar);
			closeButton.title = _('Close document');
			// 關閉文件按鈕
			$(closeButton).click(function() {
				this._map.closeDocument();
			}.bind(this));
		}
	},

	getShortcutsBarData: function() {
		console.debug('haha : ', this._map['wopi']);
		var wopi = this._map['wopi'];
		var shortcutsBarData = [
			{
				'id': 'shortcutstoolbox',
				'type': 'toolbox',
				'children': []
			}
		];
		var shortcutsBar = shortcutsBarData[0].children;

		// 如果是投影片，且未禁止匯出的話，顯示投影相關按鈕
		if (this._map.getDocType() === 'presentation' && wopi.HideExportOption !== true) {
			// 從第一張開始投影
			shortcutsBar.push({
				'id': 'Presentation',
				'type': 'toolitem',
				'command': '.uno:Presentation'
			});
			// 從目前頁面開始投影
			shortcutsBar.push({
				'id': 'PresentationCurrentSlide',
				'type': 'toolitem',
				'command': '.uno:PresentationCurrentSlide'
			});
		}

		// 沒有禁止下載
		if (wopi.HideExportOption !== true) {
			shortcutsBar.push({
				'id': 'downloadasmenu',
				'type': 'toolitem',
				'icon': '.uno:ExportTo',
				'text': _('Download as'),
				'command': 'downloadas'
			});
		}

		// 沒有禁止印表
		if (wopi.HidePrintOption !== true) {
			shortcutsBar.push({
				'id': 'print',
				'type': 'toolitem',
				'command': '.uno:Print'
			});
		}

		// 有「關於」對話框
		shortcutsBar.push({
			'id': 'about',
			'type': 'toolitem',
			'icon': 'res:About',
			'text': _('About OxOffice Online'),
			'command': 'about'
		});

		return shortcutsBarData;
	},

	createShortcutsBar: function() {
		var shortcutsBarData = this.getShortcutsBarData();
		this.builder.build(this._shortcutsBar, shortcutsBarData);
	},

});

L.control.readonlyBar = function (options) {
	return new L.Control.ReadonlyBar(options);
};
