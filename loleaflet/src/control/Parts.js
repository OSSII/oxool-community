/* -*- js-indent-level: 8 -*- */
/*
 * Document parts switching and selecting handler
 */

/* global app */

L.Map.include({
	setPart: function (part, external, calledFromSetPartHandler) {
		var docLayer = this._docLayer;

		if (docLayer.isCalc())
			docLayer._sheetSwitch.save(part /* toPart */);

		docLayer._prevSelectedPart = docLayer._selectedPart;
		docLayer._selectedParts = [];
		if (part === 'prev') {
			if (docLayer._selectedPart > 0) {
				docLayer._selectedPart -= 1;
				this._partsDirection = -1;
			}
		}
		else if (part === 'next') {
			if (docLayer._selectedPart < docLayer._parts - 1) {
				docLayer._selectedPart += 1;
				this._partsDirection = 1;
			}
		}
		else if (typeof (part) === 'number' && part >= 0 && part < docLayer._parts) {
			this._partsDirection = (part >= docLayer._selectedPart) ? 1 : -1;
			docLayer._selectedPart = part;
			docLayer._updateReferenceMarks();
		}
		else {
			return;
		}

		var notifyServer = function (part) {
			// If this wasn't triggered from the server,
			// then notify the server of the change.
			if (!external)
				app.socket.sendMessage('setclientpart part=' + part);
		};

		if (app.file.fileBasedView)
		{
			docLayer._selectedPart = docLayer._prevSelectedPart;
			if (typeof(part) !== 'number') {
				docLayer._preview._scrollViewByDirection(part);
				this._docLayer._checkSelectedPart();
				return;
			}
			docLayer._preview._scrollViewToPartPosition(docLayer._selectedPart);
			this._docLayer._checkSelectedPart();
			notifyServer(part);
			return;
		}

		this.fire('scrolltopart');

		docLayer._selectedParts.push(docLayer._selectedPart);
		if (docLayer.isCursorVisible()) {
			// a click outside the slide to clear any selection
			app.socket.sendMessage('resetselection');
		}

		notifyServer(docLayer._selectedPart);

		this.fire('updateparts', {
			selectedPart: docLayer._selectedPart,
			selectedParts: docLayer._selectedParts,
			parts: docLayer._parts,
			docType: docLayer._docType
		});

		docLayer.eachView(docLayer._viewCursors, docLayer._onUpdateViewCursor, docLayer);
		docLayer.eachView(docLayer._cellViewCursors, docLayer._onUpdateCellViewCursor, docLayer);
		docLayer.eachView(docLayer._graphicViewMarkers, docLayer._onUpdateGraphicViewSelection, docLayer);
		docLayer.eachView(docLayer._viewSelections, docLayer._onUpdateTextViewSelection, docLayer);
		docLayer._clearSelections(calledFromSetPartHandler);
		docLayer._updateOnChangePart();
		docLayer._pruneTiles();
		docLayer._prevSelectedPartNeedsUpdate = true;
		if (docLayer._invalidatePreviews) {
			docLayer._invalidatePreviews();
		}
		docLayer._drawSearchResults();
		if (!this._searchRequested) {
			this.focus();
		}
	},

	// part is the part index/id
	// how is 0 to deselect, 1 to select, and 2 to toggle selection
	selectPart: function (part, how, external) {
		//TODO: Update/track selected parts(?).
		var docLayer = this._docLayer;
		var index = docLayer._selectedParts.indexOf(part);
		if (index >= 0 && how != 1) {
			// Remove (i.e. deselect)
			docLayer._selectedParts.splice(index, 1);
		}
		else if (how != 0) {
			// Add (i.e. select)
			docLayer._selectedParts.push(part);
		}

		this.fire('updateparts', {
			selectedPart: docLayer._selectedPart,
			selectedParts: docLayer._selectedParts,
			parts: docLayer._parts,
			docType: docLayer._docType
		});

		// If this wasn't triggered from the server,
		// then notify the server of the change.
		if (!external) {
			app.socket.sendMessage('selectclientpart part=' + part + ' how=' + how);
		}
	},

	deselectAll: function() {
		var docLayer = this._docLayer;
		while (docLayer._selectedParts.length > 0) {
			this.selectPart(docLayer._selectedParts[0], 0, false);
		}
	},

	_processPreviewQueue: function() {
		if (this._previewRequestsOnFly > 1) {
			// we don't always get a response for each tile requests
			// especially when we have more than one view
			// the server can determine that we have the tile already
			// and does not response to us
			// in that case we cannot decrease previewRequestsOnFly counter
			// we should not wait more than 2 seconds for each 3 requests
			var now = new Date();
			if (now - this._timeToEmptyQueue < 2000)
				// wait until the queue is empty
				return;
			else {
				this._previewRequestsOnFly = 0;
				this._timeToEmptyQueue = now;
			}
		}
		// take 3 requests from the queue:
		while (this._previewRequestsOnFly < 3) {
			var tile = this._previewQueue.shift();
			if (!tile)
				break;
			var isVisible = this.isPreviewVisible(tile[0], true);
			if (isVisible != true)
				// skip this! we can't see it
				continue;
			this._previewRequestsOnFly++;
			app.socket.sendMessage(tile[1]);
		}
	},

	_addPreviewToQueue: function(part, tileMsg) {
		for (var tile in this._previewQueue)
			if (tile[0] === part)
				// we already have this tile in the queue
				// no need to ask for it twice
				return;
		this._previewQueue.push([part, tileMsg]);
	},

	getPreview: function (id, index, maxWidth, maxHeight, options) {
		if (!this._docPreviews) {
			this._docPreviews = {};
		}
		var autoUpdate = options ? !!options.autoUpdate : false;
		var fetchThumbnail = options && options.fetchThumbnail ? options.fetchThumbnail : true;
		this._docPreviews[id] = {id: id, index: index, maxWidth: maxWidth, maxHeight: maxHeight, autoUpdate: autoUpdate, invalid: false};

		var docLayer = this._docLayer;
		if (docLayer._docType === 'text') {
			return;
		}
		else {
			var part = index;
			var tilePosX = 0;
			var tilePosY = 0;
			var tileWidth = docLayer._partWidthTwips ? docLayer._partWidthTwips: docLayer._docWidthTwips;
			var tileHeight = docLayer._partHeightTwips ? docLayer._partHeightTwips: docLayer._docHeightTwips;
		}
		var docRatio = tileWidth / tileHeight;
		var imgRatio = maxWidth / maxHeight;
		// fit into the given rectangle while maintaining the ratio
		if (imgRatio > docRatio) {
			maxWidth = Math.round(tileWidth * maxHeight / tileHeight);
		}
		else {
			maxHeight = Math.round(tileHeight * maxWidth / tileWidth);
		}

		if (fetchThumbnail) {
			this._addPreviewToQueue(part, 'tile ' +
							'nviewid=0' + ' ' +
							'part=' + part + ' ' +
							'width=' + maxWidth * app.roundedDpiScale + ' ' +
							'height=' + maxHeight * app.roundedDpiScale + ' ' +
							'tileposx=' + tilePosX + ' ' +
							'tileposy=' + tilePosY + ' ' +
							'tilewidth=' + tileWidth + ' ' +
							'tileheight=' + tileHeight + ' ' +
							'id=' + id + ' ' +
						 'broadcast=no');
			this._processPreviewQueue();
		}

		return {width: maxWidth, height: maxHeight};
	},

	// getCustomPreview
	// Triggers the creation of a preview with the given id, of width X height size, of the [(tilePosX,tilePosY),
	// (tilePosX + tileWidth, tilePosY + tileHeight)] section of the document.
	getCustomPreview: function (id, part, width, height, tilePosX, tilePosY, tileWidth, tileHeight, options) {
		if (!this._docPreviews) {
			this._docPreviews = {};
		}
		var autoUpdate = options ? options.autoUpdate : false;
		this._docPreviews[id] = {id: id, part: part, width: width, height: height, tilePosX: tilePosX,
			tilePosY: tilePosY, tileWidth: tileWidth, tileHeight: tileHeight, autoUpdate: autoUpdate, invalid: false};

		this._addPreviewToQueue(part, 'tile ' +
							'nviewid=0' + ' ' +
							'part=' + part + ' ' +
							'width=' + width * app.roundedDpiScale + ' ' +
							'height=' + height * app.roundedDpiScale + ' ' +
							'tileposx=' + tilePosX + ' ' +
							'tileposy=' + tilePosY + ' ' +
							'tilewidth=' + tileWidth + ' ' +
							'tileheight=' + tileHeight + ' ' +
							'id=' + id + ' ' +
							'broadcast=no');
		this._processPreviewQueue();
	},

	goToPage: function (page) {
		var docLayer = this._docLayer;
		if (page === 'prev') {
			if (docLayer._currentPage > 0) {
				docLayer._currentPage -= 1;
			}
		}
		else if (page === 'next') {
			if (docLayer._currentPage < docLayer._pages - 1) {
				docLayer._currentPage += 1;
			}
		}
		else if (typeof (page) === 'number' && page >= 0 && page < docLayer._pages) {
			docLayer._currentPage = page;
		}
		if (!this.isPermissionEdit() && docLayer._partPageRectanglesPixels && docLayer._partPageRectanglesPixels.length > docLayer._currentPage) {
			// we can scroll to the desired page without having a LOK instance
			var pageBounds = docLayer._partPageRectanglesPixels[docLayer._currentPage];
			var pos = new L.Point(
				pageBounds.min.x + (pageBounds.max.x - pageBounds.min.x) / 2,
				pageBounds.min.y);
			pos.y -= this.getSize().y / 4; // offset by a quater of the viewing area so that the previous page is visible
			this.scrollTop(pos.y, {update: true});
			this.scrollLeft(pos.x, {update: true});
		}
		else {
			app.socket.sendMessage('setpage page=' + docLayer._currentPage);
		}
		this.fire('pagenumberchanged', {
			currentPage: docLayer._currentPage,
			pages: docLayer._pages,
			docType: docLayer._docType
		});
	},

	insertPage: function(nPos) {
		if (this.isPresentationOrDrawing()) {
			app.socket.sendMessage('uno .uno:InsertPage');
		}
		else if (this.getDocType() === 'spreadsheet') {
			var command = {
				'Name': {
					'type': 'string',
					'value': ''
				},
				'Index': {
					'type': 'long',
					'value': nPos + 1
				}
			};

			app.socket.sendMessage('uno .uno:Insert ' + JSON.stringify(command));
		}
		else {
			return;
		}

		var docLayer = this._docLayer;

		// At least for Impress, we should not fire this. It causes a circular reference.
		if (!this.isPresentationOrDrawing()) {
			this.fire('insertpage', {
				selectedPart: docLayer._selectedPart,
				parts:        docLayer._parts
			});
		}

		docLayer._parts++;

		// Since we know which part we want to set, use the index (instead of 'next', 'prev')
		if (typeof nPos === 'number') {
			this.setPart(nPos);
		}
		else {
			this.setPart('next');
		}
	},

	duplicatePage: function() {
		if (!this.isPresentationOrDrawing()) {
			return;
		}
		app.socket.sendMessage('uno .uno:DuplicatePage');
		var docLayer = this._docLayer;

		// At least for Impress, we should not fire this. It causes a circular reference.
		if (!this.isPresentationOrDrawing()) {
			this.fire('insertpage', {
				selectedPart: docLayer._selectedPart,
				parts:        docLayer._parts
			});
		}

		docLayer._parts++;
		this.setPart('next');
	},

	deletePage: function (nPos) {
		if (this.isPresentationOrDrawing()) {
			app.socket.sendMessage('uno .uno:DeletePage');
		}
		else if (this.getDocType() === 'spreadsheet') {
			var command = {
				'Index': {
					'type': 'long',
					'value': nPos + 1
				}
			};

			app.socket.sendMessage('uno .uno:Remove ' + JSON.stringify(command));
		}
		else {
			return;
		}

		var docLayer = this._docLayer;
		// TO DO: Deleting all the pages causes problem.
		if (docLayer._parts === 1) {
			return;
		}

		if (this.getDocType() === 'spreadsheet' && docLayer._parts <= docLayer.hiddenParts() + 1) {
			return;
		}

		// At least for Impress, we should not fire this. It causes a circular reference.
		if (!this.isPresentationOrDrawing()) {
			this.fire('deletepage', {
				selectedPart: docLayer._selectedPart,
				parts:        docLayer._parts
			});
		}

		docLayer._parts--;
		if (docLayer._selectedPart >= docLayer._parts) {
			docLayer._selectedPart--;
		}

		if (typeof nPos === 'number') {
			this.setPart(nPos);
		}
		else {
			this.setPart(docLayer._selectedPart);
		}
	},

	/**
	 * 修改某張工作表或投影片名稱
	 * @author Firefly <firefly@ossii.com.tw>
	 *
	 * @param {string} name - 工作表或投影片名稱
	 * @param {number} nPos - 工作表位置(投影不須指定)
	 */
	 renamePage: function(name, nPos) {
		var command;
		switch (this.getDocType()) {
		case 'spreadsheet':
			command = {
				'Name': {
					'type': 'string',
					'value': name
				},
				'Index': {
					'type': 'long',
					'value': nPos + 1
				}
			};
			this.sendUnoCommand('.uno:Name', command);
			this.setPart(this._docLayer);
			break;
		case 'presentation':
		case 'drawing':
			command = {
				'Name': {
					'type': 'string',
					'value': name
				}
			};
			this.sendUnoCommand('.uno:RenamePage', command);
			break;
		}
	},

	/**
	 * 顯示指定名稱的工作表
	 * @param {*} sheetName
	 */
	showPage: function(sheetName) {
		if (this.getDocType() === 'spreadsheet' && this.hasAnyHiddenPart()) {
			var argument = {
				aTableName: {
					type: 'string',
					value: sheetName
				}
			};
			this.sendUnoCommand('.uno:Show', argument);
		}
	},

	/**
	 * 隱藏指定編號的工作表
	 * @param {*} tabNumber
	 */
	hidePage: function(tabNumber) {
		if (this.getDocType() === 'spreadsheet' && this.getNumberOfVisibleParts() > 1) {
			var argument = {
				nTabNumber: {
					type: 'int16',
					value: tabNumber
				}
			};
			this.sendUnoCommand('.uno:Hide', argument);
		}
	},

	/**
	 * 檢查工作表名稱是否合法
	 *
	 * @param {string} sheetName - 工作表名稱
	 * @param {number} nPos
	 * @returns true: 合法, false: 不合法或和現有名稱重複
	 */
	isSheetnameValid: function (sheetName, nPos) {
		var partNames = this._docLayer._partNames;
		var i;
		var invalidChars = '[]*?:/\\';
		var name = sheetName.trim();
		var isValid = (name.length > 0); // 非空字串

		// 工作表名稱頭尾不能有單引號
		if (isValid) {
			isValid = !(name.charAt(name.length - 1) === '\'' ||
			name.charAt(0) === '\'');
		}
		// 檢查是否有特殊字元
		for (i = 0 ; isValid && i < invalidChars.length ; i++) {
			if (name.includes(invalidChars[i])) {
				isValid = false;
			}
		}

		// nPos = -1 表示檢查是否和現有名稱重複
		if (nPos === undefined) {
			nPos = -1;
		}

		// 是否和現有工作表名稱重複
		for (i = 0 ; isValid && i < partNames.length ; i++) {
			// 同位置不檢查
			if (i !== nPos && name === partNames[i]) {
				isValid = false;
			}
		}
		return isValid;
	},

	/**
	 * 取得文件檔名(含副檔名)
	 */
	getFileName: function() {
		var file = this.options.wopi ? this.wopi.BaseFileName : this.options.doc;
		var idx = file.lastIndexOf('/');
		return file.substr(idx + 1);
	},

	/**
	 * 取得文件檔名(不含副檔名)
	 */
	getDocName: function() {
		var file = this.options.wopi ? this.wopi.BaseFileName : this.options.doc;
		var idx = file.lastIndexOf('.');
		// 去掉副檔名
		if (idx >= 0) {
			file = file.substr(0, idx);
		}

		idx = file.lastIndexOf('/');
		file = file.substring(idx + 1);
		return file;
	},

	/**
	 * 取得某工作表或投影片的詳細資訊
	 * @param {number} part - 從 0 開始的編號
	 * @returns null: Writer或系統不支援(後端不是OxOffice)
	 */
	getPartProperty: function(part) {
		// 文字文件目前不支援取得每頁資訊
		// TODO: 將來可能嗎？
		if (this.getDocType() === 'text' || this._docLayer._partsInfo === undefined) {
			return null;
		}
		// 未指定工作表或投影片編號，表示目前選取的工作表或投影片編號
		part = (part === undefined ? this._docLayer._selectedPart : parseInt(part, 10));
		return this._docLayer._partsInfo[part];
	},

	/**
	 * 指定工作表是否被保護
	 * @param {number} part - 從 0 開始的編號
	 * @returns
	 */
	isPartProtected: function(part) {
		var pInfo = this.getPartProperty(part);
		if (pInfo) {
			return pInfo.isProtected();
		}
		// 否則從 stateChangeHandler 取得
		var state = this.stateChangeHandler.getItemProperty('.uno:Protect');
		return state.checked();
	},

	isHiddenPart: function (part) {
		if (this.getDocType() !== 'spreadsheet')
			return false;
		return this._docLayer.isHiddenPart(part);
	},

	hasAnyHiddenPart: function () {
		if (this.getDocType() !== 'spreadsheet')
			return false;
		return this._docLayer.hasAnyHiddenPart();
	},

	/**
	 * 取得文字文件總頁數
	 * @author Firefly <firefly@ossii.com.tw>
	 * @returns 總頁數
	 */
	getNumberOfPages: function() {
		return this._docLayer._pages;
	},

	getNumberOfParts: function () {
		return this._docLayer._parts;
	},

	getNumberOfVisibleParts: function () {
		return this.getNumberOfParts() - this._docLayer.hiddenParts();
	},

	/**
	 *  取得所有隱藏的工作表名稱
	 * @returns 以逗號分隔的工作表字串
	 */
	getHiddenPartNames: function() {
		var partNames = this._docLayer._partNames;
		var names = [];
		for (var i = 0; i < partNames.length; ++i) {
			if (this.isHiddenPart(i))
				names.push(partNames[i]);
		}
		return names.join(',');
	},

	/**
	 * 取得文字文件目前由表所在頁號
	 * @author Firefly <firefly@ossii.com.tw>
	 * @returns 目前所在頁
	 */
	getCurrentPageNumber: function () {
		return this._docLayer._currentPage;
	},

	getCurrentPartNumber: function () {
		return this._docLayer._selectedPart;
	},

	getDocSize: function () {
		return this._docLayer._docPixelSize;
	},

	getDocType: function () {
		if (!this._docLayer)
			return null;

		return this._docLayer._docType;
	},

	isPresentationOrDrawing: function () {
		return this.getDocType() === 'presentation' || this.getDocType() === 'drawing';
	}
});
