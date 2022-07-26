/* -*- js-indent-level: 8; fill-column: 100 -*- */
/*
 * L.TextInput is the hidden textarea, which handles text input events
 *
 * This is made significantly more difficult than expected by such a
 * mess of browser, and mobile IME quirks that it is not possible to
 * follow events, but we have to re-construct input from a browser
 * text area itself.
 */

/* global app isAnyVexDialogActive */

L.TextInputDesktopIOS = L.Layer.extend({
	initialize: function() {
		// Flag to denote the composing state, derived from
		// compositionstart/compositionend events; unused
		this._isComposing = false;

		// If the last focus intended to accept user input.
		// Signifies whether the keyboard is meant to be visible.
		this._setAcceptInput(false);

		this._input = {
			// 預設使用 overTheSpot 模式
			_onTheSpot: false,
			// Might need to be \xa0 in some legacy browsers ?
			// fool GBoard into not auto-capitalizing constantly
			_preSpaceChar: '',
			useOnTheSpot: function() {
				this._onTheSpot = true;
				this._preSpaceChar = '\xa0';
			},
			useOverTheSpot: function() {
				this._onTheSpot = false;
				this._preSpaceChar = '';
			},
			// 兩種模式互相切換
			toggleMode: function() {this._onTheSpot = !this._onTheSpot;},
			// 是否為 On then spot 模式
			isOnTheSpot: function() {return this._onTheSpot === true;},
			// 是否為 Over the spot 模式
			isOverTheSpot: function() {return this._onTheSpot === false;},
			// 傳回編輯區前置字元
			preSpaceChar: function() {return this._preSpaceChar;},
		},

		// Debug flag, used in fancyLog(). See the debug() method.
		//this._isDebugOn = true;
		this._isDebugOn = false;

		this._initLayout();

		// Under-caret orange marker.
		this._cursorHandler = L.marker(new L.LatLng(0, 0), {
			icon: L.divIcon({
				className: 'leaflet-cursor-handler',
				iconSize: null
			}),
			draggable: true
		}).on('dragend', this._onCursorHandlerDragEnd, this);
	},

	onAdd: function() {
		if (this._container) {
			this.getPane().appendChild(this._container);
			this.update();
		}

		this._map.on('updatepermission', this._onPermission, this);
		this._map.on('commandresult', this._onCommandResult, this);
		L.DomEvent.on(this._textArea, 'focus blur', this._onFocusBlur, this);

		// Do not wait for a 'focus' event to attach events if the
		// textarea/contenteditable is already focused (due to the autofocus
		// HTML attribute, the browser focusing it on DOM creation, or whatever)
		if (document.activeElement === this._textArea) {
			this._onFocusBlur({ type: 'focus' });
		}

		if (window.ThisIsTheiOSApp) {
			var that = this;
			window.MagicToGetHWKeyboardWorking = function() {
				var that2 = that;
				window.MagicKeyDownHandler = function(e) {
					that2._onKeyDown(e);
				};
				window.MagicKeyUpHandler = function(e) {
					that2._onKeyUp(e);
				};
			};
			window.postMobileMessage('FOCUSIFHWKBD');
		}

		L.DomEvent.on(this._map.getContainer(), 'mousedown touchstart', this._abortComposition, this);
	},

	onRemove: function() {
		window.MagicToGetHWKeyboardWorking = null;
		window.MagicKeyDownHandler = null;
		window.MagicKeyUpHandler = null;

		if (this._container) {
			this.getPane().removeChild(this._container);
		}

		this._map.off('updatepermission', this._onPermission, this);
		this._map.off('commandresult', this._onCommandResult, this);
		L.DomEvent.off(this._textArea, 'focus blur', this._onFocusBlur, this);
		L.DomEvent.off(this._map.getContainer(), 'mousedown touchstart', this._abortComposition, this);

		this._map.removeLayer(this._cursorHandler);
	},

	disable: function () {
		this._textArea.setAttribute('disabled', true);
	},

	enable: function () {
		this._textArea.removeAttribute('disabled');
	},

	_onPermission: function(e) {
		if (e.perm === 'edit') {
			this._textArea.removeAttribute('disabled');
		} else {
			this._textArea.setAttribute('disabled', true);
		}
	},

	_onCommandResult: function(e) {
		if ((e.commandName === '.uno:Undo' || e.commandName === '.uno:Redo') && window.mode.isMobile()) {
			//undoing something on mobile does not trigger any input method
			//this causes problem in mobile working with suggestions
			//i.e: type "than" and then select "thank" from suggestion
			//now undo and then again select "thanks" from suggestions
			//final output is "thans"
			//this happens because undo doesn't change the textArea value
			//and no other way to maintain the history
			//So better to clean the textarea so no suggestions appear
			this._abortComposition();
		}
	},

	_onFocusBlur: function(ev) {
		var onoff = (ev.type == 'focus' ? L.DomEvent.on : L.DomEvent.off).bind(L.DomEvent);

		onoff(this._textArea, 'input', this._onInput, this);
		onoff(this._textArea, 'compositionstart', this._onCompositionStart, this);
		onoff(this._textArea, 'compositionupdate', this._onCompositionUpdate, this);
		onoff(this._textArea, 'compositionend', this._onCompositionEnd, this);
		onoff(this._textArea, 'keydown', this._onKeyDown, this);
		onoff(this._textArea, 'keyup', this._onKeyUp, this);
		onoff(this._textArea, 'copy cut paste', this._map._handleDOMEvent, this._map);

		this._map.notifyActive();

		if (ev.type === 'blur' && this._isComposing) {
			this._abortComposition(ev);
		}
	},

	// Focus the textarea/contenteditable
	// @acceptInput (only on "mobile" (= mobile phone) or on iOS and Android in general) true if we want to
	// accept key input, and show the virtual keyboard.
	focus: function(acceptInput) {
		if (isAnyVexDialogActive())
			return;
		// window.app.console.trace('L.TextInput.focus(' + acceptInput + ')');

		// Note that the acceptInput parameter intentionally
		// is a tri-state boolean: undefined, false, or true.

		// Clicking or otherwise focusing the map should focus on the clipboard
		// container in order for the user to input text (and on-screen keyboards
		// to pop-up), unless the document is read only.
		if (!this._map.isPermissionEdit()) {
			this._setAcceptInput(false);
			// on clicking focus is important
			// specially in chrome once document loses focus it never gets it back
			// which causes shortcuts to stop working (i.e: print, search etc...)
			this._map.getContainer().focus();
			return;
		}

		// Trick to avoid showing the software keyboard: Set the textarea
		// read-only before focus() and reset it again after the blur()
		if (!window.ThisIsTheiOSApp && navigator.platform !== 'iPhone' && !window.mode.isChromebook()) {
			if ((window.ThisIsAMobileApp || window.mode.isMobile()) && acceptInput !== true)
				this._textArea.setAttribute('readonly', true);
		}

		if (!window.ThisIsTheiOSApp && navigator.platform !== 'iPhone') {
			this._textArea.focus();
		} else if (acceptInput === true) {
			// On the iPhone, only call the textarea's focus() when we get an explicit
			// true parameter. On the other hand, never call the textarea's blur().

			// Calling blur() leads to so confusing behaviour with the keyboard not
			// showing up when we want. Better to have it show up a bit too long that
			// strictly needed.

			// Probably whether the calls to the textarea's focus() and blur() functions
			// actually do anything or not might depend on whether the call stack
			// originates in a user input event handler or not, for security reasons.

			// To investigate, uncomment the call to window.app.console.trace() at the start of
			// this function, and check when the topmost slot in the stack trace is
			// "(anonymous function)" in hammer.js (an event handler), and when it is
			// _onMessage (the WebSocket message handler in Socket.js).
			this._textArea.focus();
		}

		if (!window.ThisIsTheiOSApp && navigator.platform !== 'iPhone' && !window.mode.isChromebook()) {
			if ((window.ThisIsAMobileApp || window.mode.isMobile()) && acceptInput !== true) {
				this._setAcceptInput(false);
				this._textArea.blur();
				this._textArea.removeAttribute('readonly');
			} else {
				this._setAcceptInput(true);
			}
		} else if (acceptInput !== false) {
			this._setAcceptInput(true);
		} else {
			this._setAcceptInput(false);
		}
	},

	blur: function() {
		this._setAcceptInput(false);
		if (!window.ThisIsTheiOSApp && navigator.platform !== 'iPhone' && !window.mode.isChromebook())
			this._textArea.blur();
	},

	// Returns true if the last focus was to accept input.
	// Used to restore the keyboard.
	canAcceptKeyboardInput: function() {
		return this._acceptInput;
	},

	// Marks the content of the textarea/contenteditable as selected,
	// for system clipboard interaction.
	select: function() {
		this._textArea.select();
	},

	update: function() {
		if (this._container && this._map && this._latlng) {
			var position = this._map.latLngToLayerPoint(this._latlng).round();
			this._setPos(position);
		}
	},

	_initLayout: function() {
		this._container = L.DomUtil.create('div', 'clipboard-container');
		this._container.id = 'doc-clipboard-container';

		// The textarea allows the keyboard to pop up and so on.
		// Note that the contents of the textarea are NOT deleted on each composed
		// word, in order to make
		this._textArea = L.DomUtil.create('textarea', 'clipboard', this._container);
		this._textArea.id = 'clipboard-area';
		this._textArea.setAttribute('autocapitalize', 'off');
		this._textArea.setAttribute('autofocus', 'true');
		this._textArea.setAttribute('autocorrect', 'off');
		this._textArea.setAttribute('autocomplete', 'off');
		this._textArea.setAttribute('spellcheck', 'false');

		// Prevent automatic line breaks in the textarea. Without this,
		// chromium/blink will trigger input/insertLineBreak events by
		// just adding whitespace.
		// See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea#attr-wrap
		this._textArea.setAttribute('wrap', 'off');

		// Prevent autofocus
		this._textArea.setAttribute('disabled', true);

		this._emptyArea();

		// 多做一個無作用的隱形輸入區
		this._wrapArea = L.DomUtil.create('textarea', '', this._container);
		this._wrapArea.tabIndex = -1;
		this._wrapArea.style.display = 'none';
	},

	debug: function(debugOn) {
		this._isDebugOn = !!debugOn;
	},

	activeElement: function() {
		return this._textArea;
	},

	// Displays the caret and the under-caret marker.
	// Fetches the coordinates of the caret from the map's doclayer.
	showCursor: function() {
		if (!this._map._docLayer._cursorMarker) {
			return;
		}

		// Fetch top and bottom coords of caret
		var top = this._map._docLayer._visibleCursor.getNorthWest();
		var bottom = this._map._docLayer._visibleCursor.getSouthWest();

		if (!this._map._docLayer._cursorMarker.isDomAttached()) {
			// Display caret
			this._map._docLayer._cursorMarker.add();
		}
		this._map._docLayer._cursorMarker.setMouseCursor();

		// Move and display under-caret marker
		if (L.Browser.touch) {
			if (this._map._docLayer._textCSelections.empty()) {
				this._cursorHandler.setLatLng(bottom).addTo(this._map);
			} else {
				this._map.removeLayer(this._cursorHandler);
			}
		}

		// Move the hidden text area with the cursor
		this._latlng = L.latLng(top);
		this.update();
		// shape handlers hidden (if selected)
		this._map.fire('handlerstatus', {hidden: true});
		if (window.mode.isMobile() && this._map._docLoaded && this._map.getDocType() === 'spreadsheet')
			this._map.onFormulaBarFocus();
	},

	// Hides the caret and the under-caret marker.
	hideCursor: function() {
		if (!this._map._docLayer._cursorMarker) {
			return;
		}
		if (this._map._docLayer._cursorMarker.isDomAttached())
			this._map._docLayer._cursorMarker.remove();
		this._map.removeLayer(this._cursorHandler);
		// shape handlers visible again (if selected)
		this._map.fire('handlerstatus', {hidden: false});
	},

	_setPos: function(pos) {
		L.DomUtil.setPosition(this._container, pos);
	},

	// Fired when text has been inputed, *during* and after composing/spellchecking
	_onInput: function(ev) {
		if (this._map.uiManager.isUIBlocked()) {
			return;
		}

		this._map.notifyActive();

		// 插入文字
		if (ev.inputType === 'insertText') {
			this._sendText(ev.data); // 送出文字
		} else if (ev.inputType === 'insertCompositionText') {
			if (this._input.isOnTheSpot()) {
				if (ev.data) {
					this._sendText(ev.data, 'input');
				}
			} else {
				this._textArea.style.width = (ev.data.length * 16) + 'px';
				this._textArea.style.height = parseInt(this._textArea.scrollHeight) + 'px';
			}
		} else {
			window.app.console.debug('Unknown input type :', ev.inputType);
		}

		if (!this._isComposing) {
			this._emptyArea(); // 清除輸入區資料
		}
	},

	// Sends the given (UTF-8) string of text to oxoolwsd, as IME (text composition)
	// messages
	_sendText: function(text, type) {
		var inputType = type !== undefined ? ' type=' + type : '';

		app.socket.sendMessage(
			'textinput id=' + this._map.getWinId() +
			inputType +
			' text=' + encodeURIComponent(text)
		);
	},

	// Empties the textarea / contenteditable element.
	// If the browser supports the 'inputType' property on 'input' events, then
	// add empty spaces to the textarea / contenteditable, in order to
	// always catch deleteContentBackward/deleteContentForward input events
	// (some combination of browser + input method don't fire those on an
	// empty contenteditable).
	_emptyArea: function() {
		this._textArea.value = this._input.preSpaceChar(); // 避免某些瀏覽器(如 firefox)，把第一個英文字轉大寫
		this._setCursorPosition(this._textArea.value.length); // 移動 textarea 編輯游標
	},

	/**
	 * 開始組字輸入
	 */
	_onCompositionStart: function(/*ev*/) {
		if (this._input.isOnTheSpot()) {
			this._isComposing = true;
			return;
		}

		// 取得使用者 info
		var viewInfo = this._map._viewInfo[this._map._docLayer._viewId];
		// 設定組字區背景顏色
		if (viewInfo) {
			this._container.style.background = L.LOUtil.rgbToHex(viewInfo.color);
		}
		// 閃動游標
		var cursorMarker = this._map._docLayer._cursorMarker;
		// 有閃動游標，且游標顯示，可以啟動組字
		if (cursorMarker && cursorMarker.visible) {
			this._isComposing = true;
		// 如果是編輯試算表文件
		} else if (this._map.editorHasFocus() && this._map.getDocType() === 'spreadsheet') {
			// 移動隱藏游標到儲存格開頭
			this._latlng = L.latLng(this._map._docLayer._cellCursor.getNorthWest());
			this.update();
			this._isComposing = true;
		}

		if (this._isComposing) {
			// 將組字輸入區設為可見
			L.DomUtil.addClass(this._textArea, 'overspot');
			L.DomUtil.addClass(this._container, 'overspot');
			if (cursorMarker) {
				var cursor = cursorMarker.cursor;
				// 預設在游標下方，避免擋住同一行
				var cursorHeight = cursor.clientHeight;
				// 如果非桌面模式，輸入區移到游標上方，避免被游標水滴柄擋住
				if (!window.mode.isDesktop()) {
					cursorHeight *= -1;
				}

				this._container.style.top = (cursor.offsetTop + cursorHeight) + 'px';
			}
		}
	},

	/**
	 * 更新組字資料
	 * @param {object} ev - envnt
	 */
	_onCompositionUpdate: function(/*ev*/) {
		/**
		 * Do nothing.
		 * Handle in onInput()
		 */
	},

	/**
	 * 組字結束
	 * @param {object} ev - envnt
	 */
	_onCompositionEnd: function(ev) {
		this._map.notifyActive();
		this._isComposing = false;
		if (this._input.isOnTheSpot()) {
			this._sendText(ev.data, 'end');
		} else {
			this._hideCompositionBox(); // 隱藏組字視窗
			this._sendText(ev.data); // 送出所有組字
		}

		if (ev.data === '切換輸入模式') {
			this._input.toggleMode();
		}

		// 清除輸入區資料
		this._emptyArea();
	},

	// Called when the user goes back to a word to spellcheck or replace it,
	// on a timeout.
	// Very difficult to handle right now, so the strategy is to panic and
	// empty the text area.
	_abortComposition: function() {
		if (this._isComposing) {
			this._isComposing = false;
			// 組字視窗模式，就隱藏組字視窗
			if (this._input.isOverTheSpot()) {
				this._hideCompositionBox();
			}
			this._sendText(''); // 清除輸入
		}
		this._emptyArea();
	},

	// 隱藏組字視窗
	_hideCompositionBox: function() {
		L.DomUtil.removeClass(this._textArea, 'overspot');
		L.DomUtil.removeClass(this._container, 'overspot');
	},

	_onKeyDown: function(ev) {
		if (this._isComposing || this._map.uiManager.isUIBlocked())
			return;

		var oneKey = !ev.shiftKey && !ev.ctrlKey && !ev.altKey && !ev.metaKey;
		if (oneKey) {
			switch (ev.keyCode) {
			case  8: // Backspace
			case 46: // Delete
			case 13: // Enter
				var unoKeyCode = this._map['keyboard']._toUNOKeyCode(ev.keyCode);
				this._sendKeyEvent(ev.charCode, unoKeyCode);
				break;
			}
		}
	},

	// Check arrow keys on 'keyup' event; using 'ArrowLeft' or 'ArrowRight'
	// shall empty the textarea, to prevent FFX/Gecko from ever not having
	// whitespace around the caret.
	// Across browsers, arrow up/down / home / end would move the caret to
	// the beginning/end of the textarea/contenteditable.
	_onKeyUp: function(/* ev */) {
		if (this._isComposing || this._map.uiManager.isUIBlocked())
			return;

		this._map.notifyActive();
	},

	// Tiny helper - encapsulates sending a 'key' or 'windowkey' websocket message
	// "type" can be "input" (default) or "up"
	_sendKeyEvent: function(charCode, unoKeyCode, type) {
		if (!type) {
			type = 'input';
		}
		if (this._map.editorHasFocus()) {
			app.socket.sendMessage(
				'key type=' + type + ' char=' + charCode + ' key=' + unoKeyCode + '\n'
			);
		} else {
			app.socket.sendMessage(
				'windowkey id=' +
					this._map.getWinId() +
					' type=' +
					type +
					' char=' +
					charCode +
					' key=' +
					unoKeyCode +
					'\n'
			);
		}
	},

	_onCursorHandlerDragEnd: function(ev) {
		var cursorPos = this._map._docLayer._latLngToTwips(ev.target.getLatLng());
		this._map._docLayer._postMouseEvent('buttondown', cursorPos.x, cursorPos.y, 1, 1, 0);
		this._map._docLayer._postMouseEvent('buttonup', cursorPos.x, cursorPos.y, 1, 1, 0);
	},

	_getCursorPosition: function() {
		return {
			selectionStart: this._textArea.selectionStart,
			selectionEnd: this._textArea.selectionEnd,
			selectionDirection: this._textArea.selectionDirection
		};
		/* return (this._textArea.selectionStart === this._textArea.selectionEnd)
			? this._textArea.selectionEnd : -1; */
	},

	_setCursorPosition: function(pos) {
		try {
			this._textArea.setSelectionRange(pos, pos);
		} catch (err) {
			// old firefox throws an exception on start.
		}
	},

	_setAcceptInput: function(accept) {
		if (L.Browser.cypressTest && this._textArea) {
			// This is used to track whether we *intended*
			// the keyboard to be visible or hidden.
			// There is no way track the keyboard state
			// programmatically, so the next best thing
			// is to track what we intended to do.
			this._textArea.setAttribute('data-accept-input', accept);
		}
		this._acceptInput = accept;
	}
});

L.textInputDesktopIOS = function() {
	return new L.TextInputDesktopIOS();
};
