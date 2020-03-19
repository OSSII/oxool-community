/* -*- js-indent-level: 8 -*- */
/*
 * L.Cursor blinking cursor.
 */

L.Cursor = L.Layer.extend({

	options: {
		opacity: 1,
		zIndex: 1000
	},

	initialize: function (latlng, size, options) {
		L.setOptions(this, options);
		this._latlng = L.latLng(latlng);
		this._size = L.point(size);
		this._initLayout();
	},

	onAdd: function () {
		if (!this._container) {
			this._initLayout();
		}

		this.update();
		this.getPane().appendChild(this._container);
	},

	onRemove: function () {
		if (this._container) {
			this.getPane().removeChild(this._container);
		}
	},

	getEvents: function () {
		var events = {viewreset: this.update};

		return events;
	},

	getLatLng: function () {
		return this._latlng;
	},

	setLatLng: function (latlng, size) {
		var oldLatLng = this._latlng;
		this._latlng = L.latLng(latlng);
		this._size = L.point(size);
		this.update();
		return this.fire('move', {oldLatLng: oldLatLng, latlng: this._latlng});
	},

	update: function () {
		if (this._container && this._map) {
			var pos = this._map.latLngToLayerPoint(this._latlng).round();
			this._setSize();
			this._setPos(pos);
		}
		return this;
	},

	setOpacity: function (opacity) {
		if (this._container) {
			L.DomUtil.setOpacity(this._cursor, opacity);
		}
	},

	showCursorHeader: function() {
		if (this._cursorHeader) {
			L.DomUtil.setStyle(this._cursorHeader, 'visibility', 'visible');

			clearTimeout(this._blinkTimeout);
			this._blinkTimeout = setTimeout(L.bind(function() {
				L.DomUtil.setStyle(this._cursorHeader, 'visibility', 'hidden');
			}, this), this.options.headerTimeout);
		}
	},

	_initLayout: function () {
		this._container = L.DomUtil.create('div', 'leaflet-cursor-container');
		if (this.options.header) {
			this._cursorHeader = L.DomUtil.create('div', 'leaflet-cursor-header', this._container);

			this._cursorHeader.innerHTML = this.options.headerName;

			clearTimeout(this._blinkTimeout);
			this._blinkTimeout = setTimeout(L.bind(function() {
				L.DomUtil.setStyle(this._cursorHeader, 'visibility', 'hidden');
			}, this), this.options.headerTimeout);
		}
		this._cursor = L.DomUtil.create('div', 'leaflet-cursor', this._container);
		if (this.options.blink) {
			L.DomUtil.addClass(this._cursor, 'blinking-cursor');
		}

		if (this.options.color) {
			L.DomUtil.setStyle(this._cursorHeader, 'background', this.options.color);
			L.DomUtil.setStyle(this._cursor, 'background', this.options.color);
		}

		L.DomEvent
			.disableClickPropagation(this._cursor)
			.disableScrollPropagation(this._container);
	},

	_setPos: function (pos) {
		L.DomUtil.setPosition(this._container, pos);
		this._container.style.zIndex = this.options.zIndex;
		// Restart blinking animation
		if (this.options.blink) {
			L.DomUtil.removeClass(this._cursor, 'blinking-cursor');
			void this._cursor.offsetWidth;
			L.DomUtil.addClass(this._cursor, 'blinking-cursor');
		}
	},

	_setSize: function () {
		this._cursor.style.height = this._size.y + 'px';
		this._container.style.top = '-' + (this._container.clientHeight - this._size.y - 2) / 2 + 'px';
	}
});

L.cursor = function (latlng, size, options) {
	return new L.Cursor(latlng, size, options);
};

