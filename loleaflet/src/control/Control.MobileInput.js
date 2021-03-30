/* -*- js-indent-level: 8 -*- */
/*
 * L.Control.MobileInput.
 */
L.Control.MobileInput = L.Control.extend({
	options: {
		position: 'topleft'
	},

	initialize: function (options) {
		L.setOptions(this, options);
		this._cursorHandler = L.marker(new L.LatLng(0, 0), {
			icon: L.divIcon({
				className: 'leaflet-cursor-handler',
				iconSize: null
			}),
			draggable: true
		});

		this._cursorHandler.on('dragend', this.onDragEnd, this);
	},

	onAdd: function(map) {
		this._initLayout();

		map.on('doclayerinit', function() {
			this.hideCursor(); // 隱藏鍵盤
			this.lockVirtualKeyboard((map.getDocType() === 'text')); // 文字文件的話，要鎖住鍵盤
		}, this);

		// Dirty hacked by Firefly <firefly@ossii.com.tw>
		// 觸控設備視窗 size 改變，是因為螢幕鍵盤升起或落下
		// e.newSize.y < e.oldSize.y 表示高度縮小→鍵盤升起，否則就是落下
		map.on('resize', function(e) {
			if (this._readOnly !== true &&
				this._map._permission === 'edit' &&
				e.newSize.y < e.oldSize.y) {
				this._map._docLayer._isCursorVisible = true;
				this._map._docLayer._onUpdateCursor();
			}
		}, this);
		return this._container;
	},

	onDragEnd: function () {
		var mousePos = this._map._docLayer._latLngToTwips(this._cursorHandler.getLatLng());
		this._map._docLayer._postMouseEvent('buttondown', mousePos.x, mousePos.y, 1, 1, 0);
		this._map._docLayer._postMouseEvent('buttonup', mousePos.x, mousePos.y, 1, 1, 0);
	},

	onGotFocus: function () {
		var map = this._map;
		var docLayer = map._docLayer;
		if (docLayer && docLayer._cursorMarker) {
			this._cursorHandler.setLatLng(docLayer._visibleCursor.getSouthWest());
			map.addLayer(docLayer._cursorMarker);
			if (docLayer._selections.getLayers().length === 0) {
				map.addLayer(this._cursorHandler);
			} else {
				map.removeLayer(this._cursorHandler);
			}
		}
	},

	onLostFocus: function () {
		if (this._map._docLayer && this._map._docLayer._cursorMarker) {
			this._textArea.value = '';
			this._map.removeLayer(this._map._docLayer._cursorMarker);
			this._map.removeLayer(this._cursorHandler);
		}
	},

	focus: function(/*focus*/) {
		if (this._map._permission !== 'edit' || this._lockKeyboard ||
			!this._map._docLayer._isCursorVisible || this._readOnly) {
			this._textArea.blur();
		} else {
			this._textArea.focus();
		}
	},

	select: function() {
		this._textArea.select();
	},

	getValue: function() {
		return this._textArea.value;
	},

	setValue: function(val) {
		this._textArea.value = val;
	},

	setLatLng: function(latlng) {
		this._latlng = L.latLng(latlng);
		this.update();
	},

	update: function() {
		if (this._container && this._map && this._latlng) {
			var position = this._map.latLngToLayerPoint(this._latlng).round();
			this._setPos(position);
		}
	},

	activeElement: function () {
		return this._textArea;
	},

	showCursor: function () {
		if (this._textArea === document.activeElement) {
			this.onGotFocus();
		}
		this._enableVirtualKeyboard();
	},

	hideCursor: function () {
		this.onLostFocus();
		this._disableVirtualKeyboard();
	},

	_setPos: function(pos) {
		L.DomUtil.setPosition(this._container, pos);
	},

	// Add by Firefly <firefly@ossii.com.tw>
	lockVirtualKeyboard: function (onOff) {
		this._lockKeyboard = (onOff === true);
		this.focus();
	},

	_disableVirtualKeyboard: function () {
		this._readOnly = true;
		this.focus();
	},

	_enableVirtualKeyboard: function () {
		this._readOnly = false;
		this.focus();
	},

	_initLayout: function () {
		var constOff = 'off',
		stopEvents = 'touchstart touchmove touchend mousedown mousemove mouseout mouseover mouseup mousewheel click scroll',
		container = this._container = L.DomUtil.create('div', 'loleaflet-mobile-container');
		this._iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
		this._textArea = L.DomUtil.create('input', 'loleaflet-mobile-input', container);
		this._textArea.setAttribute('type', 'text');
		this._textArea.setAttribute('autocorrect', constOff);
		this._textArea.setAttribute('autocapitalize', constOff);
		this._textArea.setAttribute('autocomplete', constOff);
		this._textArea.setAttribute('spellcheck', 'false');
		L.DomEvent.on(this._textArea, stopEvents, L.DomEvent.stopPropagation)
			.on(this._textArea, 'keydown keypress keyup', this.onKeyEvents, this)
			.on(this._textArea, 'compositionstart compositionupdate compositionend textInput', this.onCompEvents, this)
			.on(this._textArea, 'focus', this.onGotFocus, this)
			.on(this._textArea, 'blur', this.onLostFocus, this);
	},

	onKeyEvents: function (e) {
		var keyCode = e.keyCode,
		    charCode = e.charCode,
		    handler = this._map.keyboard,
		    docLayer = this._map._docLayer,
		    unoKeyCode = handler._toUNOKeyCode(keyCode);

		if (!this._isComposing && e.type === 'keyup') {
			// not compositing and keyup, clear the input so it is ready
			// for next word (or char only)
			this._textArea.value = '';
		}

		docLayer._resetPreFetching();
		if (handler._ignoreKeyEvent({originalEvent: e})) {
			// key ignored
		}
		else if (e.type === 'keydown') {
			this._keyHandled = false;
			if (handler.handleOnKeyDownKeys[keyCode] && charCode === 0) {
				docLayer._postKeyboardEvent('input', charCode, unoKeyCode);
			}
		}
		else if ((e.type === 'keypress') && (!handler.handleOnKeyDownKeys[keyCode] || charCode !== 0)) {
			if (charCode === keyCode && charCode !== 13) {
				if (keyCode > 128) return; // fixup for ios.
				// Chrome sets keyCode = charCode for printable keys
				// while LO requires it to be 0
				keyCode = 0;
				unoKeyCode = handler._toUNOKeyCode(keyCode);
			}
			docLayer._postKeyboardEvent('input', charCode, unoKeyCode);
			this._keyHandled = true;
		}
		else if (e.type === 'keyup') {
			docLayer._postKeyboardEvent('up', charCode, unoKeyCode);
			this._keyHandled = true;
		}
		L.DomEvent.stopPropagation(e);
	},

	onCompEvents: function (e) {
		var map = this._map;

		switch (e.type)
		{
		case 'compositionstart':
			this._isComposing = true;
			break;
		case 'compositionupdate':
			map._docLayer._postCompositionEvent(0, 'input', e.data);
			break;
		case 'compositionend':
			this._isComposing = false;
			map._docLayer._postCompositionEvent(0, 'end', e.data);
			break;
		case 'textInput':
			if (!this._keyHandled) {
				var data = e.data;
				for (var idx = 0; idx < data.length; idx++) {
					this._map._docLayer._postKeyboardEvent('input', data[idx].charCodeAt(), 0);
				}
			}
		}
		L.DomEvent.stopPropagation(e);
	}
});

L.control.mobileInput = function (options) {
	return new L.Control.MobileInput(options);
};
