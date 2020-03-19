/* -*- js-indent-level: 8 -*- */
/*
 * Toolbar handler
 */

/* global $ window vex brandProductName _ _UNOTARGET*/
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

	_iconAlias: {
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
		'commonalignleft': 'alignleft',
		'commonalignhorizontalcenter': 'alignhorizontalcenter',
		'commonalignright': 'alignright',
		'commonalignjustified': 'alignblock',
		'commonaligntop': 'aligntop',
		'commonalignverticalcenter' : 'alignverticalcenter',
		'commonalignbottom': 'alignbottom',
		'convertmenu': 'bezierconvert',
		'deletecell': 'delete',
		'deletenote': 'deleteannotation',
		'drawtext': 'text',
		'editshapehyperlink': 'edithyperlink',
		'deleteshapehyperlink': 'removehyperlink',
		'openhyperlinkoncursor': 'inserthyperlink',
		'flipmenu': 'mirror',
		'fliphorizontal': 'mirror',
		'flipvertical': 'mirrorvert',
		'footnotecellstyles': 'insertfootnote',
		'formatarea': 'backgroundcolor',
		'formatbulletsmenu': 'defaultbullet',
		'formatspacingmenu': 'spacepara15',
		'formatstylesmenu': 'colorscaleformatdialog',
		'conditionalformatmenu': 'colorscaleformatdialog',
		'formattextmenu': 'fontdialog',
		'gridmenu': 'gridvisible',
		'groupmenu': 'group',
		'hyperlinkdialog': 'inserthyperlink',
		'indexesmenu': 'insertindexesentry',
		'insertannotation': 'shownote',
		'insertauthorfield': 'dbviewaliases',
		'insertcurrentdate': 'datefield',
		'insertcurrenttime': 'timefield',
		'insertrowbreak': 'insertpagebreak',
		'insertcell': 'insertcellsright',
		'insertcolumnsmenu': 'insertcolumns',
		'insertdatefield' : 'datefield',
		'insertfield': 'addfield',
		'insertheaderfootermenu': 'editheaderandfooter',
		'insertobjectchart': 'drawchart',
		'insertrowsmenu': 'insertrows',
		'inserttimefield' : 'timefield',
		'languagemenu': 'managelanguage',
		'mirrorhorz': 'mirror',
		'mirrormenu': 'rotateleft',
		'movepagedown': 'downsearch',
		'movepageup': 'upsearch',
		'namegroup': 'definename',
		'notecellstyles': 'showannotations',
		'numberingmenu': 'outlinebullet',
		'numberliststyle': 'defaultnumbering',
		'objectalign': 'objectalignleft',
		'objectmirrorhorizontal': 'mirror',
		'objectmirrorvertical': 'mirrorvert',
		'objecttitledescription': 'insertcaptiondialog',
		'pageformatdialog': 'pagedialog',
		'paragraphmenu': 'paragraphdialog',
		'previoustrackedchange': 'prevrecord',
		'nexttrackedchange': 'nextrecord',
		'rotateflipmenu': 'rotateleft',
		'savegraphic': 'save',
		'setdefault': 'resetattributes',
		'setobjecttobackground': 'sendtoback',
		'showruler': 'ruler',
		'showtrackedchanges': 'addwatch',
		'slidesetup': 'pagesetup',
		'spellingandgrammardialog': 'spelling',
		'tableautofitmenu': 'setoptimalrowheight',
		'tableinsertmenu': 'insertrowsafter',
		'tabledeletemenu': 'deletetable',
		'tableselectmenu': 'selecttable',
		'textalign': 'alignblock',
		'textattributes': 'fontdialog',
		'wrapmenu': 'wrapon',
		'zoomminus': 'zoomout',
		'zoomplus': 'zoomin',
	},

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

	cellEnterString: function (string) {
		var command = {
			'StringName': {
				type: 'string',
				value: string
			},
			'DontCommit': {
				type: 'boolean',
				value: true
			}
		};

		this.sendUnoCommand('.uno:EnterString ', command);
	},

	renderFont: function (fontName) {
		this._socket.sendMessage('renderfont font=' + window.encodeURIComponent(fontName));
	},

	showLOKeyboardHelp: function() {
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
		$.get('loleaflet-help.html', function(data) {
			vex.open({
				content: data,
				showCloseButton: true,
				escapeButtonCloses: true,
				overlayClosesOnClick: true,
				contentCSS: {width: w + 'px'},
				buttons: {},
				afterOpen: function($vexContent) {
					map.enable(false);
					// Display help according to document opened
					if (map.getDocType() === 'text') {
						document.getElementById('text-shortcuts').style.display='block';
					}
					else if (map.getDocType() === 'spreadsheet') {
						document.getElementById('spreadsheet-shortcuts').style.display='block';
					}
					else if (map.getDocType() === 'presentation' || map.getDocType() === 'drawing') {
						document.getElementById('presentation-shortcuts').style.display='block';
					}

					// Lets translate
					var i, max;
					var translatableContent = $vexContent.find('h1');
					for (i = 0, max = translatableContent.length; i < max; i++) {
						translatableContent[i].firstChild.nodeValue = translatableContent[i].firstChild.nodeValue.toLocaleString();
					}
					translatableContent = $vexContent.find('h2');
					for (i = 0, max = translatableContent.length; i < max; i++) {
						translatableContent[i].firstChild.nodeValue = translatableContent[i].firstChild.nodeValue.toLocaleString();
					}
					translatableContent = $vexContent.find('td');
					for (i = 0, max = translatableContent.length; i < max; i++) {
						translatableContent[i].firstChild.nodeValue = translatableContent[i].firstChild.nodeValue.toLocaleString();
					}
					translatableContent = $vexContent.find('p');
					for (i = 0, max = translatableContent.length; i < max; i++) {
						translatableContent[i].firstChild.nodeValue = translatableContent[i].firstChild.nodeValue.toLocaleString();
					}

					$('.vex-content').attr('tabindex', -1);
					$('.vex-content').focus();
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
					map.focus();
					map.enable(true);
				}
			});
		});
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
