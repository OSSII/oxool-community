/* -*- js-indent-level: 8 -*- */
/*
* Control.Menubar
*/

/* global app $ _ _UNO vex L */
L.Control.Menubar = L.Control.extend({
	// TODO: Some mechanism to stop the need to copy duplicate menus (eg. Help, eg: mobiledrawing)
	options: {
		mobiletext:  [
			{name: _('Search'), id: 'searchdialog', type: 'action'},
			{name: _UNO('.uno:PickList', 'text'), id: 'file', type: 'menu', menu: [
				{name: _UNO('.uno:Save', 'text'), id: 'save', type: 'action'},
				{name: _UNO('.uno:SaveAs', 'text'), id: 'saveas', type: 'action'},
				{name: _('Share...'), id:'shareas', type: 'action'},
				{name: _('See revision history'), id: 'rev-history', type: 'action'},
				{name: _('Sign document'), id: 'signdocument', type: 'action'},
				{type: 'separator'},
				{name: _UNO('.uno:Print', 'text'), id: 'print', type: 'action'}
			]},
			{name: !window.ThisIsAMobileApp ? _('Download as') : _('Export as'), id: 'downloadas', type: 'menu', menu: [
				{name: _('PDF Document (.pdf)'), id: 'downloadas-pdf', type: 'action'},
				{name: _('ODF text document (.odt)'), id: 'downloadas-odt', type: 'action'},
				{name: _('Word 2003 Document (.doc)'), id: 'downloadas-doc', type: 'action'},
				{name: _('Word Document (.docx)'), id: 'downloadas-docx', type: 'action'},
				{name: _('Rich Text (.rtf)'), id: 'downloadas-rtf', type: 'action'},
				{name: _('EPUB (.epub)'), id: 'downloadas-epub', type: 'action'}
			]},
			{name: _UNO('.uno:EditMenu', 'text'), id: 'editmenu', type: 'menu', menu: [
				{uno: '.uno:Undo'},
				{uno: '.uno:Redo'},
				{name: _('Repair'), id: 'repair',  type: 'action'},
				{type: 'separator'},
				{uno: '.uno:Cut'},
				{uno: '.uno:Copy'},
				{uno: '.uno:Paste'},
				{uno: '.uno:SelectAll'}
			]},
			{name: _UNO('.uno:ChangesMenu', 'text'), id: 'changesmenu', type: 'menu', menu: [
				{uno: '.uno:TrackChanges'},
				{uno: '.uno:ShowTrackedChanges'},
				{type: 'separator'},
				{uno: '.uno:AcceptAllTrackedChanges'},
				{uno: '.uno:RejectAllTrackedChanges'},
				{uno: '.uno:PreviousTrackedChange'},
				{uno: '.uno:NextTrackedChange'}
			]},
			{name: _UNO('.uno:ViewMenu', 'text'), id: 'view', type: 'menu', menu: [
				{name: _UNO('.uno:FullScreen', 'text'), id: 'fullscreen', type: 'action', mobileapp: false},
				{uno: '.uno:ControlCodes'},
				{uno: '.uno:SpellOnline'},
				{name: _UNO('.uno:ShowResolvedAnnotations', 'text'), id: 'showresolved', type: 'action', uno: '.uno:ShowResolvedAnnotations'},
			]
			},
			{id: 'watermark', uno: '.uno:Watermark'},
			{name: _('Page Setup'), id: 'pagesetup', type: 'action'},
			{uno: '.uno:WordCountDialog'},
			{name: _UNO('.uno:RunMacro'), id: 'runmacro', uno: '.uno:RunMacro'},
			{name: _('Latest Updates'), id: 'latestupdates', type: 'action', iosapp: false},
			{name: _('Send Feedback'), id: 'feedback', type: 'action'},
			{name: _('About'), id: 'about', type: 'action'},
		],

		mobilepresentation: [
			{name: _('Search'), id: 'searchdialog', type: 'action'},
			{name: _UNO('.uno:PickList', 'presentation'), id: 'file', type: 'menu', menu: [
				{name: _UNO('.uno:Save', 'presentation'), id: 'save', type: 'action'},
				{name: _UNO('.uno:SaveAs', 'presentation'), id: 'saveas', type: 'action'},
				{name: _('Share...'), id:'shareas', type: 'action'},
				{name: _('See revision history'), id: 'rev-history', type: 'action'},
				{type: 'separator'},
				{name: _UNO('.uno:Print', 'presentation'), id: 'print', type: 'action'}
			]},
			{name: !window.ThisIsAMobileApp ? _('Download as') : _('Export as'), id:'downloadas', type: 'menu', menu: [
				{name: _('PDF Document (.pdf)'), id: 'downloadas-pdf', type: 'action'},
				{name: _('ODF presentation (.odp)'), id: 'downloadas-odp', type: 'action'},
				{name: _('PowerPoint 2003 Presentation (.ppt)'), id: 'downloadas-ppt', type: 'action'},
				{name: _('PowerPoint Presentation (.pptx)'), id: 'downloadas-pptx', type: 'action'},
				{name: _('ODF Drawing (.odg)'), id: 'downloadas-odg', type: 'action'}
			]},
			{name: _UNO('.uno:EditMenu', 'presentation'), id: 'editmenu', type: 'menu', menu: [
				{uno: '.uno:Undo'},
				{uno: '.uno:Redo'},
				{name: _('Repair'), id: 'repair',  type: 'action'},
				{type: 'separator'},
				{uno: '.uno:Cut'},
				{uno: '.uno:Copy'},
				{uno: '.uno:Paste'},
				{uno: '.uno:SelectAll'}
			]},
			{name: _UNO('.uno:TableMenu', 'text'/*HACK should be 'presentation', but not in xcu*/), id: 'tablemenu', type: 'menu', menu: [
				{uno: '.uno:InsertRowsBefore'},
				{uno: '.uno:InsertRowsAfter'},
				{type: 'separator'},
				{uno: '.uno:InsertColumnsBefore'},
				{uno: '.uno:InsertColumnsAfter'},
				{uno: '.uno:SelectTable'},
				{uno: '.uno:EntireRow'},
				{uno: '.uno:EntireColumn'},
				{uno: '.uno:MergeCells'},
				{uno: '.uno:DeleteRows'},
				{uno: '.uno:DeleteColumns'},
				{uno: '.uno:DeleteTable'},
			]
			},
			{name: _UNO('.uno:SlideMenu', 'presentation'), id: 'slidemenu', type: 'menu', menu: [
				{name: _UNO('.uno:InsertSlide', 'presentation'), id: 'insertpage', type: 'action'},
				{name: _UNO('.uno:DuplicateSlide', 'presentation'), id: 'duplicatepage', type: 'action'},
				{name: _UNO('.uno:DeleteSlide', 'presentation'), id: 'deletepage', type: 'action'}]
			},
			{uno: '.uno:SpellOnline'},
			{name: _UNO('.uno:RunMacro'), id: 'runmacro', uno: '.uno:RunMacro'},
			{name: _('Fullscreen presentation'), id: 'fullscreen-presentation', type: 'action'},
			{name: _UNO('.uno:FullScreen', 'presentation'), id: 'fullscreen', type: 'action', mobileapp: false},
			{name: _('Latest Updates'), id: 'latestupdates', type: 'action', iosapp: false},
			{name: _('Send Feedback'), id: 'feedback', type: 'action'},
			{name: _('About'), id: 'about', type: 'action'},
		],

		mobiledrawing: [
			{name: _('Search'), id: 'searchdialog', type: 'action'},
			{name: _UNO('.uno:PickList', 'presentation'), id: 'file', type: 'menu', menu: [
				{name: _UNO('.uno:Save', 'presentation'), id: 'save', type: 'action'},
				{name: _UNO('.uno:SaveAs', 'presentation'), id: 'saveas', type: 'action'},
				{name: _('Share...'), id:'shareas', type: 'action'},
				{name: _UNO('.uno:Print', 'presentation'), id: 'print', type: 'action'},
				{name: _('See revision history'), id: 'rev-history', type: 'action'},
			]},
			{name: !window.ThisIsAMobileApp ? _('Download as') : _('Export as'), id:'downloadas', type: 'menu', menu: [
				{name: _('PDF Document (.pdf)'), id: 'downloadas-pdf', type: 'action'},
				{name: _('ODF Drawing (.odg)'), id: 'downloadas-odg', type: 'action'}
			]},
			{name: _UNO('.uno:EditMenu', 'presentation'), id: 'editmenu', type: 'menu', menu: [
				{uno: '.uno:Undo'},
				{uno: '.uno:Redo'},
				{name: _('Repair'), id: 'repair',  type: 'action'},
				{type: 'separator'},
				{uno: '.uno:Cut'},
				{uno: '.uno:Copy'},
				{uno: '.uno:Paste'},
				{uno: '.uno:SelectAll'}
			]},
			{name: _UNO('.uno:TableMenu', 'text'/*HACK should be 'presentation', but not in xcu*/), id: 'tablemenu', type: 'menu', menu: [
				{uno: '.uno:InsertRowsBefore'},
				{uno: '.uno:InsertRowsAfter'},
				{type: 'separator'},
				{uno: '.uno:InsertColumnsBefore'},
				{uno: '.uno:InsertColumnsAfter'},
				{uno: '.uno:DeleteRows'},
				{uno: '.uno:DeleteColumns'},
				{uno: '.uno:MergeCells'}]
			},
			{name: _UNO('.uno:SlideMenu', 'presentation'), id: 'slidemenu', type: 'menu', menu: [
				{name: _UNO('.uno:InsertSlide', 'presentation'), id: 'insertpage', type: 'action'},
				{name: _UNO('.uno:DuplicateSlide', 'presentation'), id: 'duplicatepage', type: 'action'},
				{name: _UNO('.uno:DeleteSlide', 'presentation'), id: 'deletepage', type: 'action'}]
			},
			{uno: '.uno:SpellOnline'},
			{name: _UNO('.uno:RunMacro'), id: 'runmacro', uno: '.uno:RunMacro'},
			{name: _UNO('.uno:FullScreen', 'presentation'), id: 'fullscreen', type: 'action', mobileapp: false},
			{name: _('Latest Updates'), id: 'latestupdates', type: 'action', iosapp: false},
			{name: _('Send Feedback'), id: 'feedback', type: 'action'},
			{name: _('About'), id: 'about', type: 'action'},
		],

		mobilespreadsheet: [
			{name: _('Search'), id: 'searchdialog', type: 'action'},
			{name: _UNO('.uno:PickList', 'spreadsheet'), id: 'file', type: 'menu', menu: [
				{name: _UNO('.uno:Save', 'spreadsheet'), id: 'save', type: 'action'},
				{name: _UNO('.uno:SaveAs', 'spreadsheet'), id: 'saveas', type: 'action'},
				{name: _('Share...'), id:'shareas', type: 'action'},
				{name: _('See revision history'), id: 'rev-history', type: 'action'},
				{type: 'separator'},
				{name: _UNO('.uno:Print', 'spreadsheet'), id: 'print', type: 'action'}
			]},
			{name: !window.ThisIsAMobileApp ? _('Download as') : _('Export as'), id:'downloadas', type: 'menu', menu: [
				{name: _('PDF Document (.pdf)'), id: 'downloadas-pdf', type: 'action'},
				{name: _('ODF spreadsheet (.ods)'), id: 'downloadas-ods', type: 'action'},
				{name: _('Excel 2003 Spreadsheet (.xls)'), id: 'downloadas-xls', type: 'action'},
				{name: _('Excel Spreadsheet (.xlsx)'), id: 'downloadas-xlsx', type: 'action'}
			]},
			{name: _UNO('.uno:EditMenu', 'spreadsheet'), id: 'editmenu', type: 'menu', menu: [
				{uno: '.uno:Undo'},
				{uno: '.uno:Redo'},
				{name: _('Repair'), id: 'repair',  type: 'action'},
				{type: 'separator'},
				{uno: '.uno:Cut'},
				{uno: '.uno:Copy'},
				{uno: '.uno:Paste'},
				{uno: '.uno:SelectAll'}
			]},
			{name: _UNO('.uno:SheetMenu', 'spreadsheet'), id: 'sheetmenu', type: 'menu', menu: [
				{name: _UNO('.uno:InsertRowsMenu', 'spreadsheet'), id: 'insertrowsmenu', type: 'menu', menu: [
					{uno: '.uno:InsertRowsBefore'},
					{uno: '.uno:InsertRowsAfter'}]},
				{name: _UNO('.uno:InsertColumnsMenu', 'spreadsheet'), id: 'insertcolumnsmenu', type: 'menu', menu: [
					{uno: '.uno:InsertColumnsBefore'},
					{uno: '.uno:InsertColumnsAfter'}]},
				{name: _UNO('.uno:InsertBreakMenu', 'spreadsheet'), id: 'insertbreakmenu', type: 'menu', menu: [
					{uno: '.uno:InsertRowBreak'},
					{uno: '.uno:InsertColumnBreak'}]},
				{type: 'separator'},
				{uno: '.uno:DeleteRows'},
				{uno: '.uno:DeleteColumns'},
				{name: _UNO('.uno:DelBreakMenu', 'spreadsheet'), id: 'delbreakmenu', type: 'menu', menu: [
					{uno: '.uno:DeleteRowbreak'},
					{uno: '.uno:DeleteColumnbreak'}]},
				{type: 'separator'},
			]},
			{name: _UNO('.uno:DataMenu', 'spreadsheet'), id: 'datamenu', type: 'menu', menu: [
				{uno: '.uno:Validation'},
				{type: 'separator'},
				{uno: '.uno:SortAscending'},
				{uno: '.uno:SortDescending'},
				{type: 'separator'},
				{name: _UNO('.uno:GroupOutlineMenu', 'spreadsheet'), id: 'groupoutlinemenu', type: 'menu', menu: [
					{uno: '.uno:Group'},
					{uno: '.uno:Ungroup'},
					{type: 'separator'},
					{uno: '.uno:ClearOutline'},
					{type: 'separator'},
					{uno: '.uno:HideDetail'},
					{uno: '.uno:ShowDetail'}]}
			]},
			{uno: '.uno:SpellOnline'},
			{name: _UNO('.uno:RunMacro'), id: 'runmacro', uno: '.uno:RunMacro'},
			{name: _UNO('.uno:FullScreen', 'spreadsheet'), id: 'fullscreen', type: 'action', mobileapp: false},
			{name: _('Latest Updates'), id: 'latestupdates', type: 'action', iosapp: false},
			{name: _('Send Feedback'), id: 'feedback', type: 'action'},
			{name: _('About'), id: 'about', type: 'action'},
		],

		mobileInsertMenu : {
			text : {
				id: '.uno:InsertMenu', menu: [
					{id: '.uno:InsertGraphic'},
					{id: '.uno:InsertObjectChart'},
					{id: '.uno:InsertAnnotation'},
					{name: '.uno:InsertTable', id: 'inserttable'},
					{type: 'separator'},
					{id: '.uno:InsertFootnote'},
					{id: '.uno:InsertEndnote'},
					{type: 'separator'},
					{id: '.uno:InsertPagebreak'},
					{id: '.uno:InsertColumnBreak'},
					{type: 'separator'},
				]
			},
			spreadsheet : {
				id: '.uno:InsertMenu', menu: [
					{id: '.uno:InsertGraphic'},
					{id: '.uno:InsertObjectChart'},
					{id: '.uno:InsertAnnotation'},
					{type: 'separator'},
					{id: '.uno:InsertCurrentDate'},
					{id: '.uno:InsertCurrentTime'},
					// other fields need EditEngine context & can't be disabled in the menu.
				]
			},
			presentation : {
				id: '.uno:InsertMenu', menu: [
					{id: '.uno:InsertGraphic'},
					{id: '.uno:InsertObjectChart'},
					{id: '.uno:InsertAnnotation'},
					{name: '.uno:InsertTable', id: 'inserttable'},
				]
			},
			drawing : {
				id: '.uno:InsertMenu', menu: [
					{id: '.uno:InsertGraphic'},
					{id: '.uno:InsertObjectChart'},
					{id: '.uno:InsertAnnotation'},
					{name: '.uno:InsertTable', id: 'inserttable'},
				]
			}
		},

		commandStates: {},

		// Only these menu options will be visible in readonly mode
		allowedReadonlyMenus: ['file', 'downloadas', 'view', 'insert', 'help'],

		allowedViewModeActions: [
			'savecomments', 'shareas', 'print', // file menu
			'downloadas-pdf', 'downloadas-odt', 'downloadas-doc', 'downloadas-docx', 'downloadas-rtf', 'downloadas-epub', // file menu
			'downloadas-odp', 'downloadas-ppt', 'downloadas-pptx', 'downloadas-odg', 'print', // file menu
			'downloadas-ods', 'downloadas-xls', 'downloadas-xlsx', 'downloadas-csv', 'closedocument', // file menu
			'fullscreen', 'zoomin', 'zoomout', 'zoomreset', 'showresolved', // view menu
			'about', 'keyboard-shortcuts', 'online-help', 'report-an-issue', // help menu
			'insertcomment'
		],

		// 具有動態選單的選項
		dynamicMenu: {
			'.uno:InsertPageHeader': {type: 'pageheader'}, // 插入/頁首與頁尾/頁首
			'.uno:InsertPageFooter': {type: 'pagefooter'}, // 插入/頁首與頁尾/頁尾
			'.uno:SetLanguageSelectionMenu': {type: 'languageselection'}, // 工具/語言/選取
			'.uno:SetLanguageParagraphMenu': {type: 'languageparagraph'}, // 工具/語言/段落
			'.uno:SetLanguageAllTextMenu': {type: 'languagealltext'}, // 工具/語言/所有文字
		},
	},

	languages: [],

	onAdd: function (map) {
		this._initialized = false;

		// 全螢幕在 IE 11 和 Edge 上不正常
		if (L.Browser.ie || L.Browser.edge) {
			// 把 fullscreen 從允許唯讀列表中移除
			var index = this.options.allowedViewModeActions.indexOf('fullscreen');
			if (index > 0) {
				this.options.allowedViewModeActions.splice(index, 1);
			}
		}

		this._hiddenItems = [];
		this._menubarCont = L.DomUtil.get('main-menu');
		// In case it contains garbage
		if (this._menubarCont)
			this._menubarCont.remove();
		// Use original template as provided by server
		this._menubarCont = map.mainMenuTemplate.cloneNode(true);
		$('#main-menu-state').after(this._menubarCont);

		map.on('doclayerinit', this._onDocLayerInit, this);
		//map.on('updatepermission', this._onRefresh, this);
		map.on('addmenu', this._addMenu, this);
		map.on('commandvalues', this._onInitLanguagesMenu, this);
		map.on('updatetoolbarcommandvalues', this._onStyleMenu, this);

		// 監控指定的指令狀態
		/* .uno:Undo, .uno:Redo, .uno:Repeat 會隨著編輯狀態改變，需要反應在選單名稱上 */
		this._map.stateChangeHandler.on('.uno:Undo', this._onChangeItemName, this);
		this._map.stateChangeHandler.on('.uno:Redo', this._onChangeItemName, this);
		this._map.stateChangeHandler.on('.uno:Repeat', this._onChangeItemName, this);

		this._resetOverflow();
	},

	onRemove: function() {
		this._map.off('doclayerinit', this._onDocLayerInit, this);
		//this._map.off('updatepermission', this._onRefresh, this);
		this._map.off('addmenu', this._addMenu, this);
		this._map.off('commandvalues', this._onInitLanguagesMenu, this);
		this._map.off('updatetoolbarcommandvalues', this._onStyleMenu, this);

		this._map.stateChangeHandler.off('.uno:Undo', this._onChangeItemName, this);
		this._map.stateChangeHandler.off('.uno:Redo', this._onChangeItemName, this);
		this._map.stateChangeHandler.off('.uno:Repeat', this._onChangeItemName, this);

		this._menubarCont.remove();
		this._menubarCont = null;

		this._resetOverflow();
	},

	/**
	 * 動態改變選項文字
	 * @param {event} e - statechangehandler 產生的事件
	 */
	_onChangeItemName: function(e) {
		// 以 id 找這個 item
		var liItem = document.getElementById('menu-' + e.commandName);
		if (liItem && liItem.mgr) {
			// 確實有值就改變選行名稱
			if (e.hasValue()) {
				var text = window.removeAccessKey(e.value());
				liItem.mgr.setText(text);
			} else { // 否則恢復預設名稱
				liItem.mgr.setDefaultText();
			}
		}
	},

	_addMenu: function (e) {
		var alreadyExists = L.DomUtil.get('menu-' + e.id);
		if (alreadyExists)
			return;

		var liItem = this._createItem({
			text: e.label,
			id: e.id
		});

		liItem.mgr.data('postmessage', true);

		this._menubarCont.insertBefore(liItem, this._menubarCont.firstChild);
	},

	_onInitLanguagesMenu: function (e) {
		if (e.commandName === '.uno:LanguageStatus' && L.Util.isArray(e.commandValues)) {
			this.languages = [];
			e.commandValues.forEach(function(language) {
				var split = language.split(';');
				language = split[0];
				var isoCode = '';
				if (split.length > 1)
					isoCode = split[1];
				this.languages.push({translated: _(language), neutral: language, iso: isoCode});
			}.bind(this));

			this.languages.sort(function(a, b) {
				return a.translated < b.translated ? -1 : a.translated > b.translated ? 1 : 0;
			});
		}
	},

	_addTabIndexPropsToMainMenu: function () {
		var mainMenu = document.getElementById('main-menu');
		for (var i = 0; i < mainMenu.children.length; i++) {
			if (mainMenu.children[i].children[0].getAttribute('aria-haspopup') === 'true') {
				mainMenu.children[i].children[0].tabIndex = 0;
			}
		}
	},

	_onRefresh: function() {
		// 選單列已初始化完畢，就結束，避免重複執行
		if (this._menubarInitialized === true) {
			return;
		}

		// 取得選單資料
		var menu = this._map.getMenubarData();
		// 不是 Array 型態的話，表示還沒載入完成，稍候一下再試
		if (!L.Util.isArray(menu)) {
			setTimeout(function() {
				this._onRefresh();
			}.bind(this), 50);
			return;
		}

		this._map.createFileIcon();

		// clear initial menu
		L.DomUtil.removeChildNodes(this._menubarCont);

		var menuHtml = this._createMenu(menu); // 建立主選單
		menuHtml.forEach(function(menu) {
			// 第一階選項需移除 icon
			if (menu.mgr) {
				var aItem = menu.mgr.getItem();
				if (aItem.firstChild.classList.contains('menuicon')) {
					aItem.removeChild(aItem.firstChild);
				}
			}
			this._menubarCont.appendChild(menu);
		}.bind(this));

		// initialize menubar plugin
		$('#main-menu').smartmenus({
			hideOnClick: true,
			showOnClick: true,
			hideTimeout: 0,
			hideDuration: 0,
			hideFunction: null,
			showDuration: 0,
			showFunction: null,
			showTimeout: 0,
			collapsibleHideDuration: 0,
			subMenusMinWidth: '8em',
			subMenusMaxWidth: '25em',
			subIndicatorsPos: 'append',
			subIndicatorsText: '&#8250;'
		}).attr('tabindex', 0)
			.on('select.smapi', this._onItemSelected.bind(this))
			.on('beforeshow.smapi', this._beforeShow.bind(this))
			.on('click.smapi', this._onItemClicked.bind(this));

		document.getElementById('main-menu').setAttribute('role', 'menubar');
		this._addTabIndexPropsToMainMenu();
		this._menubarInitialized = true;
	},

	/**
	 * 目前只有在手機模式才用
	 * @param {event} e
	 */
	_onStyleMenu: function (e) {
		if (window.mode.isMobile() && e.commandName === '.uno:StyleApply') {
			var style;
			var constArg = '&';
			var constHeader = '.uno:InsertPageHeader?PageStyle:string=';
			var constFooter = '.uno:InsertPageFooter?PageStyle:string=';
			var pageStyles = e.commandValues['HeaderFooter'];
			for (var iterator in pageStyles) {
				style = pageStyles[iterator];

				var docType = this._map.getDocType();
				var target = this.options['mobileInsertMenu'][docType];

				var findFunction = function(item) {
					return item.name === _(style);
				};

				var foundMenu = this._findSubMenuByName(target, _UNO('.uno:InsertPageHeader', 'text'));
				if (foundMenu && foundMenu.menu.find(findFunction) === undefined)
					foundMenu.menu.push({name: _(style), tag: style, uno: constHeader + encodeURIComponent(style) + constArg});

				foundMenu = this._findSubMenuByName(target, _UNO('.uno:InsertPageFooter', 'text'));
				if (foundMenu && foundMenu.menu.find(findFunction) === undefined)
					foundMenu.menu.push({name: _(style), tag: style, uno: constFooter + encodeURIComponent(style) + constArg});

			}
		}
	},

	_createDocument: function(e) {
		var self = e.data.self;
		var docType = self._map.getDocType();
		self._map.fire('postMessage', {msgId: 'UI_CreateFile', args: {DocumentType: docType}});
	},

	_onDocLayerInit: function() {
		this._onRefresh();

		if (window.mode.isMobile()) {
			$('#main-menu').parent().css('height', '0');
			$('#toolbar-wrapper').removeClass('readonly');
			$('#toolbar-wrapper').addClass('mobile');
		}

		var self = this;
		// Also the vertical menu displayed when tapping the hamburger button is produced by SmartMenus
		$(function() {
			var $mainMenuState = $('#main-menu-state');
			if ($mainMenuState.length) {
				// animate mobile menu
				$mainMenuState.change(function() {
					// This code is invoked when the hamburger menu is opened or closed
					var $menu = $('#main-menu');
					var $nav = $menu.parent();
					if (this.checked) {
						if (!window.mode.isMobile()) {
							// Surely this code, if it really is related only to the hamburger menu,
							// will never be invoked on non-mobile browsers? I might be wrong though.
							// If you notice this logging, please modify this comment to indicate what is
							// going on.
							window.app.console.log('======> Assertion failed!? Not window.mode.isMobile()? Control.Menubar.js #1');
							$nav.css({height: 'initial', bottom: '38px'});
							$menu.hide().slideDown(250, function() { $menu.css('display', ''); });
							$('#mobile-wizard-header').show();
						} else {
							window.mobileMenuWizard = true;
							var menuData = self._map.menubar.generateFullMenuStructure();
							self._map.fire('mobilewizard', {data: menuData});
							$('#toolbar-hamburger').removeClass('menuwizard-closed').addClass('menuwizard-opened');
							$('#mobile-wizard-header').hide();
							$('#toolbar-mobile-back').hide();
							$('#formulabar').hide();
						}
					} else if (!window.mode.isMobile()) {
						// Ditto.
						window.app.console.log('======> Assertion failed!? Not window.mode.isMobile()? Control.Menubar.js #2');
						$menu.show().slideUp(250, function() { $menu.css('display', ''); });
						$nav.css({height:'', bottom: ''});
					} else {
						window.mobileMenuWizard = false;
						self._map.fire('closemobilewizard');
						$('#toolbar-hamburger').removeClass('menuwizard-opened').addClass('menuwizard-closed');
						$('#toolbar-mobile-back').show();
						$('#formulabar').show();
					}
				});
				// hide mobile menu beforeunload
				$(window).bind('beforeunload unload', function() {
					if ($mainMenuState[0].checked) {
						$mainMenuState[0].click();
					}
				});
			}
		});

		this._initialized = true;
	},

	// needed for smartmenus to work inside notebookbar
	_setupOverflow: function() {
		$('.main-nav.hasnotebookbar').css('overflow', 'visible');
		$('.notebookbar-scroll-wrapper').css('overflow', 'visible');
	},

	_resetOverflow: function() {
		$('.main-nav').css('overflow', '');
		$('.notebookbar-scroll-wrapper').css('overflow', '');
	},

	 _onMouseOut: function(e) {
		var self = e.data.self;
		self._resetOverflow();
	},

	/**
	 *
	 * @param {object} e - The jQuery.Event object
	 * @param {DOMElement} item -  The menu item <a> element.
	 * @returns true: 該選項可執行, false: 不可執行
	 */
	_onItemClicked: function(e, item) {
		if (item === undefined) {return true;} // item 有時會是 undefined?(怪怪)

		// 檢查該選項是否禁用？
		var disabled = item.mgr ? item.mgr.isDisabled() : false;
		// 未禁用且非子選單就關閉選單
		if (!disabled) {
			//$('#main-menu').smartmenus('menuHideAll');
			$.SmartMenus.hideAll();
		}

		var $mainMenuState = $('#main-menu-state');
		if (!$(item).hasClass('has-submenu') && $mainMenuState[0].checked) {
			$mainMenuState[0].click();
		}

		return (!disabled);
	},

	_createDynamicItem: function(item) {
		item.dynamic = true;
		return this._createItem(item);
	},

	/**
	 * 建立動態選單
	 * @param {string} menuId - 具有動態選項的 ID
	 */
	_createDynamicMenu: function(menuId, liItem) {
		var subMenu = liItem.lastChild;
		// 清除子選單
		if (subMenu.nodeName === 'UL') {
			while (subMenu.firstChild) {
				subMenu.removeChild(subMenu.firstChild);
			}
		} else {
			window.app.console.debug('Warning! This item has no submenu.', liItem);
			return;
		}
		var type = this.options.dynamicMenu[menuId].type;

		switch (type) {
		case 'pageheader':
		case 'pagefooter':
			var styles = this._map.getStyleFamilies(); // 取得所有式樣表
			if (styles) {
				var headerfooter = styles['HeaderFooter']; // 頁首頁尾式樣表
				if (headerfooter) {
					// 有頁首頁尾的的式樣
					var checkedHeaders = this._map['stateChangeHandler'].getItemValue(menuId);
					var checkedCnt = 0, uncheckedCnt = 0;

					headerfooter.forEach(function(name) {
						var isChecked = (checkedHeaders[name] === true);
						var item = {
							name: name,
							id: menuId + '?PageStyle:string=' + name + '&On:bool=' + (isChecked ? 'false' : 'true')
						};

						var dynaItem = this._createDynamicItem(item);
						dynaItem.mgr.setChecked(isChecked);
						subMenu.appendChild(dynaItem); // 加入選單

						// 統計選取及未選取的數量
						if (isChecked)
							checkedCnt ++;
						else
							uncheckedCnt ++;
					}.bind(this));
				}
				// 如果頁首頁尾式樣大於一，且全部選取或全部未選取
				if (headerfooter.length > 1 &&
					(checkedCnt === headerfooter.length || uncheckedCnt === headerfooter.length)) {
					var isCheckedAll = (checkedCnt === headerfooter.length); // 已經全部選取
					var item = {
						name: 'All',
						id: menuId + '?On:bool=' + (isCheckedAll ? 'false' : 'true')
					};
					var allItem = this._createDynamicItem(item);
					allItem.mgr.setChecked(isCheckedAll);
					subMenu.insertBefore(this._createItem({type: '--'}), subMenu.firstChild);
					subMenu.insertBefore(allItem, subMenu.firstChild);
				}
			}
			break;

		case 'languageselection':
		case 'languageparagraph':
		case 'languagealltext':
			var constLang = '.uno:LanguageStatus?Language:string=';
			var langState = this._map.stateChangeHandler.getItemProperty('.uno:LanguageStatus');
			var menuType;
			var constLangNone = 'LANGUAGE_NONE';
			var constResetLang = 'RESET_LANGUAGES';
			if (type === 'languageselection') {
				menuType = 'Current_';
			} else if (type === 'languageparagraph') {
				menuType = 'Paragraph_';
			} else {
				menuType = 'Default_';
			}

			for (var lang in this.languages) {
				var item = {
					name: this.languages[lang].translated,
					id: constLang + menuType + this.languages[lang].neutral,
					disabled: langState.disabled()
				};
				var dynaItem = this._createDynamicItem(item);
				subMenu.appendChild(dynaItem); // 加入選單

				// 如果未禁用，比對哪一個被勾選
				if (!langState.disabled()) {
					var split = langState.value().split(';');
					if (split[0] === this.languages[lang].neutral) {
						dynaItem.mgr.setChecked(true);
					}
				}
			}
			subMenu.appendChild(this._createDynamicItem({type: '--'})); // 分隔線
			// 無 (不檢查拼字)
			subMenu.appendChild(this._createDynamicItem({
				name: _('None (Do not check spelling)'),
				id: constLang + menuType + constLangNone,
				disabled: langState.disabled()
			}));
			// 重回預設語言
			subMenu.appendChild(this._createDynamicItem({
				name: _('Reset to Default Language'),
				id: constLang + menuType + constResetLang,
				disabled: langState.disabled()
			}));

			break;
		default:
			break;
		}

	},

	_beforeShow: function(e, menu) {
		if (e.data && e.data.self) {
			var self = e.data.self;
			self._setupOverflow();
		}
		var liItems = menu.children;
		// 如果沒有任何選項(空選單)，就不顯示該選單
		if (liItems.length === 0) {
			return false;
		}
		// liItems 是 HTMLCollection，所以只能用 for loop
		for (var i = 0;  i < liItems.length; i++) {
			if (liItems[i].mgr !== undefined) {
				liItems[i].mgr.updateState();
			} else {
				window.app.console.debug('Warning! this item has not mgr.', liItems[i]);
			}
		}
	},

	_openInsertShapesWizard: function() {
		var content = window.createShapesPanel('insertshapes');
		var data = {
			id: 'insertshape',
			type: '',
			text: _('Insert Shape'),
			enabled: true,
			children: []
		};

		var container = {
			id: '',
			type: 'htmlcontrol',
			content: content,
			enabled: true
		};

		data.children.push(container);
		this._map._docLayer._openMobileWizard(data);
	},

	// 以下僅供參考，實際不會也不要到這裡執行，若有需要新增類似程序，
	// 請在 Control.AlternativeCommand.js 中實作
	_executeAction: function(itNode, itWizard) {
		var id, postmessage;
		if (itNode === undefined)
		{ // called from JSDialogBuilder/NotebookbarBuilder
			id = itWizard.id;
			postmessage = false;
		}
		else
		{ // called from menu item
			id = itNode.mgr.getId();
			postmessage = (itNode.mgr.data('postmessage') === true);
		}

		if (id === 'save') {
			// Save only when not read-only.
			if (!this._map.isReadOnlyMode()) {
				this._map.fire('postMessage', {msgId: 'UI_Save', args: { source: 'filemenu' }});

				if (!this._map._disableDefaultAction['UI_Save']) {
					this._map.save(false, false);
				}
			}
		} else if (id === 'saveas') {
			this._map.openSaveAs();
		} else if (id === 'savecomments') {
			if (this._map.isPermissionEditForComments()) {
				this._map.fire('postMessage', {msgId: 'UI_Save'});
				if (!this._map._disableDefaultAction['UI_Save']) {
					this._map.save(false, false);
				}
			}
		} else if (id === 'shareas' || id === 'ShareAs') {
			this._map.openShare();
		} else if (id === 'print') {
			this._map.print();
		} else if (id.startsWith('downloadas-')) {
			var format = id.substring('downloadas-'.length);
			var fileName = this._map['wopi'].BaseFileName;
			fileName = fileName.substr(0, fileName.lastIndexOf('.'));
			fileName = fileName === '' ? 'document' : fileName;
			this._map.downloadAs(fileName + '.' + format, format);
		} else if (id === 'signdocument') {
			this._map.showSignDocument();
		} else if (id === 'insertcomment') {
			this._map.insertComment();
		} else if (id === 'insertgraphic') {
			L.DomUtil.get('insertgraphic').click();
		} else if (id === 'insertgraphicremote') {
			this._map.fire('postMessage', {msgId: 'UI_InsertGraphic'});
		} else if (id === 'selectbackground') {
			L.DomUtil.get('selectbackground').click();
		} else if (id === 'zoomin' && this._map.getZoom() < this._map.getMaxZoom()) {
			this._map.zoomIn(1, null, true /* animate? */);
		} else if (id === 'showresolved') {
			this._map.showResolvedComments(!$(itNode).hasClass('lo-menu-item-checked'));
		} else if (id === 'zoomout' && this._map.getZoom() > this._map.getMinZoom()) {
			this._map.zoomOut(1, null, true /* animate? */);
		} else if (id === 'zoomreset') {
			this._map.setZoom(this._map.options.zoom, null, true);
		} else if (id === 'fullscreen') {
			L.toggleFullScreen();
		} else if (id === 'fullscreen-presentation' && this._map.getDocType() === 'presentation') {
			this._map.fire('fullscreen');
		} else if (id === 'presentation-currentslide' && this._map.getDocType() === 'presentation') {
			this._map.fire('fullscreen', {startSlideNumber: this._map.getCurrentPartNumber()});
		} else if (id === 'insertpage') {
			this._map.insertPage();
		} else if (id === 'insertshape') {
			this._openInsertShapesWizard();
		} else if (id === 'duplicatepage') {
			this._map.duplicatePage();
		} else if (id === 'deletepage') {
			var map = this._map;
			vex.dialog.open({
				message: _('Are you sure you want to delete this slide?'),
				buttons: [
					$.extend({}, vex.dialog.buttons.YES, { text: _('OK') }),
					$.extend({}, vex.dialog.buttons.NO, { text: _('Cancel') })
				],
				callback: function(e) {
					if (e === true) {
						map.deletePage();
					}
				}
			});
		} else if (id === 'about') {
			this._map.showLOAboutDialog();
		} else if (id === 'latestupdates' && this._map.welcome) {
			this._map.welcome.showWelcomeDialog();
		} else if (id === 'feedback' && this._map.feedback) {
			this._map.feedback.showFeedbackDialog();
		} else if (id === 'report-an-issue') {
			window.open('https://github.com/OSSII/oxool-community/issues', '_blank');
		} else if (id === 'inserthyperlink') {
			this._map.showHyperlinkDialog();
		} else if (L.Params.revHistoryEnabled && (id === 'rev-history' || id === 'Rev-History' || id === 'last-mod')) {
			this._map.openRevisionHistory();
		} else if (id === 'closedocument') {
			window.onClose();
		} else if (id === 'repair') {
			app.socket.sendMessage('commandvalues command=.uno:DocumentRepair');
		} else if (id === 'searchdialog') {
			if (this._map.isReadOnlyMode()) {
				$('#toolbar-down').hide();
				$('#toolbar-search').show();
				$('#mobile-edit-button').hide();
				L.DomUtil.get('search-input').focus();
			} else {
				this._map.sendUnoCommand('.uno:SearchDialog');
			}
		} else if (id === 'inserttextbox') {
			this._map.sendUnoCommand('.uno:Text?CreateDirectly:bool=true');
		} else if (id === 'insertslidefield') {
			this._map.sendUnoCommand('.uno:InsertPageField');
		} else if (id === 'insertslidetitlefield') {
			this._map.sendUnoCommand('.uno:InsertPageTitleField');
		} else if (id === 'insertslidesfield') {
			this._map.sendUnoCommand('.uno:InsertPagesField');
		} else if (id === 'pagesetup') {
			this._map.sendUnoCommand('.uno:SidebarShow');
			this._map.sendUnoCommand('.uno:LOKSidebarWriterPage');
			this._map.fire('showwizardsidebar', {noRefresh: true});
			window.pageMobileWizard = true;
		} else {
			window.app.console.debug('Warning! "%s" no action.', id);
		}
		// Inform the host if asked
		if (postmessage)
			this._map.fire('postMessage', {msgId: 'Clicked_Button', args: {Id: id} });
	},

	_onItemSelected: function(e, item) {
		var mgr = item.mgr;
		var itemId = '';
		if (mgr) {
			mgr.execute();
			itemId = mgr.getId();
		} else {
			itemId = $(item).data('id');
			window.app.console.debug('Warning! item manager object not found.', item);
		}

		if (!window.mode.isMobile() && !(itemId === '.uno:InsertAnnotation' || itemId === 'insertcomment') && this && this._map) {
			this._map.focus();
		}
	},

	/**
	 * 檢查選項是否可以顯示在選單中
	 * @param {object} menuItem
	 * @returns {boolean} true:yes, false:no
	 */
	_checkItemVisibility: function(menuItem) {
		// 禁用不在系統白名單的指令
		if (menuItem.id && !this._map.isAllowedCommand(menuItem.id)) {
			return false;
		}

		// iOS 裝置禁用
		if (window.ThisIsTheiOSApp && menuItem.iosapp === false) {
			return false;
		}
		// 平板裝置禁用
		if (menuItem.tablet === false && window.mode.isTablet()) {
			return false;
		}
		// 被隱藏
		if (menuItem.hide === true || menuItem.hidden === true) {
			return false;
		}
		/* if (menuItem.id === 'about' && (L.DomUtil.get('about-dialog') === null)) {
			return false;
		} */
		/* if (menuItem.id === 'signdocument' && (L.DomUtil.get('document-signing-bar') === null)) {
			return false;
		} */
		// TODO: 若 OxOOL 專屬 preview/readonly 模式完成後，該段程式碼可廢棄不用
		// (包含 this.options.allowedReadonlyMenus)
		// 唯讀模式且該選項是子選單
		if (this._map.isReadOnlyMode() && menuItem.type === 'menu') {
			var found = false;
			for (var j in this.options.allowedReadonlyMenus) {
				if (this.options.allowedReadonlyMenus[j] === menuItem.id) {
					found = true;
					break;
				}
			}
			if (!found)
				return false;
		}
		if (this._map.isReadOnlyMode()) {
			switch (menuItem.id) {
			case 'last-mod':
			case 'save':
			case 'runmacro':
			case 'pagesetup':
			case 'watermark':
				return false;
			case 'insertcomment':
			case 'savecomments':
				if (!this._map.isPermissionEditForComments()) {
					return false;
				}
			}
		}

		if (this._map.isEditMode()) {
			switch (menuItem.id) {
			case 'savecomments':
				return false;
			}
		}

		/* if (menuItem.id === 'runmacro' && window.enableMacrosExecution === 'false')
			return false; */

		/* if (menuItem.type === 'action') {
			if (((menuItem.id === 'rev-history' || menuItem.id === 'Rev-History') && !L.Params.revHistoryEnabled) ||
				(menuItem.id === 'closedocument' && !L.Params.closeButtonEnabled) ||
				(menuItem.id === 'latestupdates' && !window.enableWelcomeMessage)) {
				return false;
			}
		} */

		/* if (menuItem.id === '.uno:Print' && this._map['wopi'].HidePrintOption)
			return false; */

		/* if (menuItem.id === '.uno:Save' && this._map['wopi'].HideSaveOption)
			return false; */

		/* if (menuItem.id === '.uno:SaveAs' && this._map['wopi'].UserCanNotWriteRelative)
			return false; */

		/* if ((menuItem.id === 'shareas' || menuItem.id === 'ShareAs') && !this._map['wopi'].EnableShare)
			return false; */

		/* if (menuItem.id === 'insertgraphicremote' && !this._map['wopi'].EnableInsertRemoteImage)
			return false; */

		/* if (menuItem.id && menuItem.id.startsWith('fullscreen-presentation') && this._map['wopi'].HideExportOption)
			return false; */

		/* if (menuItem.id === 'changesmenu' && this._map['wopi'].HideChangeTrackingControls)
			return false; */

		// Keep track of all 'downloadas-' options and register them as
		// export formats with docLayer which can then be publicly accessed unlike
		// this Menubar control for which there doesn't seem to be any easy way
		// to get access to.
		/* if (menuItem.id && menuItem.id.startsWith('downloadas-')) {
			var format = menuItem.id.substring('downloadas-'.length);
			this._map._docLayer.registerExportFormat(menuItem.name, format);

			if (this._map['wopi'].HideExportOption)
				return false;
		} */

		if (this._hiddenItems &&
		    $.inArray(menuItem.id, this._hiddenItems) !== -1)
			return false;

		return true;
	},

	/**
	 * 把處理選項的方法，全部封裝在一起
	 * @param {object} item - 選單物件
	 * @returns
	 */
	_createItemManager: function(item) {
		var manager = {
			_self: this,
			_map: this._map,
			_data: item, // 完整紀錄 item
			_liItem: null, /*L.DomUtil.create('li', ''), // 建立 li element*/
			_aItem: null,
			_executeReadonly: false, // 預設唯讀模式不能執行

			initialize: function() {
				var self = this._self;
				var tagName = 'a';
				var className = '';
				var tabIndex = 0;
				var role = 'menuitem';

				// 建立 <li> Html element
				this._liItem = L.DomUtil.create('li',
					(this._map.isReadOnlyMode() ? 'readonly' : ''));
				// 賦予 <li> mgr 物件，指向自己
				this._liItem.mgr = this;

				// 選項被禁用
				if (this.data('disabled') === true) {
					className += 'disabled';
				}

				// 分隔線和一般選項不一樣
				if (this.isSeparator()) {
					tagName = 'i'; // html tag
					className += (className.length > 0 ? ' ' : '') + 'separator';
					tabIndex = -1;
					role = 'menuseparator';
				}

				this._liItem.setAttribute('role', role);

				this._aItem = L.DomUtil.create(tagName, className, this._liItem);
				// 賦予 aItem mgr 屬性，指向自己
				this._aItem.mgr = this;
				this._aItem.tabIndex = tabIndex;

				var id = this.getId();
				if (id !== undefined) {
					this._liItem.id = 'menu-' + id; // 指定 dom id
					// 若開啟 debug 模式，則加上 title
					if (window.protocolDebug === true) {
						this._liItem.title = id;
					}
					// id 沒有 ':' 字元，表示一般 action
					// 須檢查該 action 是否能在 readonly 被執行
					if (id.indexOf(':') < 0) {
						if (id === 'insertcomment' && this._map.getDocType() !== 'drawing') {
							this._executeReadonly = true;
						} else {
							this._executeReadonly = (self.options.allowedViewModeActions.indexOf(id) >= 0);
						}
					}

					// 選項圖示
					var iconItem = L.DomUtil.create('i', 'menuicon img-icon');
					var iconURL = 'url("' + this._map.getIconURL(
						this._data.icon ? this._data.icon : (this._map.isUnoCommand(this._data.name) ? this._data.name : id)
					) + '")';
					iconItem.style.backgroundImage = iconURL;
					this._aItem.appendChild(iconItem);

					// 建立選項名稱專用 node，並指定 class name 為 item-text
					L.DomUtil.create('span', 'item-text', this._aItem);
					this.setDefaultText(); // 設定選項名稱

					// 選項 hot key(只有桌面版才需要)
					if (this.hasHotkey() && window.mode.isDesktop()) {
						// 計算hotkey寬度
						var keys = this._data.hotkey.split('+');
						var paddingRight = (this._data.hotkey.length * 5) + (keys.length * 5) + 32;
						this._aItem.style.paddingRight = paddingRight + 'px';
						this._aItem.appendChild(this._map.createItemHotkey(this._data.hotkey));
					}

					// 如果該選項是動態選單的話，先建立一個空陣列
					if (this._self.options.dynamicMenu[id] !== undefined) {
						this._data.menu = [];
					}
				}
				return this;
			},
			getLiItem: function() {
				return this._liItem;
			},
			getItem: function() {
				return this._aItem;
			},
			getId: function() {
				return (this._data.id ? this._data.id : undefined);
			},
			/**
			 * 取得或設定 item 的值
			 *
			 * @param {string} varName
			 * @param {any} value
			 * @returns 最後變更前的值
			 *
			 * @example:
			 *	// 取值
			 *	var postmessage = liItem.mgr.data('postmessage');
			 *
			 *  // 設定值
			 * 	liItem.mgr.data('postmessage', true);
			 */
			data: function(varName, value) {
				var recentValue = this._data[varName];
				if (value !== undefined) {
					this._data[varName] = value;
				}
				return recentValue;
			},
			getType: function() {
				if (this.getId() !== undefined)
					return 'menuitem';

				if (this.isSeparator())
					return 'separator';

				return '';
			},
			/**
			 * 該選項是否有子選單
			 * @returns {boolean} true: 是, false:否
			 */
			hasMenu: function() {
				return (this._data.menu && Array.isArray(this._data.menu));
			},
			hasHotkey: function() {
				return (this._data.hotkey !== undefined);
			},
			/** 該選項是否為分隔線 */
			isSeparator: function() {
				return (this._data.type === '--' ||
						this._data.type === 'separator' ||
						Object.keys(this._data).length === 0);
			},
			/**
			 * 選項是否禁用
			 * @returns {boolean} true: 是, false: 否
			 */
			isDisabled: function() {
				return L.DomUtil.hasClass(this.getItem(), 'disabled');
			},
			/**
			 * 是否動態產生的選項
			 * @returns true: 是, false: 否
			 */
			isDynamicItem: function() {
				return this._data.dynamic === true;
			},
			/**
			 * 設定選項預設名稱
			 */
			setDefaultText: function() {
				var docType = this._map.getDocType();
				if (docType === 'drawing') {
					docType = 'presentation';
				}
				// 若同時指定 name 和 id，則選項名稱以 name 為準
				var text = (this._data.name ? this._data.name : this._data.id);
				// 若選項名稱是 uno 指令，則以 _UNO() 翻譯，否則以 _() 翻譯
				this.setText(this._map.isUnoCommand(text) ? _UNO(text, docType, true) : _(text));
			},
			/**
			 * 設定選項為指定名稱
			 * @param {string} text - 選項名稱
			 */
			setText: function(text) {
				// 找第一個 class name 是 item-text 的 node
				var textNode = this._aItem.querySelector('.item-text');
				if (textNode) {
					textNode.textContent = text; // 改變文字內容
				}
			},
			setDisabled: function(isDisabled) {
				var constDisabled = 'disabled';
				var aItem = this.getItem();

				if (isDisabled) {
					// 原先沒有 disabled
					if (!L.DomUtil.hasClass(aItem, constDisabled)) {
						// 編輯模式，不要關閉貼上指令
						if (this._data.id === '.uno:Paste' && this._map.isEditMode()) {
							window.app.console.debug('Do not disable paste based on server side data.');
						} else {
							L.DomUtil.addClass(aItem, constDisabled);
						}
					}
				} else {
					L.DomUtil.removeClass(aItem, constDisabled);
				}
			},
			setChecked: function(isChecked) {
				var constCheckedClass = 'lo-menu-item-checked';
				var aItem = this.getItem();

				if (isChecked) {
					if (!L.DomUtil.hasClass(aItem, constCheckedClass)) {
						L.DomUtil.addClass(aItem, constCheckedClass);
					}
				} else {
					L.DomUtil.removeClass(aItem, constCheckedClass);
				}
			},
			updateState: function() {
				var self = this._self;
				var id = this.getId();
				// 沒有 ID 或是動態產生的選項就不處理
				if (id === undefined || this.isDynamicItem()) {
					return;
				}
				// 如果有名稱，且名稱是 .uno: 開頭，就以名稱作為命令查詢
				// 否則以 id 作為命令查詢，不管 id 是否有 .uno: 開頭
				var command = this._map.isUnoCommand(this._data.name) ? this._data.name : id;
				var state = self._map['stateChangeHandler'].getItemProperty(command);
				if (this._map.isEditMode()) {
					this.setDisabled(state.disabled()); // 是否禁用
					this.setChecked(state.checked()); // 是否勾選

					// 該選項是否有動態選單
					if (self.options.dynamicMenu[command] !== undefined) {
						// 建立該選項的子選單
						self._createDynamicMenu(command, this._liItem);
					}

					if (id === 'showresolved') {
						var section = app.sectionContainer.getSectionWithName(L.CSections.CommentList.name);
						if (section) {
							if (section.sectionProperties.commentList.length === 0) {
								this.setDisabled(true);
							} else if (section.sectionProperties.showResolved) {
								this.setDisabled(false);
								this.setChecked(true);
							} else {
								this.setDisabled(false);
								this.setChecked(false);
							}
						}
					} else if (id === 'fullscreen') {
						this.setChecked(self._map.uiManager.isFullscreen());
					}
				} else {
					this.setDisabled(!this._executeReadonly);
					this.setChecked(state.checked()); // 是否勾選
				}
			},
			/**
			 * 執行該選項功能
			 */
			execute: function() {
				var self = this._self;
				var id = this._data.id;
				if (id) {
					var state = self._map['stateChangeHandler'].getItemValue(id);
					if (id.startsWith('.uno:SlideMasterPage')) {
						// Toggle between showing master page and closing it.
						id = (state === 'true' ? '.uno:CloseMasterView' : '.uno:SlideMasterPage');
					} else if (self._map._clip && self._map._clip.filterExecCopyPaste(id)) {
						return;
					}

					if (id.startsWith('.uno:Sidebar') || id.startsWith('.uno:SlideMasterPage') ||
						id.startsWith('.uno:ModifyPage') || id.startsWith('.uno:SlideChangeWindow') ||
						id.startsWith('.uno:CustomAnimation') || id.startsWith('.uno:MasterSlidesPanel')) {
						window.initSidebarState = true;
					}

					if (!self._map.executeAllowedCommand(id)) {
						// self._executeAction(undefined, {id: id});
						console.debug('Error! can not execute action: ' + id);
					}
				}
			},
		};

		return manager.initialize(); // 初始化選項
	},

	/**
	 * 建立選項
	 * @param {object} item - 選項物件
	 * @returns DOMElement
	 */
	_createItem: function(item) {
		var manager = this._createItemManager(item);
		var liItem = manager.getLiItem();

		switch (manager.getType()) {
		case 'menuitem': // 選項
			if (manager.hasMenu()) {
				// 遞迴呼叫自己
				var subMenu = this._createMenu(item.menu);
				// 建立子選單結構
				var ulItem = L.DomUtil.create('ul', '', liItem);
				// 加入子選單
				subMenu.forEach(function (item) {
					ulItem.appendChild(item);
				});
			}
			break;
		case 'separator':
			// do nothing.
			break;
		default:
			window.app.console.debug('Warning! Unknown menu option :', item);
			break;
		}

		return liItem;
	},

	/**
	 * 利用 json 資料，建立 html 結構的選單
	 */
	 _createMenu: function(menu) {
		var itemList = []; // 每個 item 的 html element
		var isLastItemText = false;

		// 依序處理每個選項
		menu.forEach(function(item) {
			// 忽略被隱藏的選項
			if (this._checkItemVisibility(item) === false) {
				return;
			}

			var liItem = this._createItem(item);
			if (!liItem) {
				return;
			}

			if (liItem.mgr.isSeparator()) {
				// 前一個是文字選項
				if (isLastItemText) {
					isLastItemText = false;
				// 不需要連續兩個分隔線
				} else {
					return;
				}
			} else {
				isLastItemText = true;
			}

			// 第一項不能是分隔線
			if (itemList.length === 0 && !isLastItemText) {
				return;
			} else {
				itemList.push(liItem);
			}
		}.bind(this));

		// 檢查最後一個選項，是否是分隔線
		if (itemList.length) {
			// 從列表移除
			if (itemList[itemList.length - 1].mgr.isSeparator()) {
				itemList.pop();
			}
		}
		return itemList;
	},

	_getItems: function() {
		return $(this._menubarCont).children().children('ul').children('li').add($(this._menubarCont).children('li'));
	},

	_getItem: function(targetId) {
		var items = this._getItems();
		var found = $(items).filter(function() {
			var item = this;
			var id = $(item).attr('id');
			if (id && id == 'menu-' + targetId) {
				return true;
			}
			return false;
		});
		return found.length ? found : null;
	},

	hasItem: function(targetId) {
		return this._getItem(targetId) != null;
	},

	hideItem: function(targetId) {
		var item = this._getItem(targetId);
		if (item) {
			if ($.inArray(targetId, this._hiddenItems) == -1)
				this._hiddenItems.push(targetId);
			$(item).css('display', 'none');
		}
	},

	showItem: function(targetId) {
		var item = this._getItem(targetId);
		if (item) {
			if ($.inArray(targetId, this._hiddenItems) !== -1)
				this._hiddenItems.splice(this._hiddenItems.indexOf(targetId), 1);
			$(item).css('display', '');
		}
	},

	generateFullMenuStructure: function() {
		var topMenu = {
			type : 'menubar',
			enabled : true,
			id : 'menubar',
			children : []
		};
		var docType = this._map.getDocType();
		var items = this.options['mobile' + docType];

		for (var i = 0; i < items.length; i++) {
			if (this._checkItemVisibility(items[i]) === true) {
				var item = this._generateMenuStructure(items[i], docType, false);
				if (item)
					topMenu.children.push(item);
			}
		}
		return topMenu;
	},

	generateInsertMenuStructure: function() {
		var docType = this._map.getDocType();
		var target = this.options['mobileInsertMenu'][docType];

		var menuStructure = this._generateMenuStructure(target, docType, true);
		return menuStructure;
	},

	_generateMenuStructure: function(item, docType, mainMenu) {
		var itemType;
		if (mainMenu) {
			itemType = 'mainmenu';
		} else {
			if (item.mobileapp == true && !window.ThisIsAMobileApp)
				return undefined;
			if (item.mobileapp === false && window.ThisIsAMobileApp)
				return undefined;
			if (!item.menu) {
				itemType = 'menuitem';
			} else {
				itemType = 'submenu';
			}
		}

		if (item.id === 'feedback' && !this._map.feedback)
			return undefined;

		// 處理選項名稱
		var itemName;
		// 有指定選項名稱
		if (item.name) {
			// 選項名稱若是 uno 指令，就翻譯，否則不變
			itemName = this._map.isUnoCommand(item.name) ? _UNO(item.name, docType) : item.name;
		// 若 id 是 uno 指令，翻譯 id
		} else if (this._map.isUnoCommand(item.id)) {
			itemName = _UNO(item.id, docType);
		} else {
			return undefined; // separator
		}

		var menuStructure = {
			id : item.id,
			type : itemType,
			enabled : !item.disabled,
			text : itemName,
			data : item,
			children : []
		};

		if (item.icon) {
			menuStructure.icon = item.icon;
		} else if (this._map.isUnoCommand(item.name)) {
			menuStructure.icon = item.name;
		}

		// Checked state for insert header / footer
		var insertHeaderString = '.uno:InsertPageHeader?PageStyle:string=';
		var insertFooterString = '.uno:InsertPageFooter?PageStyle:string=';
		if (item.id && (item.id.startsWith(insertHeaderString) || item.id.startsWith(insertFooterString))) {
			var style = decodeURIComponent(item.id.slice(item.id.search('=') + 1));
			style = style.slice(0, style.length - 1);
			var shortUno = item.id.slice(0, item.id.search('\\?'));
			var state = this._map['stateChangeHandler'].getItemValue(shortUno);
			if (state && state[style]) {
				menuStructure['checked'] = true;
			}
		} else if (item.id === '.uno:TrackChanges' ||
			item.id === '.uno:ShowTrackedChanges' ||
			item.id === '.uno:ControlCodes' ||
			item.id === '.uno:SpellOnline' ||
			item.id === '.uno:ShowResolvedAnnotations') {
			if (this._map['stateChangeHandler'].getItemValue(item.id) === 'true') {
				menuStructure['checked'] = true;
			}
		}

		if (item.menu)
		{
			for (var i = 0; i < item.menu.length; i++) {
				if (this._checkItemVisibility(item.menu[i]) === true) {
					var element = this._generateMenuStructure(item.menu[i], docType, false);
					if (element)
						menuStructure['children'].push(element);
				}
			}
		}
		return menuStructure;
	},

	_findSubMenuByName: function(menuTarget, nameString) {
		if (menuTarget.name === nameString)
			return menuTarget;

		if (menuTarget.menu)
		{
			for (var i = 0; i < menuTarget.menu.length; i++) {
				var foundItem = this._findSubMenuByName(menuTarget.menu[i], nameString);
				if (foundItem)
					return foundItem;
			}
		}
		return null;
	},
});

L.control.menubar = function (options) {
	return new L.Control.Menubar(options);
};
