/* -*- js-indent-level: 8 -*- */
/*
 * Document parts switching and selecting handler
 */
L.Map.include({
	setPart: function (part, external, calledFromSetPartHandler) {
		var docLayer = this._docLayer;
		docLayer._prevSelectedPart = docLayer._selectedPart;
		docLayer._selectedParts = [];
		if (part === 'prev') {
			if (docLayer._selectedPart > 0) {
				docLayer._selectedPart -= 1;
			}
		}
		else if (part === 'next') {
			if (docLayer._selectedPart < docLayer._parts - 1) {
				docLayer._selectedPart += 1;
			}
		}
		else if (typeof (part) === 'number' && part >= 0 && part < docLayer._parts) {
			docLayer._selectedPart = part;
		}
		else {
			return;
		}

		docLayer._selectedParts.push(docLayer._selectedPart);

		if (docLayer.isCursorVisible()) {
			// a click outside the slide to clear any selection
			this._socket.sendMessage('resetselection');
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
			this._socket.sendMessage('setclientpart part=' + docLayer._selectedPart);
		}
		docLayer.eachView(docLayer._viewCursors, docLayer._onUpdateViewCursor, docLayer);
		docLayer.eachView(docLayer._cellViewCursors, docLayer._onUpdateCellViewCursor, docLayer);
		docLayer.eachView(docLayer._graphicViewMarkers, docLayer._onUpdateGraphicViewSelection, docLayer);
		docLayer.eachView(docLayer._viewSelections, docLayer._onUpdateTextViewSelection, docLayer);
		docLayer._clearSelections(calledFromSetPartHandler);
		docLayer._updateOnChangePart();
		docLayer._pruneTiles();
		docLayer._prevSelectedPartNeedsUpdate = true;
		if (docLayer._invalidatePreview) {
			docLayer._invalidatePreview();
		}
		docLayer._drawSearchResults();
		if (!this._searchRequested) {
			this.focus();
		}
	},

	// part is the part index/id
	// how is 0 to deselect, 1 to select, and 2 to toggle selection
	selectPart: function (part, how, external) {
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
			this._socket.sendMessage('selectclientpart part=' + part + ' how=' + how);
		}
	},

	getPreview: function (id, index, maxWidth, maxHeight, options) {
		if (!this._docPreviews) {
			this._docPreviews = {};
		}
		var autoUpdate = options ? !!options.autoUpdate : false;
		var forAllClients = options ? !!options.broadcast : false;
		this._docPreviews[id] = {id: id, index: index, maxWidth: maxWidth, maxHeight: maxHeight, autoUpdate: autoUpdate, invalid: false};

		var docLayer = this._docLayer;
		if (docLayer._docType === 'text') {
			return;
		}
		else {
			var part = index;
			var tilePosX = 0;
			var tilePosY = 0;
			var tileWidth = docLayer._docWidthTwips;
			var tileHeight = docLayer._docHeightTwips;
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

		var dpiscale = L.getDpiScaleFactor();
		if (forAllClients) {
			dpiscale = 2; // some may be hidpi, and it is fine to send the hi-dpi slide preview to non-hpi clients
		}

		this._socket.sendMessage('tile ' +
							'nviewid=0' + ' ' +
							'part=' + part + ' ' +
							'width=' + maxWidth * dpiscale + ' ' +
							'height=' + maxHeight * dpiscale + ' ' +
							'tileposx=' + tilePosX + ' ' +
							'tileposy=' + tilePosY + ' ' +
							'tilewidth=' + tileWidth + ' ' +
							'tileheight=' + tileHeight + ' ' +
							'id=' + id + ' ' +
							'broadcast=' + (forAllClients ? 'yes' : 'no'));

		return {width: maxWidth, height: maxHeight};
	},

	getCustomPreview: function (id, part, width, height, tilePosX, tilePosY, tileWidth, tileHeight, options) {
		if (!this._docPreviews) {
			this._docPreviews = {};
		}
		var autoUpdate = options ? options.autoUpdate : false;
		this._docPreviews[id] = {id: id, part: part, width: width, height: height, tilePosX: tilePosX,
			tilePosY: tilePosY, tileWidth: tileWidth, tileHeight: tileHeight, autoUpdate: autoUpdate, invalid: false};

		var dpiscale = L.getDpiScaleFactor();

		this._socket.sendMessage('tile ' +
							'nviewid=0' + ' ' +
							'part=' + part + ' ' +
							'width=' + width * dpiscale + ' ' +
							'height=' + height * dpiscale + ' ' +
							'tileposx=' + tilePosX + ' ' +
							'tileposy=' + tilePosY + ' ' +
							'tilewidth=' + tileWidth + ' ' +
							'tileheight=' + tileHeight + ' ' +
							'id=' + id + ' ' +
							'broadcast=no');
	},

	removePreviewUpdate: function (id) {
		if (this._docPreviews && this._docPreviews[id]) {
			this._docPreviews[id].autoUpdate = false;
		}
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

		// 直接跳頁
		this._socket.sendMessage('setpage page=' + docLayer._currentPage);
		this.fire('pagenumberchanged', {
			currentPage: docLayer._currentPage,
			pages: docLayer._pages,
			docType: docLayer._docType
		});
	},

	insertPage: function(nPos) {
		if (this.getDocType() === 'presentation') {
			this._socket.sendMessage('uno .uno:InsertPage');
		}
		else if (this.getDocType() === 'spreadsheet') {
			this.forceCellCommit();
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

			this._socket.sendMessage('uno .uno:Insert ' + JSON.stringify(command));
		}
		else {
			return;
		}

		var docLayer = this._docLayer;

		this.fire('insertpage', {
			selectedPart: docLayer._selectedPart,
			parts:        docLayer._parts
		});

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
		if (this.getDocType() !== 'presentation') {
			return;
		}
		this._socket.sendMessage('uno .uno:DuplicatePage');
		var docLayer = this._docLayer;

		this.fire('insertpage', {
			selectedPart: docLayer._selectedPart,
			parts:        docLayer._parts
		});

		docLayer._parts++;
		this.setPart('next');
	},

	deletePage: function (nPos) {
		if (this.getDocType() === 'presentation') {
			this._socket.sendMessage('uno .uno:DeletePage');
		}
		else if (this.getDocType() === 'spreadsheet') {
			this.forceCellCommit();
			var command = {
				'Index': {
					'type': 'long',
					'value': nPos + 1
				}
			};

			this._socket.sendMessage('uno .uno:Remove ' + JSON.stringify(command));
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

		this.fire('deletepage', {
			selectedPart: docLayer._selectedPart,
			parts:        docLayer._parts
		});

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

	renamePage: function (name, nPos) {
		if (this.getDocType() === 'spreadsheet') {
			var command = {
				'Name': {
					'type': 'string',
					'value': name
				},
				'Index': {
					'type': 'long',
					'value': nPos + 1
				}
			};

			this._socket.sendMessage('uno .uno:Name ' + JSON.stringify(command));
			this.setPart(this._docLayer);
		}
	},

	showPage: function (sheetName) {
		if (this.getDocType() === 'spreadsheet' && this.hasAnyHiddenPart()) {
			this.forceCellCommit();
			var args = {
				'aTableName': {
					type: 'string',
					value: sheetName
				}
			};
			this._socket.sendMessage('uno .uno:Show ' + JSON.stringify(args));
		}
	},

	hidePage: function () {
		if (this.getDocType() === 'spreadsheet' && this.getNumberOfVisibleParts() > 1) {
			this.forceCellCommit();
			this._socket.sendMessage('uno .uno:Hide');
		}
	},

	// Add by Firefly <firefly@ossii.com.tw>
	// 檢查工作表名稱是否合法
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


	/*
	 * 取得文件檔名(含副檔名)
	 */
	getFileName: function() {
		var file = this.options.wopi ? this.wopi.BaseFileName : this.options.doc;
		var idx = file.lastIndexOf('/');
		return file.substr(idx + 1);
	},

	/*
	 * 取得文件檔名(不含副檔名)
	 */
	getDocName: function () {
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

	//---------------------------------------

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

	getNumberOfPages: function () {
		return this._docLayer._pages;
	},

	getNumberOfParts: function () {
		return this._docLayer._parts;
	},

	getNumberOfVisibleParts: function () {
		return this.getNumberOfParts() - this._docLayer.hiddenParts();
	},

	getHiddenPartNames: function () {
		var partNames = this._docLayer._partNames;
		var names = [];
		for (var i = 0; i < partNames.length; ++i) {
			if (this.isHiddenPart(i))
				names.push(partNames[i]);
		}
		return names.join(',');
	},

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
});
