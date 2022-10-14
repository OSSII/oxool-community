/* -*- js-indent-level: 8; fill-column: 100 -*- */
/*
 * Toolbar handler
 */

/* global app $ w2ui window vex sanitizeUrl brandProductName brandProductURL _ _UNOTARGET */
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

	onFontSelect: function(e) {
		var font = e.target.value;
		this.applyFont(font);
		this.focus();
	},

	_getCurrentFontName: function() {
		return this['stateChangeHandler'].getItemValue('.uno:CharFontName');
	},

	createFontSelector: function(nodeSelector) {
		var that = this;

		var fontcombobox = $(nodeSelector);
		if (!fontcombobox.hasClass('select2')) {
			fontcombobox.select2({
				placeholder: _('Font')
			});
		}

		var createSelector = function() {
			var commandValues = that.getToolbarCommandValues('.uno:CharFontName');

			var data = []; // reset data in order to avoid that the font select box is populated with styles, too.
			// Old browsers like IE11 et al don't like Object.keys with
			// empty arguments
			if (typeof commandValues === 'object') {
				data = data.concat(Object.keys(commandValues));
			}
			fontcombobox.empty();
			for (var i = 0; i < data.length; ++i) {
				if (!data[i]) continue;
				var option = document.createElement('option');
				option.text = data[i];
				option.value = data[i];
				fontcombobox.append(option);
			}
			fontcombobox.on('select2:select', that.onFontSelect.bind(that));

			fontcombobox.val(that._getCurrentFontName()).trigger('change');
		};

		createSelector();

		// 如果是手機模式，才執行這裡
		// TODO: 未來仍須修改手機模式的字體大小選擇，
		// 連根拔掉這個 map.createFontSelector() 及相關部份
		if (window.mode.isMobile()) {
			var onCommandStateChanged = function(e) {
				var commandName = e.commandName;

				if (commandName !== '.uno:CharFontName')
					return;

				if (!e.hasValue()) {
					return;
				}

				var state = e.state;
				var found = false;
				fontcombobox.children('option').each(function () {
					var value = this.value;
					if (value.toLowerCase() === state.toLowerCase()) {
						found = true;
						return;
					}
				});

				if (!found && state) {
					fontcombobox
						.append($('<option></option>')
							.text(state));
				}

				fontcombobox.val(state).trigger('change');
			};

			this.off('commandstatechanged', onCommandStateChanged);
			this.on('commandstatechanged', onCommandStateChanged);
		}

		var onFontListChanged = function(e) {
			if (e.commandName === '.uno:CharFontName')
				createSelector();
		};

		this.off('updatetoolbarcommandvalues', onFontListChanged);
		this.on('updatetoolbarcommandvalues', onFontListChanged);
	},

	onFontSizeSelect: function(e) {
		this.applyFontSize(e.target.value);
		this.focus();
	},

	createFontSizeSelector: function(nodeSelector) {
		var data = [6, 7, 8, 9, 10, 10.5, 11, 12, 13, 14, 15, 16, 18, 20,
			22, 24, 26, 28, 32, 36, 40, 44, 48, 54, 60, 66, 72, 80, 88, 96];

		var fontsizecombobox = $(nodeSelector);
		if (!fontsizecombobox.hasClass('select2')) {
			fontsizecombobox.select2({
				dropdownAutoWidth: true,
				width: 'auto',
				placeholder: _('Font Size'),
				//Allow manually entered font size.
				createTag: function(query) {
					return {
						id: query.term,
						text: query.term,
						tag: true
					};
				},
				tags: true,
				sorter: function(data) { return data.sort(function(a, b) {
					return parseFloat(a.text) - parseFloat(b.text);
				});}
			});
		}

		fontsizecombobox.empty();
		for (var i = 0; i < data.length; ++i) {
			var option = document.createElement('option');
			option.text = data[i];
			option.value = data[i];
			fontsizecombobox.append(option);
		}
		fontsizecombobox.off('select2:select', this.onFontSizeSelect.bind(this)).on('select2:select', this.onFontSizeSelect.bind(this));

		// 如果不是手機模式，就結束
		// TODO: 未來仍須修改手機模式的字體大小選擇，
		// 連根拔掉這個 map.createFontSizeSelector() 及相關部份
		if (!window.mode.isMobile()) return;

		var onCommandStateChanged = function(e) {
			var commandName = e.commandName;

			if (commandName !== '.uno:FontHeight')
				return;

			if (!e.hasValue()) {
				return;
			}

			var state = e.state;
			var found = false;

			if (state === '0') {
				state = '';
			}

			fontsizecombobox.children('option').each(function (i, e) {
				if ($(e).text() === state) {
					found = true;
				}
			});

			if (!found) {
				// we need to add the size
				fontsizecombobox
					.append($('<option>')
						.text(state).val(state));
			}

			fontsizecombobox.val(state).trigger('change');
		};

		this.off('commandstatechanged', onCommandStateChanged);
		this.on('commandstatechanged', onCommandStateChanged);
	},

	applyFont: function (fontName) {
		if (!fontName)
			return;
		if (this.isPermissionEdit()) {
			var msg = 'uno .uno:CharFontName {' +
				'"CharFontName.FamilyName": ' +
					'{"type": "string", "value": "' + fontName + '"}}';
			app.socket.sendMessage(msg);
		}
	},

	applyFontSize: function (fontSize) {
		if (this.isPermissionEdit()) {
			var msg = 'uno .uno:FontHeight {' +
				'"FontHeight.Height": ' +
				'{"type": "float", "value": "' + fontSize + '"}}';
			app.socket.sendMessage(msg);
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
		if (format === 'pdf') {
			if (this.options.watermark === undefined || this.options.watermark.printing !== true) {
				L.dialog.run('PdfWatermarkText', {
					args: {
						name: name,
						id: id,
						options: options
					}
				});
				return;
			}
		}

		if (!window.ThisIsAMobileApp)
			this.showBusy(_('Downloading...'), false);
		app.socket.sendMessage('downloadas ' +
			'name=' + encodeURIComponent(name) + ' ' +
			'id=' + id + ' ' +
			'format=' + format + ' ' +
			'options=' + options);
	},

	print: function () {
		if (window.ThisIsTheiOSApp || window.ThisIsTheAndroidApp) {
			window.postMobileMessage('PRINT');
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
		app.socket.sendMessage('saveas ' +
			'url=wopi:' + encodeURIComponent(url) + ' ' +
			'format=' + format + ' ' +
			'options=' + options);
	},

	renameFile: function (filename) {
		if (!filename) {
			return;
		}
		this.showBusy(_('Renaming...'), false);
		app.socket.sendMessage('renamefile filename=' + encodeURIComponent(filename));
	},

	applyStyle: function (style, familyName) {
		if (!style || !familyName) {
			this.fire('error', {cmd: 'setStyle', kind: 'incorrectparam'});
			return;
		}
		if (this.isPermissionEdit()) {
			var msg = 'uno .uno:StyleApply {' +
					'"Style":{"type":"string", "value": "' + style + '"},' +
					'"FamilyName":{"type":"string", "value":"' + familyName + '"}' +
					'}';
			app.socket.sendMessage(msg);
		}
	},

	applyLayout: function (layout) {
		if (!layout) {
			this.fire('error', {cmd: 'setLayout', kind: 'incorrectparam'});
			return;
		}
		if (this.isPermissionEdit()) {
			var msg = 'uno .uno:AssignLayout {' +
					'"WhatPage":{"type":"unsigned short", "value": "' + this.getCurrentPartNumber() + '"},' +
					'"WhatLayout":{"type":"unsigned short", "value": "' + layout + '"}' +
					'}';
			app.socket.sendMessage(msg);
		}
	},

	save: function(dontTerminateEdit, dontSaveIfUnmodified, extendedData) {
		var msg = 'save' +
					' dontTerminateEdit=' + (dontTerminateEdit ? 1 : 0) +
					' dontSaveIfUnmodified=' + (dontSaveIfUnmodified ? 1 : 0);

		if (extendedData !== undefined) {
			msg += ' extendedData=' + extendedData;
		}

		app.socket.sendMessage(msg);
	},

	/* messageNeedsToBeRedirected: function(command) {
		if (command === '.uno:EditHyperlink') {
			var that = this;
			setTimeout(function () { that.showHyperlinkDialog(); }, 500);
			return true;
		}
		else {
			return false;
		}
	}, */

	sendUnoCommand: function (command, json) {
		command = command.trim(); // 去掉前後空白，(不知為何，就有程序愛加空白在命令列後面 XD)
		// 是否有替代 uno?
		var targetURL = _UNOTARGET(command, this.getDocType());
		// 有的話就用替代 uno
		if (targetURL !== '') command = targetURL;
		// 有的 uno 用 URI 方式傳遞參數，所以必須 encode 確保參數傳遞正確
		command = encodeURI(command);

		// To exercise the Trace Event functionality, uncomment this
		// app.socket.emitInstantTraceEvent('oxool-unocommand:' + command);

		var isAllowedInReadOnly = false;
		var allowedCommands = ['.uno:Save', '.uno:WordCountDialog', '.uno:EditAnnotation',
			'.uno:InsertAnnotation', '.uno:DeleteAnnotation', '.uno:Signature',
			'.uno:ShowResolvedAnnotations', '.uno:ToolbarMode?Mode:string=notebookbar_online.ui',
			'.uno:ToolbarMode?Mode:string=Default', '.uno:ResolveComment'];

		for (var i in allowedCommands) {
			if (allowedCommands[i] === command) {
				isAllowedInReadOnly = true;
				break;
			}
		}
		if (command.startsWith('.uno:SpellOnline')) {
			var map = this;
			var val = map['stateChangeHandler'].getItemValue('.uno:SpellOnline');

			// proceed if the toggle button is pressed
			if (val && (json === undefined || json === null)) {
				 // because it is toggle, state has to be the opposite
				var state = !(val === 'true');
				if (window.isLocalStorageAllowed)
					window.localStorage.setItem('SpellOnline', state);
			}
		}

		if (this.uiManager.isUIBlocked())
			return;
		if (this.dialog.hasOpenedDialog() && !command.startsWith('.uno:ToolbarMode'))
			this.dialog.blinkOpenDialog();
		else if (this.isPermissionEdit() || isAllowedInReadOnly) {
			//if (!this.messageNeedsToBeRedirected(command))
			app.socket.sendMessage('uno ' + command + (json ? ' ' + JSON.stringify(json) : ''));
		}
	},

	toggleCommandState: function (unoState) {
		if (this.isPermissionEdit()) {
			if (!unoState.startsWith('.uno:')) {
				unoState = '.uno:' + unoState;
			}
			this.executeAllowedCommand(unoState);
		}
	},

	insertFile: function (file) {
		this.fire('insertfile', {file: file});
	},

	insertURL: function (url) {
		this.fire('inserturl', {url: url});
	},

	selectBackground: function (file) {
		this.fire('selectbackground', {file: file});
	},

	showLOAboutDialog: function() {
		// Move the div sitting in 'body' as vex-content and make it visible
		var content = $('#about-dialog').clone().css({display: 'block'});
		// fill product-name and product-string
		var productName = brandProductName;
		var productURL = brandProductURL;
		content.find('#product-name').text(productName).addClass('product-' + productName.split(/[ ()]+/).join('-').toLowerCase());
		var productString = _('This version of %productName is powered by');
		var productNameWithURL;
		if (!window.ThisIsAMobileApp)
			productNameWithURL = '<a href="' + sanitizeUrl.sanitizeUrl(productURL) +
								 '" target="_blank">' + productName + '</a>';
		else
			productNameWithURL = productName;
		content.find('#product-string').html(productString.replace('%productName', productNameWithURL));

		if (window.socketProxy)
			content.find('#slow-proxy').text(_('"Slow Proxy"'));

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
		vex.open({
			unsafeContent: content[0].outerHTML,
			showCloseButton: true,
			closeClassName: 'vex-close-m',
			escapeButtonCloses: true,
			overlayClosesOnClick: true,
			buttons: {},
			afterOpen: function() {
				this.contentEl.style.width = w + 'px';
				$('.vex-overlay').css({ 'pointer-events': 'none'});
			},
			beforeClose: function () {
				map.focus();
			}
		});
	},

	extractContent: function(html) {
		var parser = new DOMParser;
		return parser.parseFromString(html, 'text/html').documentElement.getElementsByTagName('body')[0].textContent;
	},

	makeURLFromStr: function(str) {
		if (!(str.toLowerCase().startsWith('http://') || str.toLowerCase().startsWith('https://'))) {
			str = 'http://' + str;
		}
		return str;
	},

	showHyperlinkDialog: function() {
		var map = this;
		var text = '';
		var link = '';
		if (this.hyperlinkUnderCursor && this.hyperlinkUnderCursor.text && this.hyperlinkUnderCursor.link) {
			text = this.hyperlinkUnderCursor.text;
			link = this.hyperlinkUnderCursor.link;
		} else if (this._clip && this._clip._selectionType == 'text') {
			if (map['stateChangeHandler'].getItemValue('.uno:Copy') === 'enabled') {
				text = this.extractContent(this._clip._selectionContent);
			}
		} else if (this._docLayer._selectedTextContent) {
			text = this.extractContent(this._docLayer._selectedTextContent);
		}

		vex.dialog.open({
			contentClassName: 'hyperlink-dialog vex-has-inputs',
			message: _('Insert hyperlink'),
			overlayClosesOnClick: false,
			input: [
				_('Text') + '<textarea name="text" id="hyperlink-text-box" style="resize: none" type="text"></textarea>',
				_('Link') + '<input name="link" id="hyperlink-link-box" type="text" value="' + link + '"/>'
			].join(''),
			buttons: [
				$.extend({}, vex.dialog.buttons.NO, { text: _('Cancel') }),
				$.extend({}, vex.dialog.buttons.YES, { text: _('OK') })
			],
			callback: function(data) {
				if (data && data.link != '') {
					var command = {
						'Hyperlink.Text': {
							type: 'string',
							value: data.text
						},
						'Hyperlink.URL': {
							type: 'string',
							value: map.makeURLFromStr(data.link)
						}
					};
					map.sendUnoCommand('.uno:SetHyperlink', command);
					map.focus();
				}
				else {
					map.focus();
				}
			},
			afterOpen: function() {
				setTimeout(function() {
					var textBox = document.getElementById('hyperlink-text-box');
					textBox.textContent = text ? text.trim() : '';
					if (textBox.textContent.trim() !== '') {
						document.getElementById('hyperlink-link-box').focus();
					}
					else {
						textBox.focus();
					}
				}, 0);
			}
		});
	},

	openRevisionHistory: function () {
		var map = this;
		// if we are being loaded inside an iframe, ask
		// our host to show revision history mode
		map.fire('postMessage', {msgId: 'rev-history', args: {Deprecated: true}});
		map.fire('postMessage', {msgId: 'UI_FileVersions'});
	},
	openShare: function () {
		var map = this;
		map.fire('postMessage', {msgId: 'UI_Share'});
	},
	openSaveAs: function () {
		var map = this;
		map.fire('postMessage', {msgId: 'UI_SaveAs'});
	},

	// map.dispatch() will be used to call some actions so we can share the code
	dispatch: function(action) {
		switch (action) {
		case 'acceptformula':
			{
				// focus on map, and press enter
				this.focus();
				this._docLayer.postKeyboardEvent('input',
					this.keyboard.keyCodes.enter,
					this.keyboard._toUNOKeyCode(this.keyboard.keyCodes.enter));

				if (window.mode.isMobile()) {
					w2ui['actionbar'].hide('acceptformula', 'cancelformula');
					w2ui['actionbar'].show('undo', 'redo');
				}
			}
			break;
		case 'cancelformula':
			{
				this.sendUnoCommand('.uno:Cancel');
				if (window.mode.isMobile()) {
					w2ui['actionbar'].hide('acceptformula', 'cancelformula');
					w2ui['actionbar'].show('undo', 'redo');
				}
			}
			break;
		}
	},
});
