/* -*- js-indent-level: 8 -*- */
/*
 * L.Control.PartsPreview
 */

/* global $ */
L.Control.PartsPreview = L.Control.extend({
	options: {
		autoUpdate: true
	},

	_gridVisible: null, // 顯示網格，預設未知

	onAdd: function(map) {
		map.on('updatepermission', this._onUpdatePermission, this);
		this._initialized = false;
	},

	_onUpdatePermission: function(e) {
		var map = this._map;
		var docType = map.getDocType();
		if (docType !== 'presentation' && docType !== 'draw') {
			return;
		}

		if (!this._initialized) {
			this._initialize();
		}

		if (e.perm === 'edit') {
			// 桌面模式啟用拖曳排序
			/* if (window.mode.isDesktop()) {
				$(this._scrollContainer).sortable('enable');
			} */
			map.on('insertpage', this._insertPreview, this);
			map.on('deletepage', this._deletePreview, this);
		} else {
			//$(this._scrollContainer).sortable('disable'); // 關閉拖曳排序
			map.off('insertpage', this._insertPreview, this);
			map.off('deletepage', this._deletePreview, this);
		}
	},

	_initialize: function() {
		var that = this;
		var map = this._map;

		this._initialized = true;
		this._previewInitialized = false;
		this._previewTiles = [];
		this._partsPreviewCont = L.DomUtil.get('slide-sorter');
		this._scrollY = 0;

		// make room for the preview
		L.DomUtil.addClass(map.options.documentContainer, 'parts-preview-document');
		setTimeout(L.bind(function () {
			map.invalidateSize();
			$('.scroll-container').mCustomScrollbar('update');
		}, this), 500);

		$(this._partsPreviewCont).mCustomScrollbar({
			axis: 'y',
			theme: '3d-thick-dark',
			scrollButtons:{enable: true},
			alwaysShowScrollbar: 1,
			callbacks:{
				whileScrolling: function() {
					that._onScroll(this);
				}
			}
		});
		this._scrollContainer = $(this._partsPreviewCont).find('.mCSB_container').get(0);

		// TODO: 未來實作
		//this.createSortable(); // 加上拖曳排序功能
		//this.createContextMenu(); // 加上右鍵選單

		map.on('updateparts', this._updateDisabled, this);
		map.on('updatepart', this._updatePart, this);
		map.on('tilepreview', this._updatePreview, this);
		map.on('commandstatechanged', this._onCommandStateChanged, this);
		map.on('resize', this._onResize, this);
	},

	/**
	 *
	 * @param {object} e
	 */
	_updateDisabled: function(e) {
		if (!this._previewInitialized) {
			console.debug('haha _updateDisabled(begin init)', e);
			var previewContBB = this._partsPreviewCont.getBoundingClientRect();
			this._previewContTop = previewContBB.top;
			var bottomBound = previewContBB.bottom + previewContBB.height / 2;
			for (var i = 0; i < e.parts; i++) {
				this._previewTiles.push(this._createPreview(i, e.partNames[i], bottomBound));
			}
			this._onScroll();
			this._previewInitialized = true;
		} else {
			console.debug('haha _updateDisabled', e);
			var childNodes = this._scrollContainer.childNodes;
			if (e.partNames !== undefined) {
				this._syncPreviews(e);
			}

			for (var j = 0; j < e.parts; j++) {
				L.DomUtil.removeClass(childNodes[j], 'preview-frame-selected');
			}
			L.DomUtil.addClass(childNodes[this._map.getCurrentPartNumber()], 'preview-frame-selected');
			this._previewTileScrollIntoView();
		}
	},

	/**
	 * UNO 指令狀態回報
	 * @param {event} e
	 */
	_onCommandStateChanged: function(e) {
		var cmdName = e.commandName;
		var state = e.state;
		if (this._previewInitialized &&
			cmdName === '.uno:GridVisible' &&
			(state === 'true' || state === 'false')) {
			var prevState = this._gridVisible; //
			var firstSet = (prevState === null);
			this._gridVisible = (state === 'true' ? true : false);
			if (!firstSet && this._gridVisible !== prevState) {
				console.debug('haha update all preview tiles');
				for (var i=0 ; i < this._previewTiles.length ; i++) {
					this._previewTiles[i].fetched = false;
				}
				this._onScroll();
			}
		}
	},

	/**
	 * 視窗改變大小
	 */
	_onResize: function(/*e*/) {
		if (this._previewInitialized) {
			var presentationControlWrapperElem = L.DomUtil.get('presentation-controls-wrapper');
			var visible = L.DomUtil.getStyle(presentationControlWrapperElem, 'display');
			// 預覽區沒有隱藏的話，捲動至可視範圍
			if (visible !== 'none') {
				this._previewTileScrollIntoView();
			}
		}
	},

	/**
	 * 檢查並捲動選取的預覽圖到可視區內
	 */
	_previewTileScrollIntoView: function() {
		// 目前選取的預覽圖 DOM
		var frame = this._scrollContainer.childNodes[this._map.getCurrentPartNumber()];
		// 取得可視區範圍所在範圍
		var previewRect = this._partsPreviewCont.getBoundingClientRect();
		// 預覽圖所在範圍
		var frameRect = frame.getBoundingClientRect();
		var scrollOffsetY = 0; // 預設捲動位置
		// 預覽圖上端被遮住
		if (frameRect.top < previewRect.top) {
			scrollOffsetY = frame.offsetTop
		// 預覽圖下端被遮住
		} else if (frameRect.bottom > previewRect.bottom) {
			scrollOffsetY = frame.offsetTop - previewRect.height + frameRect.height;
		}
		// 捲動位置不為 0，需捲動到指定位置
		if (scrollOffsetY !== 0) {
			$(this._partsPreviewCont).mCustomScrollbar('scrollTo', scrollOffsetY);
		}
	},

	_createPreview: function (i, hashCode, bottomBound) {
		var frame = L.DomUtil.create('div', 'preview-frame', this._scrollContainer);
		var infoWrapper = L.DomUtil.create('div', 'preview-info-wrapper', frame);
		L.DomUtil.create('div', 'preview-helper', infoWrapper); //infoWrapper.childNodes[0]
		L.DomUtil.create('div', '', infoWrapper); // infoWrapper.childNodes[1] (是否有動畫)
		L.DomUtil.create('div', '', infoWrapper); // infoWrapper.childNodes[2] (是否有投影片轉場)

		var img = L.DomUtil.create('img', 'preview-img', frame);
		img.hash = hashCode;
		img.src = L.Icon.Default.imagePath + '/preview_placeholder.png';
		img.fetched = false;

		// 桌面模式啟用 tooltip
		if (window.mode.isDesktop()) {
			$(img).tooltip({
				position: {
					my: 'left top',
					at: 'right+4 top+4',
					collision: 'flipfit'
				}
			});
		}

		L.DomEvent
			.on(img, 'click', L.DomEvent.stopPropagation)
			.on(img, 'click', L.DomEvent.stop)
			.on(img, 'click', this._setPart, this)
			.on(img, 'click', this._map.focus, this._map);

		var topBound = this._previewContTop;
		var previewFrameTop = 0;
		var previewFrameBottom = 0;
		if (i > 0) {
			if (!bottomBound) {
				var previewContBB = this._partsPreviewCont.getBoundingClientRect();
				bottomBound = this._previewContTop + previewContBB.height + previewContBB.height / 2;
			}
			previewFrameTop = this._previewContTop + this._previewFrameMargin + i * (this._previewFrameHeight + this._previewFrameMargin);
			previewFrameTop -= this._scrollY;
			previewFrameBottom = previewFrameTop + this._previewFrameHeight;
			L.DomUtil.setStyle(img, 'height', this._previewImgHeight + 'px');
			L.DomUtil.setStyle(infoWrapper, 'height', this._previewImgHeight + 'px');
		}

		var imgSize;
		if (i === 0 || (previewFrameTop >= topBound && previewFrameTop <= bottomBound)
			|| (previewFrameBottom >= topBound && previewFrameBottom <= bottomBound)) {
			imgSize = this._map.getPreview(i, i, 180, 180, {autoUpdate: this.options.autoUpdate});
			img.fetched = true;
			L.DomUtil.setStyle(img, 'height', '');
			L.DomUtil.setStyle(infoWrapper, 'height', imgSize.height + 'px');
		}

		if (i === 0) {
			var previewImgBorder = Math.round(parseFloat(L.DomUtil.getStyle(img, 'border-top-width')));
			var previewImgMinWidth = Math.round(parseFloat(L.DomUtil.getStyle(img, 'min-width')));
			var imgHeight = imgSize.height;
			if (imgSize.width < previewImgMinWidth)
				imgHeight = Math.round(imgHeight * previewImgMinWidth / imgSize.width);
			var previewFrameBB = frame.getBoundingClientRect();
			this._previewFrameMargin = previewFrameBB.top - this._previewContTop;
			this._previewImgHeight = imgHeight;
			this._previewFrameHeight = imgHeight + 2 * previewImgBorder;
		}

		return img;
	},

	_setPart: function(e) {
		console.debug('haha _setPart', e);
		var frame = e.target.parentNode;
		var part = $('#slide-sorter .mCSB_container .preview-frame').index(frame);
		var currPart = this._map.getCurrentPartNumber();
		if (part !== currPart) {
			this._map.setPart(part);
		}
	},

	_updatePart: function(e) {
		console.debug('haha _updatePart', e);
		if (e.part >= 0) {
			this._map.getPreview(e.part, e.part, 180, 180, {autoUpdate: this.options.autoUpdate});
		}
	},

	_syncPreviews: function(e) {
		var it = 0;
		var parts = e.parts;
		if (parts !== this._previewTiles.length) {
			if (Math.abs(parts - this._previewTiles.length) === 1) {
				if (parts > this._previewTiles.length) {
					for (it = 0; it < parts; it++) {
						if (it === this._previewTiles.length) {
							this._insertPreview({selectedPart: it - 1, hashCode: e.partNames[it]});
							break;
						}
						if (this._previewTiles[it].hash !== e.partNames[it]) {
							this._insertPreview({selectedPart: it, hashCode: e.partNames[it]});
							break;
						}
					}
				}
				else {
					for (it = 0; it < this._previewTiles.length; it++) {
						if (it === e.partNames.length ||
						    this._previewTiles[it].hash !== e.partNames[it]) {
							this._deletePreview({selectedPart: it});
							break;
						}
					}
				}
			}
			else {
				// sync all, should never happen
				while (this._previewTiles.length < e.partNames.length) {
					this._insertPreview({selectedPart: this._previewTiles.length - 1,
							     hashCode: e.partNames[this._previewTiles.length]});
				}

				while (this._previewTiles.length > e.partNames.length) {
					this._deletePreview({selectedPart: this._previewTiles.length - 1});
				}

				for (it = 0; it < e.partNames.length; it++) {
					this._previewTiles[it].hash = e.partNames[it];
					this._previewTiles[it].src = L.Icon.Default.imagePath + '/preview_placeholder.png';
					this._previewTiles[it].fetched = false;
				}
				this._onScrollEnd();
			}
		}
		else {
			// update hash code when user click insert slide.
			for (it = 0; it < parts; it++) {
				this._updatePreviewProperty(it);
			}
		}
	},

	/**
	 * 更新某張投影片預覽資訊
	 *
	 * @param {number} index - 投影片編號
	 */
	_updatePreviewProperty: function(index) {
		var frame = this._scrollContainer.childNodes[index];
		var infoWrapper = frame.childNodes[0];
		var img = frame.childNodes[1];

		var helper = infoWrapper.childNodes[0];
		var animation = infoWrapper.childNodes[1];
		var transition = infoWrapper.childNodes[2];

		frame.slidePartNo = index; // 投影片編號 0 開始
		helper.innerText = index + 1; // 顯示的編號從 1 開始，所以實際編號 + 1

		var partInfo = this._map.getPartProperty(index);
		if (partInfo) {
			img.title = partInfo.name;
			img.hash = partInfo.hashCode;

			if (partInfo.selected == '1') {
				L.DomUtil.addClass(frame, 'preview-frame-selected');
			} else {
				L.DomUtil.removeClass(frame, 'preview-frame-selected');
			}
			// 是否隱藏
			if (partInfo.visible === '0') {
				L.DomUtil.addClass(img, 'preview-img-blur');
			} else {
				L.DomUtil.removeClass(img, 'preview-img-blur');
			}

			// 是否有動畫
			if (partInfo.hasAnimationNode !== '0') {
				L.DomUtil.addClass(animation, 'preview-animation');
			} else {
				L.DomUtil.removeClass(animation, 'preview-animation');
			}

			// 是否有轉場
			if (partInfo.transitionType !== '0') {
				L.DomUtil.addClass(transition, 'preview-transition');
			} else {
				L.DomUtil.removeClass(transition, 'preview-transition');
			}
		}
	},

	/**
	 * 收到預覽圖
	 * @param {object}} e
	 */
	_updatePreview: function(e) {
		console.debug('haha _updatePreview', e);
		this._previewTiles[e.id].src = e.tile;
	},

	_updatePreviewIds: function () {
		$(this._partsPreviewCont).mCustomScrollbar('update');
	},

	/**
	 * 插入預覽圖
	 * @param {*} e
	 */
	_insertPreview: function(e) {
		console.debug('haha _insertPreview', e);
		var newIndex = e.selectedPart + 1;
		var newPreview = this._createPreview(newIndex, (e.hashCode === undefined ? null : e.hashCode));

		// insert newPreview to newIndex position
		this._previewTiles.splice(newIndex, 0, newPreview);

		var selectedFrame = this._previewTiles[e.selectedPart].parentNode;
		var newFrame = newPreview.parentNode;

		// insert after selectedFrame
		selectedFrame.parentNode.insertBefore(newFrame, selectedFrame.nextSibling);
		this._updatePreviewIds();
	},

	/**
	 * 刪除預覽圖
	 * @param {object} e
	 */
	_deletePreview: function(e) {
		console.debug('haha _deletePreview', e);
		var selectedFrame = this._previewTiles[e.selectedPart].parentNode;
		L.DomUtil.remove(selectedFrame);
		this._previewTiles.splice(e.selectedPart, 1);
		this._updatePreviewIds();
	},

	/**
	 * 預覽區捲動後，檢查位於預覽區內的預覽圖是否已經載入
	 *
	 * @param {object} e
	 */
	_onScroll: function(e) {
		var scrollOffset = 0;
		if (e) {
			var prevScrollY = this._scrollY;
			this._scrollY = -e.mcs.top;
			scrollOffset = this._scrollY - prevScrollY;
		}

		var previewContBB = this._partsPreviewCont.getBoundingClientRect();
		var extra = previewContBB.height;
		var topBound = this._previewContTop - (scrollOffset < 0 ? extra : previewContBB.height / 2);
		var bottomBound = this._previewContTop + previewContBB.height + (scrollOffset > 0 ? extra : previewContBB.height / 2);
		for (var i = 0; i < this._previewTiles.length; ++i) {
			var img = this._previewTiles[i];
			if (img && img.parentNode && !img.fetched) {
				var previewFrameBB = img.parentNode.getBoundingClientRect();
				if ((previewFrameBB.top >= topBound && previewFrameBB.top <= bottomBound)
				|| (previewFrameBB.bottom >= topBound && previewFrameBB.bottom <= bottomBound)) {
					this._map.getPreview(i, i, 180, 180, {autoUpdate: this.options.autoUpdate});
					img.fetched = true;
				}
			}
		}
	}
});

L.control.partsPreview = function(options) {
	return new L.Control.PartsPreview(options);
};
