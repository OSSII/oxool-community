/* -*- js-indent-level: 8 -*- */
/*
 * L.Control.UIManager - initializes the UI elements like toolbars, menubar or ruler
			 and allows to controll them (show/hide)
 */

/* global app $ setupToolbar w2ui toolbarUpMobileItems _ Hammer */
L.Control.UIManager = L.Control.extend({
	mobileWizard: null,
	blockedUI: false,
	busyPopupTimer: null,

	onAdd: function (map) {
		this.map = map;
		this.notebookbar = null;
		// Every time the UI mode changes from 'classic' to 'notebookbar'
		// the two below elements will be destroyed.
		// Here we save the original state of the elements, as provided
		// by server, in order to apply to them the same initialization
		// code when activating the 'classic' mode as if the elements are
		// initialized for the first time since the start of the application.
		// It is important to use the same initial structure provided by server
		// in order to keep a single place (server) of initial properties setting.
		this.map.toolbarUpTemplate = $('#toolbar-up')[0].cloneNode(true);
		this.map.mainMenuTemplate = $('#main-menu')[0].cloneNode(true);

		map.on('updatepermission', this.onUpdatePermission, this);

		if (window.mode.isMobile()) {
			window.addEventListener('popstate', this.onGoBack.bind(this));

			// provide entries in the history we can catch to close the app
			history.pushState({context: 'app-started'}, 'app-started');
			history.pushState({context: 'app-started'}, 'app-started');
		}

		map.on('blockUI', this.blockUI, this);
		map.on('unblockUI', this.unblockUI, this);
	},

	// UI initialization

	initializeBasicUI: function() {
		var enableNotebookbar = false;
		setupToolbar(this.map); // 工具列優先設定
		var that = this;

		if (window.mode.isMobile() || !enableNotebookbar) {
			var menubar = L.control.menubar();
			this.map.menubar = menubar;
			this.map.addControl(menubar);
		}

		if (window.mode.isMobile()) {
			$('#toolbar-mobile-back').on('click', function() {
				that.enterReadonlyOrClose();
			});
		}

		if (!window.mode.isMobile()) {
			this.map.topToolbar = L.control.topToolbar();
			this.map.addControl(this.map.topToolbar);

			this.map.addControl(L.control.signingBar());
			this.map.addControl(L.control.statusBar());

			this.map.jsdialog = L.control.jsDialog();
			this.map.addControl(this.map.jsdialog);

			this.map.addControl(L.control.mobileWizardPopup());
		}

		this.map.addControl(L.control.documentNameInput());
		this.map.addControl(L.control.alertDialog());
		this.mobileWizard = L.control.mobileWizard();
		this.map.addControl(this.mobileWizard);
		this.map.addControl(L.control.autofilterDropdown());
		this.map.addControl(L.control.languageDialog());
		this.map.dialog = L.control.lokDialog();
		this.map.addControl(this.map.dialog);
		this.map.addControl(L.control.contextMenu());
		this.map.addControl(L.control.infobar());
		this.map.addControl(L.control.userList());
		this.map.addControl(L.control.dialogs());

		var openBusyPopup = function(label) {
			this.busyPopupTimer = setTimeout(function() {
				var json = {
					id: 'busypopup',
					jsontype: 'dialog',
					type: 'modalpopup',
					children: [
						{
							id: 'busycontainer',
							type: 'container',
							vertical: 'true',
							children: [
								{id: 'busyspinner', type: 'spinnerimg'},
								{id: 'busylabel', type: 'fixedtext', text: label}
							]
						}
					]
				};
				if (app.socket)
					app.socket._onMessage({textMsg: 'jsdialog: ' + JSON.stringify(json)});
			}, 300);
		};

		var fadeoutBusyPopup = function() {
			clearTimeout(this.busyPopupTimer);
			var json = {
				id: 'busypopup',
				jsontype: 'dialog',
				type: 'modalpopup',
				action: 'fadeout'
			};
			if (app.socket)
				app.socket._onMessage({textMsg: 'jsdialog: ' + JSON.stringify(json)});
		};

		this.map.on('showbusy', function(e) {
			fadeoutBusyPopup();
			openBusyPopup(e.label);
		});

		this.map.on('hidebusy', function() {
			fadeoutBusyPopup();
		});
	},

	initializeSpecializedUI: function(docType) {
		var isDesktop = window.mode.isDesktop();

		document.body.setAttribute('data-userInterfaceMode', 'classic');

		if (window.mode.isMobile()) {
			$('#mobile-edit-button').show();
			this.map.addControl(L.control.mobileBottomBar(docType));
			this.map.addControl(L.control.mobileTopBar(docType));
			this.map.addControl(L.control.searchBar());
		}

		// 預設文件代表色是文字文件
		var docIdentifyColor = '#2b579a';
		if (docType === 'spreadsheet') {
			docIdentifyColor = '#217346';

			this.map.addControl(L.control.sheetsBar({shownavigation: isDesktop || window.mode.isTablet()}));
			this.map.addControl(L.control.formulaBar());

			// remove unused elements
			L.DomUtil.remove(L.DomUtil.get('presentation-controls-wrapper'));
			document.getElementById('selectbackground').parentNode.removeChild(document.getElementById('selectbackground'));
		}

		if (this.map.isPresentationOrDrawing()) {
			if (docType === 'drawing') {
				docIdentifyColor = '#876900';
			} else {
				docIdentifyColor = '#bc472a';
			}
			// remove unused elements
			L.DomUtil.remove(L.DomUtil.get('spreadsheet-toolbar'));
			$('#presentation-controls-wrapper').show();
		}

		if (docType === 'text') {
			// remove unused elements
			L.DomUtil.remove(L.DomUtil.get('spreadsheet-toolbar'));
			L.DomUtil.remove(L.DomUtil.get('presentation-controls-wrapper'));
			document.getElementById('selectbackground').parentNode.removeChild(document.getElementById('selectbackground'));

			if ((window.mode.isTablet() || window.mode.isDesktop()) && this.map.canUserWrite()) {
				var showRuler = this.getSavedStateOrDefault('ShowRuler');
				var interactiveRuler = this.map.isEditMode();
				var isRTL = document.documentElement.dir === 'rtl';
				L.control.ruler({position: (isRTL ? 'topright' : 'topleft'), interactive:interactiveRuler, showruler: showRuler}).addTo(this.map);
				this.map.fire('rulerchanged');
			}

			var showResolved = this.getSavedStateOrDefault('ShowResolved');
			if (showResolved === false || showResolved === 'false')
				this.map.sendUnoCommand('.uno:ShowResolvedAnnotations');
		}
		// 設定文件類別代表色
		document.documentElement.style.setProperty('--doc-identify-color', docIdentifyColor);

		if (this.map.isPresentationOrDrawing() && (isDesktop || window.mode.isTablet())) {
			this.map.addControl(L.control.presentationBar());
		}

		if (window.mode.isMobile() || (window.mode.isTablet())) {
			this.map.on('updatetoolbarcommandvalues', function() {
				w2ui['editbar'].refresh();
			});
		}

	},

	initializeSidebar: function() {
		// Hide the sidebar on start if saved state or UIDefault is set.
		if (window.mode.isDesktop() && !window.ThisIsAMobileApp) {
			var showSidebar = this.getSavedStateOrDefault('ShowSidebar');

			if (showSidebar === false)
				app.socket.sendMessage('uno .uno:SidebarHide');
		}
		else if (window.mode.isChromebook()) {
			// HACK - currently the sidebar shows when loaded,
			// with the exception of mobile phones & tablets - but
			// there, it does not show only because they start
			// with read/only mode which hits an early exit in
			// _launchSidebar() in Control.LokDialog.js
			// So for the moment, let's just hide it on
			// Chromebooks early
			app.socket.sendMessage('uno .uno:SidebarHide');
		}
	},

	removeClassicUI: function() {
		if (this.map.menubar)
		{
			this.map.removeControl(this.map.menubar);
			this.map.menubar = null;
		}
		if (this.map.topToolbar)
		{
			this.map.removeControl(this.map.topToolbar);
			this.map.topToolbar = null;
		}
	},

	addClassicUI: function() {
		this.map.menubar = L.control.menubar();
		this.map.addControl(this.map.menubar);
		this.map.topToolbar = L.control.topToolbar();
		this.map.addControl(this.map.topToolbar);

		this.map.menubar._onDocLayerInit();
		this.map.topToolbar.onDocLayerInit();
		this.map.sendInitUNOCommands();
		this.map._docLayer._resetClientVisArea();
		this.map._docLayer._requestNewTiles();

		this.map.topToolbar.updateControlsState();
	},

	// UI modification

	insertButtonToClassicToolbar: function(button) {
		if (!w2ui['editbar'].get(button.id)) {
			if (this.map.isEditMode()) {
				// add the css rule for the image
				var style = $('html > head > style');
				if (style.length == 0)
					$('html > head').append('<style/>');
				$('html > head > style').append('.w2ui-icon.' + button.id + '{background: url(' + button.imgurl + ') no-repeat center !important; }');

				// Position: Either specified by the caller, or defaulting to first position (before save)
				var insertBefore = button.insertBefore || 'save';
				// add the item to the toolbar
				w2ui['editbar'].insert(insertBefore, [
					{
						type: 'button',
						uno: button.unoCommand,
						id: button.id,
						img: button.id,
						hint: _(button.hint), /* "Try" to localize ! */
						/* Notify the host back when button is clicked (only when unoCommand is not set) */
						postmessage: !Object.prototype.hasOwnProperty.call(button, 'unoCommand')
					}
				]);
				if (button.mobile)
				{
					// Add to our list of items to preserve when in mobile mode
					// FIXME: Wrap the toolbar in a class so that we don't make use
					// global variables and functions like this
					var idx = toolbarUpMobileItems.indexOf(insertBefore);
					toolbarUpMobileItems.splice(idx, 0, button.id);
				}
			}
			else if (this.map.isReadOnlyMode()) {
				// Just add a menu entry for it
				this.map.fire('addmenu', {id: button.id, label: button.hint});
			}
		}
	},

	insertButton: function(button) {
		this.insertButtonToClassicToolbar(button);
	},

	showButtonInClassicToolbar: function(buttonId, show) {
		var toolbars = [w2ui['toolbar-up'], w2ui['actionbar'], w2ui['editbar']];
		var found = false;

		toolbars.forEach(function(toolbar) {
			if (toolbar && toolbar.get(buttonId)) {
				found = true;
				if (show) {
					toolbar.show(buttonId);
				} else {
					toolbar.hide(buttonId);
				}
			}
		});

		if (!found) {
			window.app.console.error('Toolbar button with id "' + buttonId + '" not found.');
			return;
		}
	},

	showButton: function(buttonId, show) {
		this.showButtonInClassicToolbar(buttonId, show);
	},

	// Menubar

	showMenubar: function() {
		if (!this.isMenubarHidden())
			return;
		$('.main-nav').show();
		// 有設定啟用關閉按鈕，且非手機模式，就顯示關閉按鈕
		if (L.Params.closeButtonEnabled && !window.mode.isMobile()) {
			$('#closebuttonwrapper').show();
		}

		var obj = $('.unfold');
		obj.removeClass('w2ui-icon unfold');
		obj.addClass('w2ui-icon fold');
	},

	hideMenubar: function() {
		if (this.isMenubarHidden())
			return;
		$('.main-nav').hide();
		if (L.Params.closeButtonEnabled) {
			$('#closebuttonwrapper').hide();
		}

		var obj = $('.fold');
		obj.removeClass('w2ui-icon fold');
		obj.addClass('w2ui-icon unfold');
	},

	isMenubarHidden: function() {
		return $('.main-nav').css('display') === 'none';
	},

	toggleMenubar: function() {
		if (this.isMenubarHidden())
			this.showMenubar();
		else
			this.hideMenubar();
	},

	// Ruler

	showRuler: function() {
		$('.oxool-ruler').show();
		$('#map').addClass('hasruler');
		this.setSavedState('ShowRuler', true);
		this.map.fire('rulerchanged');
	},

	hideRuler: function() {
		$('.oxool-ruler').hide();
		$('#map').removeClass('hasruler');
		this.setSavedState('ShowRuler', false);
		this.map.fire('rulerchanged');
	},

	toggleRuler: function() {
		if (this.isRulerVisible())
			this.hideRuler();
		else
			this.showRuler();
	},

	isRulerVisible: function() {
		return $('.oxool-ruler').is(':visible');
	},

	isFullscreen: function() {
		if (!document.fullscreenElement &&
			!document.mozFullscreenElement &&
			!document.msFullscreenElement &&
			!document.webkitFullscreenElement)
			return false;
		else
			return true;
	},

	// UI Defaults functions

	showStatusBar: function() {
		$('#document-container').css('bottom', this.documentBottom);
		$('#toolbar-down').show();
		this.setSavedState('ShowStatusbar', true);
		this.map.fire('statusbarchanged');
	},

	hideStatusBar: function(firstStart) {
		if (!firstStart && !this.isStatusBarVisible())
			return;

		this.documentBottom = $('#document-container').css('bottom');
		$('#document-container').css('bottom', '0px');
		$('#toolbar-down').hide();
		if (!firstStart)
			this.setSavedState('ShowStatusbar', false);
		this.map.fire('statusbarchanged');
	},

	toggleStatusBar: function() {
		if (this.isStatusBarVisible())
			this.hideStatusBar();
		else
			this.showStatusBar();
	},

	isStatusBarVisible: function() {
		return $('#toolbar-down').is(':visible');
	},

	// Event handlers

	onUpdatePermission: function(e) {
		if (window.mode.isMobile()) {
			if (e.perm === 'edit') {
				history.pushState({context: 'app-started'}, 'edit-mode');
				$('#toolbar-down').show();
			}
			else {
				history.pushState({context: 'app-started'}, 'readonly-mode');
				$('#toolbar-down').hide();
			}
		}

		// We've resized the document container.
		this.map.invalidateSize();
	},

	enterReadonlyOrClose: function() {
		if (this.map.isEditMode()) {
			// in edit mode, passing 'edit' actually enters readonly mode
			// and bring the blue circle editmode button back
			this.map.setPermission('edit');
			var toolbar = w2ui['actionbar'];
			if (toolbar) {
				toolbar.uncheck('closemobile');
				toolbar.uncheck('close');
			}
		} else {
			window.onClose();
		}
	},

	onGoBack: function(popStateEvent) {
		if (popStateEvent.state && popStateEvent.state.context) {
			if (popStateEvent.state.context === 'mobile-wizard' && this.mobileWizard) {
				if (this.mobileWizard.isOpen()) {
					this.mobileWizard.goLevelUp(true);
				} else {
					this.enterReadonlyOrClose();
				}
			} else if (popStateEvent.state.context === 'app-started') {
				this.enterReadonlyOrClose();
			}
		}
	},

	// Blocking UI

	isUIBlocked: function() {
		return this.blockedUI;
	},

	blockUI: function(event) {
		this.blockedUI = true;
		this.map.fire('showbusy', {label: event ? event.message : null});
	},

	unblockUI: function() {
		this.blockedUI = false;
		this.map.fire('hidebusy');
	},

	// Snack bar

	showSnackbar: function(label, action, callback) {
		if (!app.socket)
			return;

		var closeJson = {
			id: 'snackbar',
			jsontype: 'dialog',
			type: 'snackbar',
			action: 'fadeout'
		};

		app.socket._onMessage({textMsg: 'jsdialog: ' + JSON.stringify(closeJson)});

		var json = {
			id: 'snackbar',
			jsontype: 'dialog',
			type: 'snackbar',
			children: [
				{
					type: 'container',
					children: [
						action ? {id: 'label', type: 'fixedtext', text: label} : {id: 'label-no-action', type: 'fixedtext', text: label},
						action ? {id: 'button', type: 'pushbutton', text: action} : {}
					]
				}
			]
		};

		var builderCallback = function(objectType, eventType, object, data) {
			window.app.console.debug('control: \'' + objectType + '\' id:\'' + object.id + '\' event: \'' + eventType + '\' state: \'' + data + '\'');

			if (object.id === 'button' && objectType === 'pushbutton' && eventType === 'click') {
				if (callback)
					callback();
			}
		};

		app.socket._onMessage({textMsg: 'jsdialog: ' + JSON.stringify(json), callback: builderCallback});
	},

	// Helper functions

	moveObjectVertically: function(obj, diff) {
		if (obj) {
			var prevTop = obj.css('top');
			if (prevTop) {
				prevTop = parseInt(prevTop.slice(0, -2)) + diff;
			}
			else {
				prevTop = 0 + diff;
			}
			obj.css({'top': String(prevTop) + 'px'});
		}
	},

	setSavedState: function(name, state) {
		var docType = (name === 'CompactMode') ? null : this.map.getDocType();
		if (window.isLocalStorageAllowed)
			localStorage.setItem('UIDefaults_' + docType + '_' + name, state);
	},

	getSavedStateOrDefault: function(name, forcedDefault) {
		var retval = forcedDefault !== undefined ? forcedDefault : true;
		// we request CompactMode very early, no info about doctype so unify all the calls
		var docType = (name === 'CompactMode') ? null : this.map.getDocType();
		var state = null;
		if (window.isLocalStorageAllowed)
			state = localStorage.getItem('UIDefaults_' + docType + '_' + name);
		switch (state) {
		case 'true':
			return true;
		case 'false':
			return false;
		default:
			// no saved state; must check the UIDefaults
			if (window.uiDefaults && window.uiDefaults[docType])
				retval = window.uiDefaults[docType][name];

			if (retval === undefined || retval === null) {
				if (forcedDefault !== undefined)
					return forcedDefault;
				else
					return true;
			} else
				return retval;
		}
	},

	enableTooltip: function(element) {
		var elem = $(element);
		if (window.mode.isDesktop()) {
			elem.tooltip();
			elem.click(function() {
				$('.ui-tooltip').fadeOut(function() {
					$(this).remove();
				});
			});
		}
		else {
			elem.tooltip({disabled: true});
			(new Hammer(elem.get(0), {recognizers: [[Hammer.Press]]}))
				.on('press', function () {
					elem.tooltip('enable');
					elem.tooltip('open');
					document.addEventListener('touchstart', function closeTooltip () {
						elem.tooltip('close');
						elem.tooltip('disable');
						document.removeEventListener('touchstart', closeTooltip);
					});
				}.bind(this));

		}
	}
});

L.control.uiManager = function () {
	return new L.Control.UIManager();
};
