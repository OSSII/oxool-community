/* -*- js-indent-level: 8 -*- */
/*
 * Extends L.Map to handle zoom animations.
 */

L.Map.mergeOptions({
	zoomAnimation: true,
	zoomAnimationThreshold: 4
});

var zoomAnimated = L.DomUtil.TRANSITION && L.Browser.any3d && !L.Browser.mobileOpera;

if (zoomAnimated) {

	L.Map.addInitHook(function () {
		// don't animate on browsers without hardware-accelerated transitions or old Android/Opera
		this._zoomAnimated = this.options.zoomAnimation;

		// zoom transitions run with the same duration for all layers, so if one of transitionend events
		// happens after starting zoom animation (propagating to the map pane), we know that it ended globally
		if (this._zoomAnimated) {

			this._createAnimProxy();

			L.DomEvent.on(this._proxy, L.DomUtil.TRANSITION_END, this._catchTransitionEnd, this);
		}
	});
}

L.Map.include(!zoomAnimated ? {} : {

	_createAnimProxy: function () {

		var proxy = this._proxy = L.DomUtil.create('div', 'leaflet-proxy leaflet-zoom-animated');
		this._panes.mapPane.appendChild(proxy);

		this.on('zoomanim', function (e) {
			var prop = L.DomUtil.TRANSFORM,
			    transform = proxy.style[prop];

			L.DomUtil.setTransform(proxy, this.project(e.center, e.zoom), this.getZoomScale(e.zoom, 1));

			// workaround for case when transform is the same and so transitionend event is not fired
			if (transform === proxy.style[prop] && this._animatingZoom) {
				this._onZoomTransitionEnd();
			}
		}, this);

		this.on('load moveend', function () {
			var c = this.getCenter(),
			    z = this.getZoom();
			L.DomUtil.setTransform(proxy, this.project(c, z), this.getZoomScale(z, 1));
		}, this);
	},

	_catchTransitionEnd: function (e) {
		if (this._animatingZoom && e.propertyName.indexOf('transform') >= 0) {
			this._onZoomTransitionEnd();
		}
	},

	_nothingToAnimate: function () {
		return !this._container.getElementsByClassName('leaflet-zoom-animated').length;
	},

	_tryAnimatedZoom: function (center, zoom, options) {

		if (this._animatingZoom) { return true; }

		options = options || {};

		// don't animate if disabled, not supported or zoom difference is too large
		if (!this._zoomAnimated || options.animate === false || this._nothingToAnimate() ||
		        Math.abs(zoom - this._zoom) > this.options.zoomAnimationThreshold) { return false; }

		// offset is the pixel coords of the zoom origin relative to the current center
		var scale = this.getZoomScale(zoom),
		    offset = this._getCenterOffset(center)._divideBy(1 - 1 / scale);

		// don't animate if the zoom origin isn't within one screen from the current center, unless forced
		if (options.animate !== true && !this.getSize().contains(offset)) { return false; }

		L.Util.requestAnimFrame(function () {
			this
			    .fire('movestart')
			    .fire('zoomstart')
			    ._animateZoom(center, zoom, true);
		}, this);

		return true;
	},

	_animateZoom: function (center, zoom, startAnim, noUpdate) {
		if (startAnim) {
			this._animatingZoom = true;

			// remember what center/zoom to set after animation
			this._animateToCenter = center;
			this._animateToZoom = zoom;

			L.DomUtil.addClass(this._mapPane, 'leaflet-zoom-anim');
		}

		this.fire('zoomanim', {
			center: center,
			zoom: zoom,
			scale: this.getZoomScale(zoom),
			origin: this.latLngToLayerPoint(center),
			offset: this._getCenterOffset(center).multiplyBy(-1),
			noUpdate: noUpdate
		});
	},

	_onZoomTransitionEnd: function () {

		this._animatingZoom = false;

		L.DomUtil.removeClass(this._mapPane, 'leaflet-zoom-anim');

		this._resetView(this._animateToCenter, this._animateToZoom, true, true);

		if (this.getDocType() === 'spreadsheet') {
			setTimeout(function() {
				this._fixMapPanePosition(); // 修正位置
			}.bind(this), 300);
		}
	},

	/**
	 * 修正觸控設備縮放時，文件左上角超過編輯區左上角出現的灰白區域問題
	 */
	_fixMapPanePosition: function() {
		var mapPane = this._mapPane;

		var tiles = this._docLayer._tiles; // 所有拼貼物件
		var firstTileKey = Object.keys(tiles)[0];
		var firstTile = tiles[firstTileKey].el; // 第一個拼貼 dom
		var firstTilePos = L.DomUtil.getPosition(firstTile); // 取得拼貼所在位置
		if (firstTilePos === undefined) {
			firstTilePos = new L.Point(parseInt(firstTile.style.left), parseInt(firstTile.style.top));
		}
		console.debug('_fixPosition firstTilePos=', firstTilePos);

		var tileContainer = mapPane.getElementsByClassName('leaflet-tile-container');
		tileContainer = tileContainer[tileContainer.length - 1];

		var first, last, xyzStr;

		first = tileContainer.style.transform.indexOf('(');
		last = tileContainer.style.transform.indexOf(')');
		xyzStr = tileContainer.style.transform.substring(first + 1, last).split(',');
		var tileContainerPos = new L.Point(parseInt(xyzStr[0]), parseInt(xyzStr[1]));
		console.debug('fixPosition tileContainerPos=', tileContainerPos);

		var mapPanePos = L.DomUtil.getPosition(mapPane);
		console.debug('fixPosition mapPanePos=', mapPanePos);

		var x = firstTilePos.x + tileContainerPos.x + mapPanePos.x;
		var y = firstTilePos.y + tileContainerPos.y + mapPanePos.y;
		var mustFix = false;
		// 修正 x
		if (x > 0) {
			mapPanePos.x = (firstTilePos.x + tileContainerPos.x) * (-1);
			mustFix = true;
		}
		// 修正 y
		if (y > 0) {
			mapPanePos.y = (firstTilePos.y + tileContainerPos.y) * (-1);
			mustFix = true;
		}
		if (mustFix) {
			console.debug('Must fix to new position:', mapPanePos);
			L.DomUtil.setPosition(mapPane, mapPanePos);
		}
	}
});