L.Cursor.hotSpot = {
	ase: {x: 30, y:16},
	asn: {x: 16, y: 1},
	asne: {x:30, y: 1},
	asns: {x:16, y:16},
	asnswe: {x:16, y:16},
	asnw: {x: 1, y: 1},
	ass: {x:16, y:30},
	asse: {x:30, y:30},
	assw: {x: 1, y:30},
	asw: {x: 1, y:30},
	aswe: {x: 16, y: 16},
	fill: {x: 7, y: 16},
	chain: {x: 1, y: 1},
	chainnot: {x: 16, y: 16},
	chart: {x: 16, y: 16},
	copydlnk: {x: 1, y:1},
	copyf: {x: 7, y: 6},
	copyf2: {x: 7, y: 6},
	copyflnk: {x: 7, y: 6},
	crop: {x: 7, y: 6},
	crook: {x: 16, y: 16},
	darc: {x: 16, y: 16},
	dbezier: {x: 16, y: 16},
	dcapt: {x: 16, y: 16},
	dcirccut: {x: 16, y: 16},
	dconnect: {x: 16, y: 16},
	dellipse: {x: 16, y: 16},
	dfree: {x: 16, y: 16},
	dline: {x: 16, y: 16},
	dpie: {x: 16, y: 16},
	dpolygon: {x: 16, y: 16},
	drect: {x: 16, y: 16},
	dtext: {x: 16, y: 16},
	linkf: {x: 7, y: 6},
	magnify: {x: 16, y: 16},
	mirror: {x: 16, y: 16},
	movebw: {x: 1, y: 1},
	movedata: {x: 1, y: 1},
	movedlnk: {x: 1, y: 1},
	movef: {x: 7, y: 6},
	move2: {x: 7, y: 6},
	moveflnk: {x: 7, y: 6},
	movept: {x: 1, y: 1},
	pivotcol: {x: 7, y: 6},
	pivotdel: {x:16, y: 16},
	pivotfld: {x: 7, y: 6},
	pivotrow: {x: 7, y: 6},
	rotate: {x:16, y: 16},
	tblsels: {x: 16, y: 30},
	tblsele: {x: 30, y: 16},
	tblselse: {x: 30, y: 30},
	tblselw: {x: 1, y: 16},
	tblselsw: {x:1, y: 30},
	hshear: {x:16, y: 16},
	vshear: {x:16, y: 16},
	wshide: {x:16, y: 16},
	wsshow: {x:16, y: 16}
};

L.Cursor.customCursors = [
	'ase',
	'asn',
	'asne',
	'asns',
	'asnswe',
	'asnw',
	'ass',
	'asse',
	'assw',
	'asw',
	'aswe',
	'fill',
	'chain',
	'chainnot',
	'chart',
	'copydlnk',
	'copyf',
	'copyf2',
	'copyflnk',
	'crop',
	'crook',
	'darc',
	'dbezier',
	'dcapt',
	'dcirccut',
	'dconnect',
	'dellipse',
	'dfree',
	'dline',
	'dpie',
	'dpolygon',
	'drect',
	'dtext',
	'linkf',
	'magnify',
	'mirror',
	'movebw',
	'movedata',
	'movedlnk',
	'movef',
	'movef2',
	'moveflnk',
	'movept',
	'pivotcol',
	'pivotdel',
	'pivotfld',
	'pivotrow',
	'rotate',
	'tblsele',
	'tblsels',
	'tblselse',
	'tblselw',
	'tblselsw',
	'hshear',
	'vshear',
	'wshide',
	'wsshow'
];

L.Cursor.isCustomCursor = function (cursorName) {
	return (L.Cursor.customCursors.indexOf(cursorName) !== -1);
};

L.Cursor.getCustomCursor = function (cursorName) {
	var customCursor;

	if (L.Cursor.isCustomCursor(cursorName)) {
		var cursorHotSpot = L.Cursor.hotSpot[cursorName] || {x: 0, y: 0};
		customCursor = L.Browser.ie ? // IE10 does not like item with left/top position in the url list
			'url(' + L.Cursor.imagePath + '/' + cursorName + '.cur), default' :
			'url(' + L.Cursor.imagePath + '/' + cursorName + '.png) ' + cursorHotSpot.x + ' ' + cursorHotSpot.y + ', default';
	}
	return customCursor;
};
