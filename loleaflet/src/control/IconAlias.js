/* -*- js-indent-level: 8; fill-column: 100 -*- */
/**
 * Icon alias handler.
 *
 * @author Firefly <firefly@ossii.com.tw>
 */

/* global L $ */
L.Map.include({

	// uno command 圖示路徑
	_cmdIconDIR: 'cmd/',
	// resource 圖示路徑
	_resIconDIR: 'res/',

	_iconAlias: {
		'acceptchanges': 'accepttrackedchanges',
		'accepttracedchange': 'accepttrackedchange',
		'adddatefield': 'datefield',
		'addname': 'label',
		'addons': 'insertplugin',
		'addtable': 'dbnewtable',
		'addtextbox': 'insertfixedtext',
		'adjust': 'zoomoptimal',
		'alignhorizontalceter': 'alignhorizontalcenter',
		'alignvcenter': 'alignverticalcenter',
		'anchormenu': 'toggleanchortype',
		'apply': 'ok',
		'arrangeframemenu': 'bringtofront',
		'arrangemenu': 'bringtofront',
		'arrowshapes.left-right-arrow': 'arrowshapes',
		'arrowstoolbox': 'linearrowend',
		'autofilter': 'datafilterautofilter',
		'autoformatmenu': 'autocorrectdlg',
		'availabletoolbars': 'showtoolbar',
		'backgroundpatterncontroller': 'backgroundcolor',
		'badcellstyle': 'badcellstyles',
		'basicshapes': 'basicshapes.diamond',
		'basicshapes.circle': 'circle',
		'basicshapes.circle-pie': 'pie',
		'basicshapes.ellipse': 'ellipse',
		'basicshapes.parallelogram': 'flowchartshapes.flowchart-data',
		'basicshapes.quadrat': 'square',
		'basicshapes.rectangle': 'rect',
		'basicshapes.round-rectangle': 'rect_rounded',
		'bezieredge': 'bezierappend',
		'browsebackward': 'prevrecord',
		'browseforward': 'nextrecord',
		'bulletliststyle': 'defaultbullet',
		'calloutshapes.round-rectangular-callout': 'calloutshapes',
		'cellcontentsmenu': 'calculate',
		'cellprotection': 'protect',
		'cellvertbottom': 'alignbottom',
		'cellvertcenter': 'alignverticalcenter',
		'cellverttop': 'aligntop',
		'centerpara': 'alignhorizontalcenter',
		'changesmenu': 'trackchanges',
		'characterbackgroundpattern': 'backcolor',
		'charactermenu': 'fontdialog',
		'charbackcolor': 'backcolor',
		'charspacing': 'spacing',
		'chartmenu': 'diagramtype',
		'charttitlemenu': 'toggletitle',
		'checkboxformfield': 'checkbox',
		'clickchangerotation': 'toggleobjectrotatemode',
		'closedocs': 'closedoc',
		'closewin': 'closepreview',
		'colorview': 'graphicfilterinvert',
		'columnoperations': 'entirecolumn',
		'columnwidth': 'setminimalcolumnwidth',
		'commentchange': 'commentchangetracking',
		'commonalignbottom': 'alignbottom',
		'commonalignhorizontalcenter': 'alignhorizontalcenter',
		'commonalignjustified': 'alignblock',
		'commonalignleft': 'alignleft',
		'commonalignright': 'alignright',
		'commonaligntop': 'aligntop',
		'commonalignverticalcenter': 'alignverticalcenter',
		'commontaskbarvisible': 'autopilotmenu',
		'com.sun.star.deployment.ui.packagemanagerdialog': 'insertplugin',
		'conditionalformatmenu': 'conditionalformatdialog',
		'config': 'choosecontrols',
		'connectorcircles': 'connector',
		'connectorcurvecircles': 'connectorcurve',
		'connectorlinecircles': 'connectorline',
		'connectorlinescircles': 'connector',
		'connectortoolbox': 'connector',
		'convertinto3dlathefast': 'convertinto3dlathe',
		'convertmenu': 'bezierconvert',
		'customanimation': 'diaeffect',
		'datafilterhideautofilter': 'removefiltersort',
		'datapilotmenu': 'datadatapilotrun',
		'datastreamsplay': 'runbasic',
		'datastreamsstop': 'basicstop',
		'datepickerformfield': 'datefield',
		'dbdtableedit': 'dbtableedit',
		'dbformopen': 'open',
		'dbqueryopen': 'open',
		'dbreportopen': 'open',
		'dbtableopen': 'open',
		'defaultcellstyles': 'defaultcharstyle',
		'defaultparastyle': 'controlcodes',
		'deleteallnotes': 'deleteallannotation',
		'deletecomment': 'deleteannotation',
		'deletenote': 'deleteannotation',
		'deleteshapehyperlink': 'removehyperlink',
		'diaauto': 'dia',
		'diagramaxisall': 'diagramaxisxyz',
		'diagramaxismenu': 'diagramaxis',
		'diagramgridmenu': 'togglegridhorizontal',
		'donation': 'currencyfield',
		'draw': 'reload',
		'drawselect': 'selectobject',
		'drawtext': 'text',
		'dropdownformfield': 'combobox',
		'dsbdocumentdatasource': 'insertexternaldatasource',
		'dsbeditdoc': 'editdoc',
		'dsbinsertcolumns': 'insertfieldctrl',
		'editlinksmenu': 'insertreferencefield',
		'editpastespecialmenu': 'pastespecial',
		'editselectmenu': 'selecttables',
		'editshapehyperlink': 'inserthyperlink',
		'editstyled': 'editstyle',
		'ellipsetoolbox': 'ellipse',
		'exitsearch': 'closepreview',
		'exportasgraphic': 'insertgraphic',
		'exportasmenu': 'exportto',
		'exporttoepub': 'exportdirecttoepub',
		'exporttopdf': 'exportdirecttopdf',
		'extrusiontoggle': 'convertinto3d',
		'fieldmenu': 'addfield',
		'fieldnames': 'addfield',
		'fillcolor': 'backgroundcolor',
		'fillstyle': 'backgroundcolor',
		'filtercrit': 'datafilterstandardfilter',
		'findbar': 'recsearch',
		'firstpage': 'firstrecord',
		'firstslide': 'firstrecord',
		'fliphorizontal': 'mirror',
		'flipmenu': 'mirror',
		'flipvertical': 'mirrorvert',
		'flowchartshapes.flowchart-alternate-process': 'basicshapes.round-quadrat',
		'flowchartshapes.flowchart-connector': 'circle',
		'flowchartshapes.flowchart-extract': 'basicshapes.isosceles-triangle',
		'flowchartshapes.flowchart-magnetic-disk': 'basicshapes.can',
		'flowchartshapes.flowchart-manual-operation': 'basicshapes.trapezoid',
		'flowchartshapes.flowchart-merge': 'fontworkshapetype.fontwork-triangle-down',
		'flowchartshapes.flowchart-process': 'square',
		'focustofindbar': 'recsearch',
		'fontcolor': 'color',
		'fontdialogforparagraph': 'fontdialog',
		'fontheight': 'scaletext',
		'fontworkalignmentfloater': 'alignhorizontalcenter',
		'fontworkcharacterspacingfloater': 'spacing',
		'fontworkshapetype': 'fontwork',
		'fontworkshapetype.fontwork-circle-pour': 'basicshapes.ring',
		'fontworkshapetype.fontwork-fade-down': 'basicshapes.trapezoid',
		'fontworkshapetype.fontwork-triangle-up': 'basicshapes.isosceles-triangle',
		'footnotecellstyles': 'insertfootnote',
		'formatarea': 'backgroundcolor',
		'formatbulletsmenu': 'defaultbullet',
		'formatframemenu': 'framedialog',
		'formatimagemenu': 'graphic',
		'formatselection': 'configuredialog',
		'formatspacingmenu': 'spacepara15',
		'formattextmenu': 'charfontname',
		'formfilter': 'datafilterspecialfilter',
		'formfilterexecute': 'datafilterstandardfilter',
		'freezepanescolumn': 'freezepanesfirstcolumn',
		'freezepanesrow': 'freezepanesfirstrow',
		'functionbox': 'dbviewfunctions',
		'functiondialog': 'dbviewfunctions',
		'goodcellstyle': 'goodcellstyles',
		'gotoendofdoc': 'lastrecord',
		'gotostartofdoc': 'firstrecord',
		'grafattrcrop': 'crop',
		'grafinvert': 'graphicfilterinvert',
		'grafmode': 'graphicdialog',
		'graphicfilterposter': 'graphicdialog',
		'graphicfiltertoolbox': 'autopilotmenu',
		'graphicmenu': 'avmediaplayer',
		'grid': 'insertspreadsheet',
		'gridmenu': 'gridvisible',
		'groupmenu': 'formatgroup',
		'groupoutlinemenu': 'group',
		'headerandfooter': 'editheaderandfooter',
		'heading1cellstyles': 'heading1parastyle',
		'heading2cellstyles': 'heading2parastyle',
		'helperdialog': 'helpindex',
		'hscroll': 'hscrollbar',
		'hyperlinkdialog': 'inserthyperlink',
		'hyphenation': 'hyphenate',
		'indexesmenu': 'insertindexesentry',
		'inputlinevisible': 'dbviewfunctions',
		'insertannotation': 'shownote',
		'insertauthorfield': 'dbviewaliases',
		'insertavmedia': 'avmediaplayer',
		'insertcell': 'insertcellsright',
		'insertcolumns': 'insertcolumnsafter',
		'insertcolumnsmenu': 'insertcolumnsafter',
		'insertcontents': 'pastespecial',
		'insertctrl': 'inserttable',
		'insertcurrencyfield': 'currencyfield',
		'insertcurrentdate': 'datefield',
		'insertcurrenttime': 'timefield',
		'insertdatefield': 'datefield',
		'insertdatefieldfix': 'datefield',
		'insertdatefieldvar': 'datefield',
		'insertedit': 'edit',
		'insertfield': 'addfield',
		'insertfilecontrol': 'filecontrol',
		'insertfilefield': 'filefield',
		'insertfootnotesmenu': 'insertfootnote',
		'insertformattedfield': 'formattedfield',
		'insertformcheck': 'checkbox',
		'insertformcombo': 'combobox',
		'insertformhscroll': 'hscrollbar',
		'insertformlist': 'listbox',
		'insertformmenu': 'choosecontrols',
		'insertformradio': 'radiobutton',
		'insertformspin': 'spinbutton',
		'insertformula': 'dbviewfunctions',
		'insertformvscroll': 'scrollbar',
		'insertframeinteract': 'insertframe',
		'insertframeinteractnocolumns': 'insertframe',
		'insertgridcontrol': 'insertspreadsheet',
		'insertheaderfootermenu': 'editheaderandfooter',
		'insertimagecontrol': 'imagecontrol',
		'insertlistbox': 'listbox',
		'insertmenuaxes': 'diagramaxis',
		'insertmenugrids': 'togglegridhorizontal',
		'insertmenulegend': 'legend',
		'insertnumericfield': 'numberformatstandard',
		'insertobjctrl': 'drawchart',
		'insertobjectchart': 'drawchart',
		'insertobjectchartfromfile': 'open',
		'insertobjectdialog': 'insertobject',
		'insertobjectstarmath': 'insertmath',
		'insertpagefield': 'insertpagenumberfield',
		'insertpagefooter': 'insertfooter',
		'insertpageheader': 'insertheader',
		'insertpagenumber': 'insertpagenumberfield',
		'insertpagesfield': 'insertpagecountfield',
		'insertpagetitlefield': 'inserttitlefield',
		'insertpatternfield': 'patternfield',
		'insertpushbutton': 'pushbutton',
		'insertrows': 'insertrowsafter',
		'insertrowsmenu': 'insertrowsafter',
		'insertscript': 'choosemacro',
		'insertsignatureline': 'signaturelinedialog',
		'insertslidefield': 'insertslidenumberfield',
		'insertslidenumber': 'insertslidenumberfield',
		'insertslidesfield': 'insertslidecountfield',
		'inserttextframe': 'insertframe',
		'inserttimefieldfix': 'timefield',
		'inserttimefield': 'timefield',
		'inserttimefieldvar': 'timefield',
		'inserttoolbox': 'dataimport',
		'insobjctrl': 'newdoc',
		'justifypara': 'alignblock',
		'languagemenu': 'managelanguage',
		'lastpage': 'lastrecord',
		'lastslide': 'lastrecord',
		'leftpara': 'alignleft',
		'librelogo-gobackward': 'arrowshapes.down-arrow',
		'librelogo-goforward': 'arrowshapes.up-arrow',
		'librelogo-run': 'runbasic',
		'librelogo-stop': 'basicstop',
		'librelogo-translate': 'editglossary',
		'linenumberdialog': 'linenumberingdialog',
		'linespacing': 'spacepara15',
		'linetoolbox': 'freeline_unfilled',
		'loadstyles': 'open',
		'macrodialog': 'scriptorganizer',
		'macroorganizer%3ftabid%3ashort=1': 'open',
		'macroorganizer': 'scriptorganizer',
		'macrosmenu': 'choosemacro',
		'mailmergefirstentry': 'firstrecord',
		'mailmergelastentry': 'lastrecord',
		'mailmergenextentry': 'nextrecord',
		'mailmergepreventry': 'prevrecord',
		'margins': 'pagemargin',
		'masterslidespanel': 'slidemasterpage',
		'measureattributes': 'measureline',
		'mergecellsmenu': 'togglemergecells',
		'mergedocument': 'mergedocuments',
		'mirrorhorz': 'mirror',
		'mirrormenu': 'rotateleft',
		'modifypage': 'slidesetup',
		'movepagedown': 'downsearch',
		'movepageup': 'upsearch',
		'moveslidedown': 'downsearch',
		'moveslidefirst': 'movepagefirst',
		'moveslidelast': 'movepagelast',
		'moveslideup': 'upsearch',
		'namegroup': 'definename',
		'navigateback': 'prevrecord',
		'navigateforward': 'nextrecord',
		'neutralcellstyle': 'neutralcellstyles',
		'nextpage': 'nextrecord',
		'nextslide': 'nextrecord',
		'no': 'cancel',
		'notecellstyles': 'shownote',
		'notevisible': 'shownote',
		'numberformatcurrencysimple': 'numberformatcurrency',
		'numberformatmenu': 'numberformatstandard',
		'numberingmenu': 'outlinebullet',
		'numberliststyle': 'defaultnumbering',
		'numericfield': 'numberformatstandard',
		'objectalign': 'objectalignleft',
		'objectmenu': 'formatobjectmenu',
		'objectmirrorhorizontal': 'mirror',
		'objectmirrorvertical': 'mirrorvert',
		'objects3dtoolbox': 'cube',
		'objecttitledescription': 'insertcaptiondialog',
		'onlinehelp': 'helpindex',
		'openfromcalc': 'open',
		'openfromwriter': 'open',
		'open_h': 'open',
		'openhyperlinkoncursor': 'inserthyperlink',
		'openurl': 'browseview',
		'openxmlfiltersettings': 'managexmlsource',
		'ordercrit': 'datasort',
		'outlinedown': 'movedown',
		'outlineleft': 'incrementlevel',
		'outlineright': 'decrementlevel',
		'outlineup': 'moveup',
		'outputqualitycolor': 'insertgraphic',
		'pagedown': 'nextrecord',
		'pageformatdialog': 'pagedialog',
		'pageup': 'prevrecord',
		'paragraphmenu': 'paragraphdialog',
		'pastespecialmenu': 'pastespecial',
		'pluginsactive': 'insertplugin',
		'previewprintoptions': 'printpreview',
		'previewzoom': 'zoom',
		'previouspage': 'prevrecord',
		'previousslide': 'prevrecord',
		'printpagepreview': 'printpreview',
		'printrangesmenu': 'defineprintarea',
		'questionanswers': 'browseview',
		'quickedit': 'editdoc',
		'rectangletoolbox': 'rect',
		'recundo': 'undo',
		'refresh': 'reload',
		'removefilter': 'removefiltersort',
		'renametable': 'name',
		'repaginate': 'insertpagenumberfield',
		'reportissue': 'editdoc',
		'rightpara': 'alignright',
		'rotateflipmenu': 'rotateleft',
		'rowheight': 'setminimalrowheight',
		'rowoperations': 'entirerow',
		'rulermenu': 'ruler',
		'rulerrows': 'extrusiontiltleft',
		'rulerrowsvertical': 'extrusiontiltright',
		'savegraphic': 'save',
		'savesimple': 'save',
		'sbabrwinsert': 'insertfieldctrl',
		'scrollbarmenu': 'scrollbar',
		'scrolltonext': 'downsearch',
		'scrolltoprevious': 'upsearch',
		'sectionalignbottom': 'aligndown',
		'sectionalignleft': 'objectalignleft',
		'sectionalignright': 'objectalignright',
		'sectionaligntop': 'alignup',
		'selectcolumn': 'entirecolumn',
		'selectdata': 'selectdb',
		'selectmode': 'selectobject',
		'selectrow': 'entirerow',
		'sendfeedback': 'insertenvelope',
		'setdefault': 'resetattributes',
		'setoptimalcolumnwidthdirect': 'setoptimalcolumnwidth',
		'settabbgcolor': 'backgroundcolor',
		'shapeslinemenu': 'line',
		'shapesmenu': 'insertdraw',
		'sheetcommentmenu': 'shownote',
		'sheetlefttoright': 'paralefttoright',
		'sheetrighttoleft': 'pararighttoleft',
		'showallnotes': 'showannotations',
		'showbrowser': 'controlproperties',
		'showchanges': 'showtrackedchanges',
		'showgraphics': 'graphic',
		'showinlinetooltips': 'shownote',
		'showpropbrowser': 'controlproperties',
		'showruler': 'ruler',
		'sidebarmenu': 'sidebar',
		'sortdialog': 'datasort',
		'sortdown': 'sortdescending',
		'sortup': 'sortascending',
		'sourceview': 'symbolshapes.brace-pair',
		'spelldialog': 'spelling',
		'spellingandgrammardialog': 'spelling',
		'starchartdialog': 'drawchart',
		'symbolcatalogue': 'insertsymbol',
		'symbolshapes.smiley': 'symbolshapes',
		'tableautofitmenu': 'setoptimalrowheight',
		'tablecellbackgroundcolor': 'backgroundcolor',
		'tabledeletemenu': 'deletetable',
		'tableevents': 'animationeffects',
		'tableinsertmenu': 'insertrowsafter',
		'tablemenu': 'tabledialog',
		'tableselectmenu': 'selecttable',
		'tablesort': 'sortascending',
		'templatemenu': 'templatemanager',
		'textalign': 'alignblock',
		'textattributes': 'fontdialog',
		'textfittosizetool': 'text_marquee',
		'textformfield': 'edit',
		'texttoolbox': 'text',
		'thesaurusdialog': 'thesaurus',
		'toggleaxisdescr': 'helplinesvisible',
		'toolbarsmenu': 'showtoolbar',
		'toolsformsmenu': 'dbviewforms',
		'toolsmacroedit': 'basicideappear',
		'tracechangemode': 'trackchanges',
		'underlinesimple': 'underline',
		'underlinesingle': 'underline',
		'updateallindexes': 'insertmultiindex',
		'updatealllinks': 'inserthyperlink',
		'updateall': 'reload',
		'updatecharts': 'drawchart',
		'updatefields': 'addfield',
		'updatemenu': 'reload',
		'usewizards': 'autopilotmenu',
		'view100': 'zoom100percent',
		'view3d': 'cube',
		'viewsidebarstyles': 'designerdialog',
		'viewtrackchanges': 'showtrackedchanges',
		'vscrollbar': 'scrollbar',
		'vscroll': 'scrollbar',
		'webhtml': 'browseview',
		'wrapmenu': 'wrapon',
		'xlinestyle': 'linestyle',
		'yes': 'ok',
		'zoomminus': 'zoomout',
		'zoomplus': 'zoomin',
		'zoomtoolbox': 'zoom'
	},

	// 帶參數的 uno 指令(.uno:AssignLayout?WhatLayer=xx)
	_resorceIcon: {
		'.uno:AssignLayout?WhatLayout:long=20': 'res:layout_empty', // 空白投影片
		'.uno:AssignLayout?WhatLayout:long=19': 'res:layout_head01', // 只有題名
		'.uno:AssignLayout?WhatLayout:long=0': 'res:layout_head03', // 題名投影片
		'.uno:AssignLayout?WhatLayout:long=1': 'res:layout_head02', // 題名、內容區塊
		'.uno:AssignLayout?WhatLayout:long=32': 'res:layout_textonly', // 文字置中

		'.uno:AssignLayout?WhatLayout:long=3': 'res:layout_head02a', // 題名和2個內容區塊
		'.uno:AssignLayout?WhatLayout:long=12': 'res:layout_head03c', // 題名、內容區塊和2個內容區塊
		'.uno:AssignLayout?WhatLayout:long=15': 'res:layout_head03b', // 題名、2個內容區塊和內容區塊
		'.uno:AssignLayout?WhatLayout:long=14': 'res:layout_head02b', // 題名、內容區塊在內容區塊之上
		'.uno:AssignLayout?WhatLayout:long=16': 'res:layout_head03a', // 題名、2個內容區塊在內容區塊之上
		'.uno:AssignLayout?WhatLayout:long=18': 'res:layout_head04', // 題名、4個內容區塊
		'.uno:AssignLayout?WhatLayout:long=34': 'res:layout_head06', // 題名、6個內容區塊

		'.uno:AssignLayout?WhatLayout:long=28': 'res:layout_vertical01', // 垂直題名、垂直文字
		'.uno:AssignLayout?WhatLayout:long=27': 'res:layout_vertical02', // 垂直題名、文字、圖表
		'.uno:AssignLayout?WhatLayout:long=29': 'res:layout_head02', // 題名、垂直文字
		'.uno:AssignLayout?WhatLayout:long=30': 'res:layout_head02a', // 題名、垂直文字、美術圖形
	},

	/**
	 * 製作 hotkey 字串的 DOM
	 * @param {string} hotkey - 如 Ctrl+C 之類的字串，各按鍵之間用 '+' 號區隔
	 * @returns html element
	 */
	createItemHotkey: function(hotkey) {
		// 避免連續兩個 '++'，所以先把 '++' 換成 '+PLUS'
		var myHotkey = L.Util.replaceCtrlAltInMac(hotkey.replace('++', '+PLUS'));
		var hotkeyItem = L.DomUtil.create('span', 'hotkey');
		var keys = myHotkey.split('+');
		for (var k=0 ; k < keys.length ; k++) {
			var kbd = L.DomUtil.create('i', 'keyboard', hotkeyItem);
			kbd.textContent = (keys[k] === 'PLUS' ? '+' : keys[k]);
			if (k !==  keys.length - 1) {
				var plus = L.DomUtil.create('span', '', hotkeyItem);
				plus.textContent = '+';
			}
		}
		return hotkeyItem;
	},

	contextMenuIcon: function(opt, $itemElement, itemKey, item) {
		// 由於 JQuery contexMenu 每個 Item 會傳兩次，
		// 所以在第一次時，加入 icon 圖示後，傳回 'iconOK' 字串，會被放入 $itemElement 的 class 中，
		// 第二次被呼叫時，如果有 iconOK，就知道是第二次呼叫
		if ($itemElement.hasClass('iconOK')) {
			// 沒有指定 checktype
			if (item.checktype === undefined) {
				var state = this.stateChangeHandler.getItemProperty(itemKey);
				if (state.checked()) {
					$itemElement.addClass('context-menu-icon');
				} else {
					$itemElement.removeClass('context-menu-icon');
				}
			} else if (item.checked) { // 設定勾選
				$itemElement.addClass('context-menu-icon');
			} else { // 未勾選
				$itemElement.removeClass('context-menu-icon');
			}
			return '';
		}
		$itemElement.addClass('iconOK');
		// 設定 icon
		var icon = L.DomUtil.create('i', 'context-menu-image-icon');
		// 如果有 _savedIcon 的話，以 _savedIcon 為主，否則以 itemKey 為主
		// P.S. _savedIcon 是 L.installContextMenu() 產生的，
		// 非透過 L.installContextMenu() 無法指定
		var iconURL = this.getIconURL(item._savedIcon ? item._savedIcon : itemKey);
		$(icon).css('background-image', 'url("' + iconURL  + '")');
		$itemElement.prepend(icon);
		// 如果是桌面環境，檢查該項目是否有快捷鍵
		if (window.mode.isDesktop()) {
			var hotkey = this.getCommandHotkey(itemKey);
			if (hotkey) {
				//$itemElement.addClass('item-has-hotkey');
				var keys = hotkey.split('+');
				var paddingRight = (hotkey.length * 5) + (keys.length * 5) + 32;
				$itemElement.attr('style', 'padding-right:' + paddingRight + 'px !important');
				$itemElement.append(this.createItemHotkey(hotkey));
			}
		}
		// 如果是 debug 模式，把 id 放進 title
		if (window.protocolDebug === true) {
			$itemElement.prop('title', itemKey);
		}
		return '';
	},

	/**
	 * 把 uno 指令轉換成 icon 圖示 URL
	 * @param {string} icon - 若為 'res:' 開頭，則尋找 images/res/ 目錄下同名的圖示
	 * 若為 '.uno' 或 'dialog' 則尋找 images/cmd/ 之下的同名圖示，
	 * 否則為 images/ 下之 lc_ + 同名圖示
	 *
	 * @returns {string} 該圖示的位址
	 */
	getIconURL: function(icon) {
		if (!icon) return '';

		var iconDIR = '';

		// 特殊的指令
		if (this._resorceIcon[icon]) {
			icon = this._resorceIcon[icon];
		}

		var queryIndex = icon.indexOf('?');
		// 切掉查詢字串(如果有的話)
		if (queryIndex > 0) {
			icon = icon.substring(0, queryIndex);
		}

		// 轉成小寫
		icon = icon.toLowerCase();

		//
		var category = '';
		var iconName = icon;
		var colonIndex = icon.indexOf(':');
		// 切掉查詢字串(如果有的話)
		if (colonIndex > 0) {
			category = icon.substring(0, colonIndex);
			iconName = icon.substring(colonIndex + 1);
		}

		switch (category) {
		case 'res':
			iconDIR = this._resIconDIR;
			break;

		case '.uno':
		case 'dialog':
			iconDIR = this._cmdIconDIR;
			iconName = this._iconAlias[iconName] ? this._iconAlias[iconName] : iconName;
			break;

		default:
			iconName = 'lc_' + iconName;
			break;
		}

		return L.LOUtil.getImageURL(iconDIR + iconName + '.svg');
	},
});
