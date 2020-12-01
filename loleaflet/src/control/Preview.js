/* -*- js-indent-level: 8 -*- */
/*
 * Preview Handler
 */

/* global L $ _ _UNO w2ui */
L.Control.Preview = L.Control.extend({
	options: {
	},

	_toolbar: null,

	_items: [
		{type: 'html', id: 'filename'},
		{type: 'break'},
		{
			type: 'html', id: 'changepagenumber',
			html: '<div><select id="ChangePageNumber" style="border-radius: 2px; border: 1px solid silver;height:26px;max-width:200px;line-height:26px;font-size:16px;cursor:pointer;"></select></div>'
		},
		{
			type: 'html', id: 'pageinfo',
			html: '<div id="DocumentPageNumberStatus" style="height:26px;line-height:26px;font-size:16px;"></div>'
		},
		{type: 'break', id: 'changepagenumberbreak'},

		{type: 'html',  id: 'search',
			html: '<div style="padding: 3px 10px; font-size:16px;">' +
			' ' + _('Search:') +
			'    <input size="10" id="viewer-input"' +
			'style="border-radius: 2px; border: 1px solid silver" spellcheck="false"/>' +
			'</div>'
		},
		{type: 'button',  id: 'searchprev', img: 'prev', hint: _UNO('.uno:UpSearch'), disabled: true},
		{type: 'button',  id: 'searchnext', img: 'next', hint: _UNO('.uno:DownSearch'), disabled: true},
		{type: 'button',  id: 'cancelsearch', img: 'cancel', hint: _('Cancel the search'), hidden: true},
		{type: 'spacer'},
		{type: 'button',  id: 'fullscreen-presentation', img: 'presentation', hidden:true, hint: _('Fullscreen presentation')},
		{type: 'break', id: 'presentationbreak', hidden:true},
		{type: 'button',  id: 'zoomout', img: 'zoomout', hint: _UNO('.uno:ZoomMinus')},
		{type: 'menu-radio', id: 'zoom', text: '100%',
			selected: 'zoom100', hint: _('Zoom factor'),
			items: [
				{ id: 'zoom30', text: '30%', scale: 4},
				{ id: 'zoom40', text: '40%', scale: 5},
				{ id: 'zoom50', text: '50%', scale: 6},
				{ id: 'zoom60', text: '60%', scale: 7},
				{ id: 'zoom70', text: '70%', scale: 8},
				{ id: 'zoom85', text: '85%', scale: 9},
				{ id: 'zoom100', text: '100%', scale: 10},
				{ id: 'zoom120', text: '120%', scale: 11},
				{ id: 'zoom150', text: '150%', scale: 12},
				{ id: 'zoom175', text: '175%', scale: 13},
				{ id: 'zoom200', text: '200%', scale: 14}
			]
		},
		{type: 'button',  id: 'zoomin', img: 'zoomin', hint: _UNO('.uno:ZoomPlus')},
		{type: 'break'},
		{
			type: 'menu',  id: 'downloadas', img: 'save', hint: _UNO('.uno:SaveAs', 'text'), hidden: true,
			items: []
		},
		{type: 'button',  id: 'print', img: 'print', hint: _UNO('.uno:Print', 'text'), hidden: true},
		{type: 'break', id:'outputbreak', hidden: true},
		{type: 'button',  id: 'closedocument',  img: 'closebuttonimage', hint: _UNO('.uno:CloseDoc', 'text')},
	],

	onAdd: function(map) {
		this._map = map;

		this._initLayout(); // 初始化工具列

		map.on('pagenumberchanged', this._onPageNumberChanged, this); // writer 選取頁面變更
		map.on('updateparts', this._onPageNumberChanged, this); // calc 變更工作表
		map.on('zoomend', this._onZoomend, this); // 頁面縮放完成事件
		map.on('search', this._onMapSearch, this); // 執行搜尋

		return L.DomUtil.create('div', ''); // 傳回空的 div element
	},

	onRemove: function(map) {
		this._hide(); // 隱藏工具列

		w2ui['viewerbar'].destroy(); // 移除工具列

		map.off('pagenumberchanged', this._onPageNumberChanged, this); // writer 選取頁面變更
		map.off('updateparts', this._onPageNumberChanged, this); // calc 變更工作表
		map.off('zoomend', this._onZoomend, this); // 頁面縮放完成事件
		map.off('search', this._onMapSearch, this); // 執行搜尋

		L.DomUtil.remove(this._toolbar); // 移除工具列的 dom element
	},

	_initLayout: function() {
		var that = this;
		var map = this._map;
		var filename = map.getFileName(); // 檔案名稱
		var docType = map.getDocType(); // 文件型態

		// 建立工具列的 dom element
		this._toolbar = L.DomUtil.createWithId('div', 'toolbar-viewer-wrapper', document.body);
		var toolbar = $(this._toolbar);

		toolbar.w2toolbar({
			name: 'viewerbar',
			tooltip: 'bottom',
			items: this._items,
			onRefresh: function(e) {
				that._onRefresh(e);
			},
			onClick: function(e) {
				that._onClick(e);
			}
		});

		toolbar.bind('touchstart', function() {
			w2ui['viewerbar'].touchStarted = true;
		});

		var viewerbar = w2ui['viewerbar'];
		// 試算表的縮放比例不能低於 60%
		if (docType === 'spreadsheet') {
			viewerbar.set('zoom', {
				items: [
					{ id: 'zoom60', text: '60%', scale: 7},
					{ id: 'zoom70', text: '70%', scale: 8},
					{ id: 'zoom85', text: '85%', scale: 9},
					{ id: 'zoom100', text: '100%', scale: 10},
					{ id: 'zoom120', text: '120%', scale: 11},
					{ id: 'zoom150', text: '150%', scale: 12},
					{ id: 'zoom175', text: '175%', scale: 13},
					{ id: 'zoom200', text: '200%', scale: 14}
				]
			});
		}

		// 設定檔案類別圖示
		var iconClass = 'document-logo ';
		var canChangePage = true; // 預設顯示跳頁選項
		if (docType === 'text') {
			iconClass += 'writer-icon-img';
		} else if (docType === 'spreadsheet') {
			iconClass += 'calc-icon-img';
		} else if (docType === 'presentation' || docType === 'drawing') {
			canChangePage = false; // impress 無跳頁選項
			iconClass += 'impress-icon-img';
		}
		viewerbar.set('filename', {
			html : '<div style="border-bottom:2px dashed #bbbbbb;overflow:hidden;max-width:400px;text-align:left;font-size:16px" title="' +
				_('File name:') + filename + '">' +
				'<div id="document-logo" class="' + iconClass + '" style="display:inline-block;vertical-align:middle;cursor:pointer">' +
				'</div>&nbsp;' + filename + '</div>'
		});

		$('#document-logo').on('click', function(/*e*/) {map.showLOAboutDialog();});

		// 顯示跳頁選項
		if (!canChangePage) {
			viewerbar.hide('changepagenumber', 'pageinfo', 'changepagenumberbreak');
		}

		$('#viewer-input').on('input', function(e) {that._onSearch(e);});
		$('#viewer-input').on('keydown', function(e) {that._onSearchKeyDown(e);});

		// 簡報檔類型且未被禁止輸出
		if (docType === 'presentation' && !map['wopi'].HideExportOption) {
			viewerbar.show('fullscreen-presentation', 'presentationbreak');
		}

		// 設定另存檔案型態列表
		viewerbar.set('downloadas', this._getSaveAsList(docType));
		// view 模式且未被禁止輸出，才能顯示下載為XXX以及列印按鈕
		if (map._permission === 'view' && !map['wopi'].HideExportOption) {
			viewerbar.show('downloadas', 'print', 'outputbreak');
		}

		this._show();
		w2ui['viewerbar'].resize();
	},

	/*
	 * 顯示工具列
	 */
	_show: function() {
		$(this._toolbar).show();
	},

	/*
	 * 隱藏工具列
	 */
	_hide: function() {
		$(this._toolbar).hide();
	},

	/*
	 * 取得各類文件可存檔的列表
	 */
	_getSaveAsList: function(docType) {
		var saveAsLises = {
			'text': {
				items: [
					{id: 'downloadas-pdf', text: _('PDF Document (.pdf)')},
					{id: 'downloadas-txt', text: _('TEXT Document (.txt)')},
					{id: 'downloadas-html', text: _('HTML Document (.html)')},
					{id: 'downloadas-odt', text: _('ODF text document (.odt)')},
					{id: 'downloadas-doc', text: _('Word 2003 Document (.doc)')},
					{id: 'downloadas-docx', text: _('Word Document (.docx)')},
					{id: 'downloadas-rtf', text: _('Rich Text (.rtf)')},
				]
			},
			'spreadsheet': {
				items: [
					{id: 'downloadas-pdf', text: _('PDF Document (.pdf)')},
					{id: 'downloadas-html', text: _('HTML Document (.html)')},
					{id: 'downloadas-ods', text: _('ODF spreadsheet (.ods)')},
					{id: 'downloadas-xls', text: _('Excel 2003 Spreadsheet (.xls)')},
					{id: 'downloadas-xlsx', text: _('Excel Spreadsheet (.xlsx)')},
					{id: 'downloadas-csv', text: _('CSV (.csv)')},
				]
			},
			'presentation': {
				items: [
					{id: 'downloadas-pdf', text: _('PDF Document (.pdf)')},
					{id: 'downloadas-html', text: _('HTML Document (.html)')},
					{id: 'downloadas-odp', text: _('ODF presentation (.odp)')},
					{id: 'downloadas-ppt', text: _('PowerPoint 2003 Presentation (.ppt)')},
					{id: 'downloadas-pptx', text: _('PowerPoint Presentation (.pptx)')},
				]
			}
		};
		var retList = saveAsLises[docType];

		return retList !== undefined ? retList : {items: []};
	},

	/*
	 *
	 */
	_onRefresh: function(e) {
		console.debug('onRefresh : ', e);
		var item = e.item;
		if (item === null) {
			return;
		}

		var command = {};
		switch (item.type) {
		case 'button':
			command.name = e.target;
			this._map.addAllowedCommand(command);
			break;
		case 'menu':
		case 'menu-radio':
			var items = item.items;
			for (var i in items) {
				if (items[i].type === undefined && items[i].id !== undefined) {
					command.name = items[i].id;
					this._map.addAllowedCommand(command);
				}
			}
			break;
		case 'html':
			break;
		}
	},

	/*
	 * 頁面搜尋 callback
	 */
	_onMapSearch: function (e) {
		var map = this._map;
		var viewerbar = w2ui['viewerbar'];
		var $viewerInput = $('#viewer-input');
		// 沒有搜尋到任何結果
		if (e.count === 0) {
			viewerbar.disable('searchprev');
			viewerbar.disable('searchnext');
			viewerbar.hide('cancelsearch');
			$viewerInput.addClass('search-not-found');
			map.resetSelection();
			setTimeout(function () {
				$viewerInput.removeClass('search-not-found');
			}, 500);
		}
	},

	_onSearch: function(/*e*/) {
		var map = this._map;
		var viewerbar = w2ui['viewerbar'];
		var $viewerInput = $('#viewer-input');

		if ($viewerInput.val() === '') {
			this._cancelSearch();
		}
		else {
			if (map.getDocType() === 'text') {
				map.search($viewerInput.val(), false, '', 0, true /* expand search */);
			}
			viewerbar.enable('searchprev');
			viewerbar.enable('searchnext');
			viewerbar.show('cancelsearch');
		}
	},

	/*
	 * 搜尋框按鍵事件
	 */
	_onSearchKeyDown: function(e) {
		var map = this._map;
		var $viewerInput = $('#viewer-input');
		if ((e.keyCode === 71 && e.ctrlKey) || e.keyCode === 114 || e.keyCode === 13) {
			if (e.shiftKey) {
				map.search($viewerInput.val(), true);
			} else {
				map.search($viewerInput.val());
			}
			e.preventDefault();
		} else if (e.keyCode === 27) { // 按下 ESC 鍵
			this._cancelSearch();
		}
	},

	/*
	 * Toolbar item 被點擊
	 */
	_onClick: function(e) {
		var map = this._map;
		var item = e.item;
		var id = '';
		var $viewerInput = $('#viewer-input');

		if (item === null) {
			return;
		}

		switch (item.type) {
		case 'button':
			id = item.id;
			break;
		case 'menu':
		case 'menu-radio':
			if (e.subItem !== undefined) {
				id = e.subItem.id;
			}
			break;
		}

		switch (id) {
		case 'searchprev': // 往前搜尋
			map.search($viewerInput.val(), true);
			break;
		case 'searchnext': // 往後搜尋
			map.search($viewerInput.val());
			break;
		case 'cancelsearch': // 清除搜尋
			this._cancelSearch();
			break;
		case '':
			// do nothing
			break;
		default:
			this._map.executeAllowedCommand(id);
			break;
		}
	},

	/*
	 * 清除搜尋狀態
	 */
	_cancelSearch: function() {
		var map = this._map;
		var viewerbar = w2ui['viewerbar'];
		map.resetSelection();
		viewerbar.hide('cancelsearch');
		viewerbar.disable('searchprev');
		viewerbar.disable('searchnext');
		$('#viewer-input').val('');
	},

	/*
	 * 頁面縮放完成事件
	 */
	_onZoomend: function() {
		var map = this._map;
		var zoomPercent = 100;
		var zoomSelected = null;
		switch (map.getZoom()) {
		case 4:  zoomPercent =  30; zoomSelected = 'zoom30'; break;
		case 5:  zoomPercent =  40; zoomSelected = 'zoom40'; break;
		case 6:  zoomPercent =  50; zoomSelected = 'zoom50'; break;
		case 7:  zoomPercent =  60; zoomSelected = 'zoom60'; break;
		case 8:  zoomPercent =  70; zoomSelected = 'zoom70'; break;
		case 9:  zoomPercent =  85; zoomSelected = 'zoom85'; break;
		case 10: zoomPercent = 100; zoomSelected = 'zoom100'; break;
		case 11: zoomPercent = 120; zoomSelected = 'zoom120'; break;
		case 12: zoomPercent = 150; zoomSelected = 'zoom150'; break;
		case 13: zoomPercent = 175; zoomSelected = 'zoom175'; break;
		case 14: zoomPercent = 200; zoomSelected = 'zoom200'; break;
		default:
			var zoomRatio = map.getZoomScale(map.getZoom(), map.options.zoom);
			zoomPercent = Math.round(zoomRatio * 100) + '%';
			break;
		}
		zoomPercent += '%';
		w2ui['viewerbar'].set('zoom', {text: zoomPercent, selected: zoomSelected});
	},

	/*
	 * 選取頁面變更
	 */
	_onPageNumberChanged: function(e) {
		var map = this._map;
		var docType = map.getDocType();
		var numPages, currPage;
		var selected = '', options = '';
		var names, i;
		var $changeNumber = $('#ChangePageNumber');
		var $pageInfo = $('#DocumentPageNumberStatus');

		if (docType === 'text') {
			numPages = e.pages; // 總頁數
			currPage = e.currentPage; // 目前頁次
			// 製作下拉選項
			for (i = 0 ; i < numPages; i ++) {
				selected = (i === currPage ? ' selected' : '');
				options += '<option value="' + i + '"' + selected + '>' + (i + 1) + '</option>';
			}
		} else if (docType === 'spreadsheet') {
			numPages = e.parts; // 總工作表數
			currPage = e.selectedPart; // 目前所在工作表
			if (e.partNames !== undefined) {
				names = e.partNames;
				for (i = 0 ; i < numPages; i ++) {
					selected = (i === currPage ? ' selected' : '');
					if (!map.isHiddenPart(i)) {
						options += '<option value="' + i + '"' + selected + '>' + names[i] + '</option>';
					}
				}
				$pageInfo.html('&nbsp;(' + (currPage + 1) + ' / ' + numPages + ')');
			}
		} else {
			return;
		}

		if (options !== '') {
			$changeNumber.html(options);
			$changeNumber.change(function(/*e*/) {
				var pageId = parseInt($(this).val()); // 選取的 value
				if (docType === 'text') {
					map.goToPage(pageId);
				} else if (docType === 'spreadsheet') {
					map.setPart(pageId);
				}
			});
		}
	},
});

L.control.preview = function (options) {
	return new L.Control.Preview(options);
};
