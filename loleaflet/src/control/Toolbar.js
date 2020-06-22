/* -*- js-indent-level: 8 -*- */
/*
 * Toolbar handler
 */

/* global $ vex brandProductName _ _UNO _UNOTARGET*/
L.Map.include({

	// a mapping of uno commands to more readable toolbar items
	unoToolbarCommands: [
		'.uno:StyleApply',
		'.uno:CharFontName'
	],

	_modalDialogOptions: {
		overlayClose:true,
		opacity: 80,
		overlayCss: {
			backgroundColor : '#000'
		},
		containerCss: {
			overflow : 'hidden',
			backgroundColor : '#fff',
			padding : '20px',
			border : '2px solid #000'
		}
	},

	_allowCommands: {},

	_hotkeyCommands: {},

	// 右鍵選單會出現 _allowCommands 沒有的指令，暫時作法是列入未知名單中，且標記是否可用
	_whiteCommandList: {
		'.uno:Crop': false, // 裁剪
		'.uno:ExternalEdit': false, // 開啟外部編輯器
		'.uno:ChangePicture': false, // 變更圖片
		'.uno:SaveGraphic': false, // 儲存圖片
		'.uno:ToggleObjectBezierMode': false, // 接點
		'.uno:ToggleObjectRotateMode': false, // 旋轉
		'.uno:AddTextBox': false, // 在圖案中加入文字方塊
		'.uno:RemoveTextBox': false, // 移除在圖案中的文字方塊
		'.uno:ObjectAlignLeft': true,
		'.uno:AlignCenter': true,
		'.uno:ObjectAlignRight': true,
		'.uno:AlignUp': true,
		'.uno:AlignMiddle': true,
		'.uno:AlignDown': true,
		'.uno:OutlineBullet': true,
		'.uno:RemoveBullets': true,
		'.uno:FrameDialog': true,
		'.uno:ObjectMenue?VerbID:short=-1': false,
		'.uno:EditHyperlink': true, // 超連結
		'.uno:OpenHyperlinkOnCursor': true, // 開啟超連結
		'.uno:CopyHyperlinkLocation': true, // 複製超連結位址
		'.uno:RemoveHyperlink': true, // 移除超連結
		'.uno:CurrentFootnoteDialog': true,
		'.uno:SetAnchorToPage': true,
		'.uno:SetAnchorToPara': true,
		'.uno:SetAnchorAtChar': true,
		'.uno:SetAnchorToChar': true,
		'.uno:WrapOff': true,
		'.uno:WrapOn': true,
		'.uno:WrapLeft': true,
		'.uno:WrapRight': true,
		'.uno:WrapThrough': true,
		'.uno:WrapThroughTransparencyToggle': true,
		'.uno:WrapContour': true,
		'.uno:WrapAnchorOnly': true,
		'.uno:WrapIdeal': true, // 最佳頁面環繞
		'.uno:TextWrap': true, // 編輯...
		'.uno:BringToFront': true, // 移動到最上層
		'.uno:ObjectForwardOne': true, // 上移一層
		'.uno:Forward': true, // 上移一層
		'.uno:ObjectBackOne': true, // 下移一層
		'.uno:Backward': true, // 下移一層
		'.uno:SendToBack': true, // 移動到最下層
		'.uno:BeforeObject': true, // 物件之前
		'.uno:BehindObject': true, // 物件之後
		'.uno:SetObjectToBackground': true, // 移到背景
		'.uno:SetObjectToForeground': true, // 移到前景
		'.uno:RotateRight': true, // 向右旋轉 90°
		'.uno:RotateLeft': true, // 向左旋轉 90°
		'.uno:Rotate180': true, // 旋轉 180°
		'.uno:FlipVertical': true, // 垂直翻轉
		'.uno:FlipHorizontal': true, // 水平翻轉
		'.uno:DefaultCharStyle': true, // 預設字元
		'.uno:EmphasisCharStyle': true, // 強調
		'.uno:StrongEmphasisCharStyle': true, // 特別強調
		'.uno:QuoteCharStyle': true, // 引文
		'.uno:SourceCharStyle': true, // 源碼文字
		'.uno:TextBodyParaStyle': true, // 內文
		'.uno:Heading1ParaStyle': true, // 標題 1
		'.uno:Heading2ParaStyle': true, // 標題 2
		'.uno:Heading3ParaStyle': true, // 標題 3
		'.uno:PreformattedParaStyle': true, // 已先格式設定文字
		'.uno:BulletListStyle': true, // 項目符號清單
		'.uno:NumberListStyle': true, // 數字清單
		'.uno:AlphaListStyle': true, // 大寫英文字母清單
		'.uno:AlphaLowListStyle': true, // 小寫英文字母清單
		'.uno:RomanListStyle': true, // 大寫羅馬數字清單
		'.uno:RomanLowListStyle': true, // 小寫羅馬數字清單
		'.uno:PasteUnformatted': true, // 貼上無格式設定的文字
		'.uno:SetOptimalRowHeight': true, // 最適列高
		'.uno:DistributeRows': true, // 平均分配列高
		'.uno:DistributeColumns': true, // 平均分配欄寬
		'.uno:HeadingRowsRepeat': true, // 跨頁重複標題列
		'.uno:RowSplit': true, // 列可跨頁中斷
		'.uno:MergeCells': true, // 合併儲存格
		'.uno:OriginalSize': true, // 原始大小
		'.uno:FitCellSize': true, // 符合儲存格大小
		'.uno:SetAnchorToCell': true, // 至儲存格
		'.uno:SetAnchorToCellResize': true, // 至儲存格 (隨儲存格調整大小)
		'.uno:SetDefault': true, // 清除所有格式設定
		'.uno:EditCurrentRegion': true, // 編輯區段...
		'.uno:EditShapeHyperlink': true, // 編輯超連結
		'.uno:DeleteShapeHyperlink': true, // 移除超連結
	},

	// Add by Firefly <firefly@ossii.com.tw>
	_iconAlias: {
		'addprintarea': 'inserttable',
		'addtextbox': 'insertfixedtext',
		'anchormenu': 'toggleanchortype',
		'arrangeframemenu': 'bringtofront',
		'arrangemenu': 'bringtofront',
		'autoformatmenu': 'autocorrectdlg',
		'basicshapes.ellipse': 'ellipse',
		'basicshapes': 'basicshapes.diamond',
		'basicshapes.rectangle': 'rect',
		'ellipsetoolbox': 'ellipse',
		'linetoolbox': 'freeline_unfilled',
		'rectangletoolbox': 'rect',
		'basicshapes.round-rectangle': 'rect_rounded',
		'basicshapes.parallelogram': 'flowchartshapes.flowchart-data',
		'basicshapes.quadrat': 'square',
		'basicshapes.circle': 'circle',
		'basicshapes.circle-pie': 'pie',
		'basicshapes.frame': 'rect_unfilled',
		'symbolshapes.smiley': 'symbolshapes',
		'arrowshapes.left-right-arrow': 'arrowshapes',
		'calloutshapes.round-rectangular-callout': 'calloutshapes',
		'flowchartshapes.flowchart-process': 'square',
		'flowchartshapes.flowchart-alternate-process': 'basicshapes.round-quadrat',
		'flowchartshapes.flowchart-manual-operation': 'basicshapes.trapezoid',
		'flowchartshapes.flowchart-connector': 'circle',
		'flowchartshapes.flowchart-extract': 'basicshapes.isosceles-triangle',
		'flowchartshapes.flowchart-merge': 'fontworkshapetype.fontwork-triangle-down',
		'flowchartshapes.flowchart-magnetic-disk': 'basicshapes.can',
		'bulletliststyle': 'defaultbullet',
		'changesmenu': 'trackchanges',
		'charactermenu': 'fontdialog',
		'centerpara': 'alignhorizontalcenter',
		'cellverttop': 'aligntop',
		'cellvertcenter': 'alignverticalcenter',
		'cellvertbottom': 'alignbottom',
		'commonalignleft': 'alignleft',
		'commonalignhorizontalcenter': 'alignhorizontalcenter',
		'commonalignright': 'alignright',
		'commonalignjustified': 'alignblock',
		'commonaligntop': 'aligntop',
		'commonalignverticalcenter' : 'alignverticalcenter',
		'commonalignbottom': 'alignbottom',
		'convertmenu': 'bezierconvert',
		'convertinto3dlathefast': 'convertinto3dlathe',
		'datapilotmenu': 'datadatapilotrun',
		'defaultcellstyles': 'defaultcharstyle',
		'deleteallnotes': 'deleteallannotation',
		'deletecell': 'delete',
		'deletenote': 'deleteannotation',
		'deleteprintarea': 'delete',
		'deleteslide': 'deletepage',
		'duplicateslide': 'duplicatepage',
		'drawtext': 'text',
		'editprintarea': 'editdoc',
		'editshapehyperlink': 'edithyperlink',
		'deleteshapehyperlink': 'removehyperlink',
		'openhyperlinkoncursor': 'inserthyperlink',
		'fieldnames': 'addfield',
		'flipmenu': 'mirror',
		'fliphorizontal': 'mirror',
		'flipvertical': 'mirrorvert',
		'footnotecellstyles': 'insertfootnote',
		'formatarea': 'backgroundcolor',
		'formatbulletsmenu': 'defaultbullet',
		'formatimagemenu': 'graphicdialog',
		'formatobjectmenu': 'text',
		'formatspacingmenu': 'spacepara15',
		'formatstylesmenu': 'colorscaleformatdialog',
		'functiondialog': 'dbviewfunctions',
		'conditionalformatmenu': 'colorscaleformatdialog',
		'formattextmenu': 'fontdialog',
		'gridmenu': 'gridvisible',
		'groupmenu': 'group',
		'heading1cellstyles': 'heading1parastyle',
		'heading2cellstyles': 'heading2parastyle',
		'hyperlinkdialog': 'inserthyperlink',
		'indexesmenu': 'insertindexesentry',
		'insert': 'insertspreadsheet',
		'insertannotation': 'shownote',
		'insertauthorfield': 'dbviewaliases',
		'insertcurrentdate': 'datefield',
		'insertcurrenttime': 'timefield',
		'insertfootnotemenu': 'insertfootnote',
		'insertrowbreak': 'insertpagebreak',
		'insertcell': 'insertcellsright',
		'insertcolumnsmenu': 'insertcolumns',
		'insertdatefield' : 'datefield',
		'insertdatefieldfix': 'datefield',
		'insertdatefieldvar': 'datefield',
		'insertfield': 'addfield',
		'insertheaderfootermenu': 'editheaderandfooter',
		'insertobjectchart': 'drawchart',
		'insertslide': 'insertpage',
		'insertslidefield': 'insertpagenumberfield',
		'insertslidesfield': 'insertpagecountfield',
		'insertslidetitlefield': 'inserttitlefield',
		'insertrowsmenu': 'insertrows',
		'insertframemenu': 'insertframe',
		'inserttimefield' : 'timefield',
		'inserttimefieldfix': 'timefield',
		'inserttimefieldvar': 'timefield',
		'justifypara': 'alignblock',
		'languagemenu': 'managelanguage',
		'leftpara': 'alignleft',
		'mirrorhorz': 'mirror',
		'mirrormenu': 'rotateleft',
		'movepagedown': 'downsearch',
		'movepageup': 'upsearch',
		'moveslidefirst': 'movepagefirst',
		'moveslidelast': 'movepagelast',
		'moveslideup': 'upsearch',
		'moveslidedown': 'downsearch',
		'firstslide': 'firstpage',
		'lastslide': 'lastrecord',
		'previousslide': 'prevrecord',
		'nextslide': 'nextrecord',
		'namegroup': 'definename',
		'notecellstyles': 'showannotations',
		'numberformatcurrency': 'currencyfield',
		'numberformattime': 'timefield',
		'numberingmenu': 'outlinebullet',
		'numberliststyle': 'defaultnumbering',
		'objectalign': 'objectalignleft',
		'objectmirrorhorizontal': 'mirror',
		'objectmirrorvertical': 'mirrorvert',
		'objecttitledescription': 'insertcaptiondialog',
		'outlineup': 'moveup',
		'outlinedown': 'movedown',
		'outlineright': 'decrementlevel',
		'outlineleft': 'decrementindent',
		'pageformatdialog': 'pagedialog',
		'paragraphmenu': 'paragraphdialog',
		'pastespecialmenu': 'pastespecial',
		'previoustrackedchange': 'prevrecord',
		'nexttrackedchange': 'nextrecord',
		'repaginate': 'insertpagenumberfield',
		'recalcpivottable': 'calculate',
		'rightpara': 'alignright',
		'rotateflipmenu': 'rotateleft',
		'savegraphic': 'save',
		'setdefault': 'resetattributes',
		'setobjecttoforeground': 'bringtofront',
		'setobjecttobackground': 'sendtoback',
		'shapeslinemenu': 'line',
		'shapesmenu': 'insertdraw',
		'showgraphics': 'graphic',
		'showruler': 'ruler',
		'showtrackedchanges': 'addwatch',
		'slidesetup': 'pagesetup',
		'spelldialog': 'spelling',
		'spellingandgrammardialog': 'spelling',
		'tableautofitmenu': 'setoptimalrowheight',
		'tableinsertmenu': 'insertrowsafter',
		'tabledeletemenu': 'deletetable',
		'tableselectmenu': 'selecttable',
		'textalign': 'alignblock',
		'textattributes': 'fontdialog',
		'updateall': 'reload',
		'updateallindexes': 'insertmultiindex',
		'updatealllinks': 'inserthyperlink',
		'updatecharts': 'drawchart',
		'updatecurindex': 'insertindexesentry',
		'updatefields': 'addfield',
		'updatemenu': 'reload',
		'wrapmenu': 'wrapon',
		'zoomminus': 'zoomout',
		'zoomplus': 'zoomin',
	},
	//-----------------------------------------------------------------

	applyFont: function (fontName) {
		if (this.getPermission() === 'edit') {
			var msg = 'uno .uno:CharFontName {' +
				'"CharFontName.FamilyName": ' +
					'{"type": "string", "value": "' + fontName + '"}}';
			this._socket.sendMessage(msg);
		}
	},

	applyFontSize: function (fontSize) {
		if (this.getPermission() === 'edit') {
			var msg = 'uno .uno:FontHeight {' +
				'"FontHeight.Height": ' +
				'{"type": "float", "value": "' + fontSize + '"}}';
			this._socket.sendMessage(msg);
		}
	},

	getToolbarCommandValues: function (command) {
		if (this._docLayer) {
			return this._docLayer._toolbarCommandValues[command];
		}

		return undefined;
	},

	downloadAs: function (name, format, options, id) {
		if (this._fatal) {
			return;
		}

		id = id || 'export'; // not any special download, simple export

		if ((id === 'print' && this['wopi'].DisablePrint) ||
		    (id === 'export' && this['wopi'].DisableExport)) {
			this.hideBusy();
			return;
		}

		if (format === undefined || format === null) {
			format = '';
		}
		if (options === undefined || options === null) {
			options = '';
		}

		// 如果是下載或列印 pdf，而且 server 也沒有指定浮水印的話
		// 就詢問使用者是否加浮水印
		if (format === 'pdf' && this.options.watermark === undefined) {
			this.fire('executeDialog', {
				dialog: 'PdfWatermarkText',
				args: {
					name: name,
					id: id,
					options: options
				}
			});
			return;
		}

		this.showBusy(_('Downloading...'), false);
		this._socket.sendMessage('downloadas ' +
			'name=' + encodeURIComponent(name) + ' ' +
			'id=' + id + ' ' +
			'format=' + format + ' ' +
			'options=' + options);
	},

	print: function () {
		if (window.ThisIsTheiOSApp) {
			window.webkit.messageHandlers.lool.postMessage('PRINT', '*');
		} else {
			this.showBusy(_('Downloading...'), false);
			this.downloadAs('print.pdf', 'pdf', null, 'print');
		}
	},

	saveAs: function (url, format, options) {
		if (url === undefined || url == null) {
			return;
		}
		if (format === undefined || format === null) {
			format = '';
		}
		if (options === undefined || options === null) {
			options = '';
		}

		this.showBusy(_('Saving...'), false);
		this._socket.sendMessage('saveas ' +
			'url=wopi:' + encodeURIComponent(url) + ' ' +
			'format=' + format + ' ' +
			'options=' + options);
	},

	renameFile: function (filename) {
		if (!filename) {
			return;
		}
		this.showBusy(_('Renaming...'), false);
		this._socket.sendMessage('renamefile filename=' + encodeURIComponent(filename));
	},

	applyStyle: function (style, familyName) {
		if (!style || !familyName) {
			this.fire('error', {cmd: 'setStyle', kind: 'incorrectparam'});
			return;
		}
		if (this._permission === 'edit') {
			var msg = 'uno .uno:StyleApply {' +
					'"Style":{"type":"string", "value": "' + style + '"},' +
					'"FamilyName":{"type":"string", "value":"' + familyName + '"}' +
					'}';
			this._socket.sendMessage(msg);
		}
	},

	applyLayout: function (layout) {
		if (!layout) {
			this.fire('error', {cmd: 'setLayout', kind: 'incorrectparam'});
			return;
		}
		if (this._permission === 'edit') {
			var msg = 'uno .uno:AssignLayout {' +
					'"WhatPage":{"type":"unsigned short", "value": "' + this.getCurrentPartNumber() + '"},' +
					'"WhatLayout":{"type":"unsigned short", "value": "' + layout + '"}' +
					'}';
			this._socket.sendMessage(msg);
		}
	},

	save: function(dontTerminateEdit, dontSaveIfUnmodified, extendedData) {
		var msg = 'save' +
					' dontTerminateEdit=' + (dontTerminateEdit ? 1 : 0) +
					' dontSaveIfUnmodified=' + (dontSaveIfUnmodified ? 1 : 0);

		if (extendedData !== undefined) {
			msg += ' extendedData=' + extendedData;
		}

		this._socket.sendMessage(msg);
	},

	sendUnoCommand: function (command, json) {
		if (this._permission === 'edit') {
			// Add by Firefly <firefly@ossii.com.tw>
			command = command.trim(); // 去掉前後空白，(不知為何，就有程序愛加空白在命令列後面 XD)
			// 是否有替代 uno?
			var targetURL = _UNOTARGET(command, this.getDocType());
			// 有的話就用替代 uno
			if (targetURL !== '') command = targetURL;
			// 有的 uno 用 URI 方式傳遞參數，所以必須 encode 確保參數傳遞正確
			if (command.startsWith('.uno:')) {
				 command = encodeURI(command);
			}
			//----------------------------------------
			this._socket.sendMessage('uno ' + command + (json ? ' ' + JSON.stringify(json) : ''));
		}
	},

	// Add by Firefly <firefly@ossii.com.tw>
	// 取得文件式樣列表
	getStyleFamilies: function() {
		return this.getToolbarCommandValues('.uno:StyleApply');
	},

	// 取得字型列表
	getFontList: function() {
		return this.getToolbarCommandValues('.uno:CharFontName');
	},

	// Add by Firefly <firefly@ossii.com.tw>
	// 依據 itemKey 設定右鍵選單 icon 圖示
	contextMenuIcon: function($itemElement, itemKey, item) {
		var hasinit = $itemElement.hasClass('_init_');
		if (hasinit) {return '';}
		$itemElement.addClass('_init_')
		// 設定 icon
		var icon = L.DomUtil.create('i', 'menuicon img-icon');
		var iconURL = 'url("' + this.getUnoCommandIcon(itemKey) + '")';
		$(icon).css('background-image', iconURL);
		$itemElement.append(icon);
		// 如果有 checktype
		if (item.checktype !== undefined && item.checked) {
			$itemElement.addClass('lo-menu-item-checked');
		}
		return '';
	},

	// Add by Firefly <firefly@ossii.com.tw>
	// 把 uno 指令轉換成 icon 圖示 URL
	getUnoCommandIcon: function(unoCommand) {
		var command = (unoCommand.startsWith('.uno:') ? unoCommand.substr(5) : unoCommand).toLowerCase();
		var icon = this._iconAlias[command] !== undefined ? this._iconAlias[command] : command;

		return 'images/cmd/' + icon + '.svg';
	},

	// Add by Firefly <firefly@ossii.com.tw>
	// 將指令加入白名單中
	// 指令為 json 物件，內如下：
	// name: .uno: 開頭的指令，或不重複的 id 名稱
	// hotkey: 若有快速鍵的話請指定，快速鍵組合依序為 Ctrl + Alt + Shift + Key 字串
	// callback: 執行該指令所需的 callback 函數
	addAllowedCommand: function(command) {
		// 有名稱才行
		var obj = {};
		if (command.name !== undefined) {
			var name = command.name.trim();
			var hotkey = command.hotkey;
			var callback = command.callback;
			var hide = command.hide;
			var isExists = (this._allowCommands[name] !== undefined); // 是否已經存在了
			// 如果存在，調出來
			if (isExists) {
				obj = this._allowCommands[name];
			}
			// 有 hotkey 的話，另外存入 hotkeys 命令列表
			if (hotkey !== undefined) {
				// 轉成小寫
				var compar = hotkey.toLowerCase();
				if (compar.length > 0) {
					obj.hotkey = hotkey;
					var keys = compar.split('+'); // 用 '+' 號切開
					var ctrl = keys.indexOf('ctrl'); // 有無 Ctrl
					var alt = keys.indexOf('alt'); // // 有無 Alt
					var shift = keys.indexOf('shift'); // 有無 shift
					var key = keys[keys.length-1]; // 取按鍵名稱
					// 依照 Ctrl+Alt+Shift+Key 順序，重新組合 hotkey
					keys = [];
					if (ctrl >= 0) keys.push('Ctrl');
					if (alt >= 0) keys.push('Alt');
					if (shift >= 0) keys.push('Shift');
					if (key.startsWith('arrow'))
						key = key.substr(5);
					keys.push(key);
					hotkey = keys.join('+').toLowerCase(); // 組合回小寫字串
					this._hotkeyCommands[hotkey] = name;
				}
			}
			// 有 callback 的話，一併紀錄
			if (typeof callback === 'function') {
				obj.callback = callback;
			}
			// 是否隱藏
			if (typeof hide === 'boolean') {
				obj.hide = hide;
			}
			this._allowCommands[name] = obj;
			// 第一次加入 且是 uno 指令的話，設定狀態自動回報
			if (!isExists && name.startsWith('.uno:'))
				this._socket.sendMessage('getunostates ' + encodeURI(name));
		}
	},

	// Add by Firefly <firefly@ossii.com.tw>
	// 查詢某指令是否為白名單
	isAllowedCommand: function(unoCommand) {
		var whiteList = this._whiteCommandList[unoCommand];
		var allowed = this._allowCommands[unoCommand];
		// 如果該指令被隱藏起來，就當作不存在白名單中
		if (allowed !== undefined && allowed.hide === true) {
			return false;
		}
		if (whiteList === undefined && allowed === undefined) {
			console.debug('Warning! ' + unoCommand + ' not in white list and allowed commands!\n', '\'' + unoCommand + '\': true, // ' + _UNO(unoCommand, this.getDocType(), true));
			return false;
		}

		return (whiteList === true || allowed !== undefined);
	},

	// Add by Firefly <firefly@ossii.com.tw>
	// 查詢字串是否為 uno 指令
	isUnoCommand: function(unoCommand) {
		return (typeof unoCommand === 'string' && unoCommand.startsWith('.uno:'));
	},

	// Add by Firefly <firefly@ossii.com.tw>
	// 依據按鍵事件，執行
	// 傳回 true 表示該按鍵是捷徑，否則傳回 false
	executeHotkey: function(e) {
		// 只處理 keydown 事件
		if (e.type !== 'keydown')
			return false;

		// 如果在 Calc 儲存格編輯狀態，就不攔截
		if (this.getDocType() === 'spreadsheet' &&
			this._docLayer._docContext === 'EditCell') {
			return false;
		}

		var event = e.originalEvent;
		var hotkey = []; // 準備要組合的按鍵易讀名稱
		var key = event.key;
		if (event.ctrlKey || event.metaKey) hotkey.push('Ctrl');
		if (event.altKey) hotkey.push('Alt');
		if (event.shiftKey) hotkey.push('Shift');
		if (key.startsWith('Arrow'))
			key = key.substr(5);
		hotkey.push(key);
		var mergeKeys = hotkey.join('+').toLowerCase();

		// 如果是 Ctrl+C、Ctrl+V、Ctrl+X 就不攔截，交給系統處理
		if (mergeKeys === 'ctrl+c' || mergeKeys === 'ctrl+v' || mergeKeys === 'ctrl+x')
			return false;

		var matchCommand = this._hotkeyCommands[mergeKeys];
		if (matchCommand !== undefined) {
			console.debug('Found Hot command->' + matchCommand);
			if (this.executeAllowedCommand(matchCommand)) {
				e.originalEvent.preventDefault();
				return true;
			}
		}
		return false;
	},

	// Add by Firefly <firefly@ossii.com.tw>
	/* 執行在白名單中的命令
	 * 參數可以是 .uno: 開頭的指令或是 menubar 定義過的 ID
	 */
	executeAllowedCommand: function(command) {
		var result = false;
		if (typeof command === 'string') {
			var commandData = this._allowCommands[command]; // 找出白名單資料
			// 白名單沒有的話，找右鍵選單的白名單
			if (commandData === undefined) {
				commandData = this._whiteCommandList[command];
			}
			var uno = false, macro = false, dialog = false, action = false, callback = false;
			// 有找到且該指令沒被隱藏
			if (commandData !== undefined && commandData.hide !== true) {
				// 指令開頭是 .uno:，直接執行
				if (command.startsWith('.uno:')) {
					this.sendUnoCommand(command);
					uno = true;
				} else if (command.startsWith('macro:///')) {
					this.sendMacroCommand(command);
					macro = true;
				// 指令開頭是 dialog:，執行該 dialog
				} else if (command.startsWith('dialog:')) {
					var args = {};
					var dialogName = '';
					var startPos = 'dialog:'.length;
					var queryIdx = command.indexOf('?');
					var queryString = '';
					if (queryIdx >= 0) {
						dialogName = command.substring(startPos, queryIdx);
						queryString = command.substr(queryIdx + 1);
					} else {
						dialogName = command.substr(startPos);
					}

					if (queryString.length) {
						var params = queryString.split('&');
						for (var idx in params) {
							if (params[idx].length) {
								var keyvalue = params[idx].split('=');
								args[keyvalue[0]] = keyvalue[1];
							}
						}
					}
					this.fire('executeDialog', {dialog: dialogName, args: args});
					dialog = true;
				} else {
					this.fire('executeDialog', {dialog: 'Action', id: command});
					dialog = true;
				}
				// 有指定 callback，也執行 callback
				if (typeof commandData.callback === 'function') {
					commandData.callback();
					callback = true;
				}
			}
			// uno 指令或 callback 有一項被執行，才能算成功
			result = (uno | macro | dialog | action | callback);
		}
		return result;
	},

	toggleCommandState: function (unoState) {
		if (this._permission === 'edit') {
			// Modify by Firefly <firefly@ossii.com.tw>
			// Support for commands beginning with macro://
			if (!unoState.startsWith('.uno:') && !unoState.startsWith('macro://')) {
				unoState = '.uno:' + unoState;
			}
			this.sendUnoCommand(unoState);
		}
	},

	insertFile: function (file) {
		this.fire('insertfile', {file: file});
	},

	insertURL: function (url) {
		this.fire('inserturl', {url: url});
	},

	/*
 	 * 強制寫入試算表儲存格
 	 */
	forceCellCommit: function () {
		var map = this;
		// 如果試試算表，檢查儲存格是否有資料未輸入
		if (map._permission === 'edit' && map.getDocType() === 'spreadsheet') {
			var $input = $('#formulaInput');
			// 取得儲存格輸入資料
			var value = $input.val();
			// 有資料就強制寫入儲存格
			if (value !== '') {
				map.focus();
				map._docLayer._postKeyboardEvent('input',
					map.keyboard.keyCodes.enter,
					map.keyboard._toUNOKeyCode(map.keyboard.keyCodes.enter));
				$input.val(''); // 清空輸入資料避免重複輸入
			}
		}
	},

	/*
	 * 字串寫入試算表儲存格
	 * @string - 字串內容
	 * @forceCommit - true(強制)
 	 */
	cellEnterString: function (string, forceCommit) {
		var command = {
			'StringName': {
				type: 'string',
				value: string
			},
			'DontCommit': {
				type: 'boolean',
				value: (forceCommit === true) ? false : true
			}
		};

		this.sendUnoCommand('.uno:EnterString ', command);
	},

	renderFont: function (fontName) {
		this._socket.sendMessage('renderfont font=' + window.encodeURIComponent(fontName));
	},

	showLOAboutDialog: function() {
		// Move the div sitting in 'body' as vex-content and make it visible
		var content = $('#about-dialog').clone().css({display: 'block'});
		// fill product-name and product-string
		var productName = (typeof brandProductName !== 'undefined') ? brandProductName : 'LibreOffice Online';
		content.find('#product-name').text(productName);
		var productString = _('This version of %productName is powered by');
		content.find('#product-string').text(productString.replace('%productName', productName));
		var w;
		var iw = window.innerWidth;
		if (iw < 768) {
			w = iw - 30;
		}
		else if (iw > 1920) {
			w = 960;
		}
		else {
			w = iw / 5 + 590;
		}
		var map = this;
		var handler = function(event) {
			if (event.keyCode === 68) {
				map._docLayer.toggleTileDebugMode();
			}
		};
		vex.open({
			content: content,
			showCloseButton: true,
			escapeButtonCloses: true,
			overlayClosesOnClick: true,
			contentCSS: { width: w + 'px'},
			buttons: {},
			afterOpen: function($vexContent) {
				map.enable(false);
				$(window).bind('keyup.vex', handler);
				// workaround for https://github.com/HubSpot/vex/issues/43
				$('.vex-overlay').css({ 'pointer-events': 'none'});
				$('.vex').click(function() {
					vex.close($vexContent.data().vex.id);
				});
				$('.vex-content').click(function(e) {
					e.stopPropagation();
				});
			},
			beforeClose: function () {
				$(window).unbind('keyup.vex', handler)
				map.enable(true);
				map.focus();
			}
		});
	}
});
