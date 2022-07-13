/* -*- js-indent-level: 8 -*- */
/*
 * L.Control.DocumentNameInput
 */

/* global $ _ L */
L.Control.DocumentNameInput = L.Control.extend({

	_hasWopi: false,

	_nameInput: null,

	onAdd: function (map) {
		this.map = map;

		this._nameInput = L.DomUtil.get('document-name-input');

		this._nameInput.removeAttribute('disabled'); // 強制移除 disabled 屬性
		this._nameInput.setAttribute('autocomplete', 'off'); // 關掉自動完成

		map.on('doclayerinit', this.onDocLayerInit, this);
		map.on('wopiprops', this.onWopiProps, this);
		map.on('updatepermission', this.onUpdatePermission, this);
	},

	onRemove: function() {
		this.map.off('doclayerinit', this.onDocLayerInit, this);
		this.map.off('wopiprops', this.onWopiProps, this);
		this.map.off('updatepermission', this.onUpdatePermission, this);
	},

	documentNameConfirm: function() {
		var value = $(this._nameInput).val();
		// 檔名有變更
		if (value !== null && value != '' && value != this._getFileName()) {
			// 如果是 WOPI 協定
			if (this._hasWopi) {
				if (this.map['wopi'].UserCanRename && this.map['wopi'].SupportsRename) {
					if (value.lastIndexOf('.') > 0) {
						var fname = this.map['wopi'].BaseFileName;
						var ext = fname.substr(fname.lastIndexOf('.')+1, fname.length);
						// check format conversion
						if (ext != value.substr(value.lastIndexOf('.')+1, value.length)) {
							this.map.saveAs(value);
						} else {
							// same extension, just rename the file
							// file name must be without the extension for rename
							value = value.substr(0, value.lastIndexOf('.'));
							this.map.renameFile(value);
						}
					}
				} else {
					// saveAs for rename
					this.map.saveAs(value);
				}
			} else {
				// TODO: non wopi rename/saveas flow.
			}
		}
		this.map._onGotFocus();
	},

	documentNameCancel: function() {
		$(this._nameInput).val(this._getFileName());
		this.map._onGotFocus();
	},

	onDocumentNameKeyPress: function(e) {
		if (e.keyCode === 13) { // Enter key
			this.documentNameConfirm();
		} else if (e.keyCode === 27) { // Escape key
			this.documentNameCancel();
		}
	},

	onDocumentNameFocus: function() {
		// hide the caret in the main document
		this.map._onLostFocus();
		var name = this._getFileName();
		var extn = name.lastIndexOf('.');
		if (extn < 0)
			extn = name.length;
		$(this._nameInput).val(name);
		$(this._nameInput)[0].setSelectionRange(0, extn);
	},

	onDocLayerInit: function() {

		var el = $(this._nameInput);

		try {
			var fileNameFullPath = new URL(
				new URLSearchParams(window.location.search).get('WOPISrc')
			)
				.pathname
				.replace('/wopi/files', '');

			var basePath = fileNameFullPath.replace(this.map['wopi'].BaseFileName , '').replace(/\/$/, '');
			var title = this.map['wopi'].BaseFileName + '\n' + _('Path') + ': ' + basePath;

			el.prop('title', title);
		} catch (e) {
			// purposely ignore the error for legacy browsers
		}

		// FIXME: Android app would display a temporary filename, not the actual filename
		if (window.ThisIsTheAndroidApp) {
			el.hide();
		} else {
			el.show();
		}

		if (window.ThisIsAMobileApp) {
			// We can now set the document name in the menu bar
			el.prop('disabled', false);
			el.removeClass('editable');
			el.focus(function() { $(this).blur(); });
			// Call decodeURIComponent twice: Reverse both our encoding and the encoding of
			// the name in the file system.
			el.val(decodeURIComponent(decodeURIComponent(this.map.options.doc.replace(/.*\//, '')))
							  // To conveniently see the initial visualViewport scale and size, un-comment the following line.
							  // + ' (' + window.visualViewport.scale + '*' + window.visualViewport.width + 'x' + window.visualViewport.height + ')'
							  // TODO: Yes, it would be better to see it change as you rotate the device or invoke Split View.
							 );
		}
	},

	onWopiProps: function(/* e */) {
		this._hasWopi = true;
		$(this._nameInput).val(this._getFileName()); // 文件名稱
	},

	/**
	 * 依據是否可編輯決定文件名稱欄位是否唯讀
	 * @param {object} e - 'onupdatepermission' 事件
	 */
	onUpdatePermission: function(e) {
		var readonly = (e.perm !== 'edit'); // 預設可編輯狀態時，可以輸入文件名稱

		$(this._nameInput).val(this._getFileName()); // 文件名稱

		// 如果非唯讀，再考慮 WOPI 是否禁止另存新檔或是改檔名
		if (!readonly && this._hasWopi) {
			// WOPI 指定不能另存新檔的話，或是不能改名的話，文件名稱就禁止輸入
			readonly = (this.map['wopi'].UserCanNotWriteRelative === true || this.map['wopi'].UserCanRename !== true);
		}

		if (readonly) {
			$(this._nameInput).prop('readonly', true);
			$(this._nameInput).off('keypress', this.onDocumentNameKeyPress);
			$(this._nameInput).off('focus', this.onDocumentNameFocus);
			$(this._nameInput).off('blur', this.documentNameCancel);
		} else {
			$(this._nameInput).prop('readonly', false);
			$(this._nameInput).off('keypress', this.onDocumentNameKeyPress).on('keypress', this.onDocumentNameKeyPress.bind(this));
			$(this._nameInput).off('focus', this.onDocumentNameFocus).on('focus', this.onDocumentNameFocus.bind(this));
			$(this._nameInput).off('blur', this.documentNameCancel).on('blur', this.documentNameCancel.bind(this));
		}
	},

	_getMaxAvailableWidth: function() {
		var x = $(this._nameInput).prop('offsetLeft') + $('.document-title').prop('offsetLeft') + $(this._nameInput).prop('offsetLeft');
		var containerWidth = parseInt($('.main-nav').css('width'));
		var maxWidth = Math.max(containerWidth - x - 30, 0);
		maxWidth = Math.max(maxWidth, 300); // input field at least 300px
		return maxWidth;
	},

	_getFileName: function() {
		return this._hasWopi ? this.map['wopi'].BaseFileName :
			decodeURIComponent(decodeURIComponent(this.map.options.doc.replace(/.*\//, '')));
	}

});

L.control.documentNameInput = function () {
	return new L.Control.DocumentNameInput();
};
