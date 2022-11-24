/* -*- js-indent-level: 8 -*- */
/*
 * L.dialog.AsyncClipboard
 *
 * Author: Firefly <firefly@ossii.com.tw>
 */
/* global app */
L.dialog.AsyncClipboard = {
	PERMISSIONS : [
		{ name: "clipboard-read" },
		{ name: "clipboard-write" }
		//{ name: "clipboard-read",  allowWithoutGesture: false },
		//{ name: "clipboard-read",  allowWithoutGesture: true  },
		//{ name: "clipboard-write", allowWithoutGesture: false },
		//{ name: "clipboard-write", allowWithoutGesture: true  }
	],

	// 選擇貼上來源的對話框
	_pasteSelectDialog: null,

	/// 可貼上權限
	_pasteState: '',

	toBlob: function(text, mimeType) {
		let content = [];
		let data = new Blob([text]);
		content.push(mimeType + '\n');
		content.push(data.size.toString(16) + '\n');
		content.push(data);
		content.push('\n');
		return new Blob(content);
	},

	/**
	 * 建立貼上來源選取對話框
	 */
	makePasteSelectDialog: function() {
		this._pasteSelectDialog = L.DomUtil.createWithId('div', '', document.body);

		let l10nOutside = _('Paste the device\'s clipboard contents.');
		let l10nInside = _('Paste the internally copied data.');

		this._pasteSelectDialog.innerHTML = `
		<div>
			<label>
				<input type="radio" name="pasteWhichOne" value="outside">
				<span _="${l10nOutside}"></span>
			</label>
		</div>
		<div style="width:100%;text-align:center;" _="or"></div>
		<div>
			<label>
				<input type="radio" name="pasteWhichOne" value="inside">
				<span _="${l10nInside}"></span>
			</label>
		</div>
		`;

		this._map.translationElement(this._pasteSelectDialog);

		let that = this;
		$(this._pasteSelectDialog).dialog({
			title: _('Paste which one?'),
			position: {my: 'center', at: 'center', of: window},
			minWidth: 200,
			autoOpen: false, // 不自動顯示對話框
			modal: true,
			resizable: false,
			draggable: true,
			closeOnEscape: true,
			buttons: [
				{
					text: _('OK'),
					click: function() {
						let which = this.querySelector('input[name=pasteWhichOne]:checked');
						// 有選取貼上來源
						if (which !== null) {
							let pasteFrom = which.value;
							let specialPasteCmd = $(this).attr('pastecommand');
							console.debug('Paste which one = ', pasteFrom, specialPasteCmd);
							if (pasteFrom === 'outside') {
								that.pasteFromOutside(specialPasteCmd);
							} else {
								that.pasteFromInside(specialPasteCmd);
							}
						}
						$(this).dialog('close');
					}
				},
				{
					text: _('Cancel'),
					click: function() {
						$(this).dialog('close');
					}
				}
			]
		});
	},

	/**
 	 * 查詢是否可讀取剪貼簿貼上
	 * @returns
	 */
	canBePaste: function() {
		// prompt - 詢問使用者是否允許
		// granted - 已由使用者授權
		// denied - 被使用者封鎖
		return this._pasteState !== 'denied';
	},

	/**
	 * 若 wopi 的 DisableCopy 啟用，則文件內所複製的資料，不會送到系統的剪貼簿，
	 * 會出現文件剪貼簿和系統剪貼簿不一樣的情況，此時若使用者執行貼上動作，需詢問使用者要貼上哪個剪貼簿
	 */
	pasteWhichOne: function(specialPasteCmd) {
		$(this._pasteSelectDialog).attr('pastecommand', specialPasteCmd).dialog('open');
	},

	paste: async function(specialPasteCmd = '.uno:Paste') {
		// 如果禁用複製到外部功能，則系統剪貼簿是沒有內部所複製的資料
		// 所以需詢問使用者，要貼上內部或外部資料
		if (this._map['wopi'].DisableCopy === true) {
			this.pasteWhichOne(specialPasteCmd);
		} else {
			this.pasteFromOutside(specialPasteCmd);
		}
	},

	/**
	 * 執行貼上指令，讓 OxOffice 貼上
	 * @param {string} specialPasteCmd - 特殊貼上指令，如:.uno:PasteUnformatted
	 */
	pasteFromInside: function(specialPasteCmd) {
		if (this._map.isUnoCommand(specialPasteCmd)) {
			app.socket.sendMessage('uno ' + specialPasteCmd);
		} else {
			app.socket.sendMessage('uno .uno:Paste');
		}
	},

	/**
	 * 讀取系統剪貼簿內容，傳到 OxOffice，當作 OxOffice 的剪貼簿內容
	 * 然後執行貼上指令，讓 OxOffice 貼上
	 * @param {string} specialPasteCmd - 特殊貼上指令，如:.uno:PasteUnformatted
	 */
	pasteFromOutside: async function(specialPasteCmd) {
		let that = this;
		try {
			const clipboardItems = await navigator.clipboard.read();
			console.debug('clipboardItems', clipboardItems);
			const clipboardItem = clipboardItems[0];
			const clipboardTypes = clipboardItem.types;
			console.debug('clipboardItems.types', clipboardTypes);

			let content = [];
			for (let i = 0 ; i < clipboardTypes.length ; ++i) {
				let type = clipboardTypes[i];
				let dataStr = await clipboardItem.getType(type);
				// 不要空的剪貼內容
				if (dataStr.length === 0)
					continue;

				let data = new Blob([dataStr]);
				console.debug('type ' + type + ' length ' + data.size +
				    ' -> 0x' + data.size.toString(16) + '\n');
				content.push(type + '\n');
				content.push(data.size.toString(16) + '\n');
				content.push(data);
				content.push('\n');
			}

			// 有讀到剪貼簿內容
			if (content.length > 0) {
				let clip = this._map._clip;
				let contentBlob = new Blob(content, {type : 'application/octet-stream', endings: 'transparent'});
				let formData = new FormData();
				formData.append('file', contentBlob);

				clip._doAsyncDownload('POST', clip.getMetaURL(), formData, false,
					function() {
						console.debug('Posted ' + contentBlob.size + ' bytes successfully');
						// do internal paste.
						// 執行內部貼上，前面只是把剪貼簿內容傳到 OxOffice，變成 OxOffice 的剪貼簿內容，
						// 所以要執行 OxOffice 真正的貼上指令，才會把OxOffice 的剪貼簿內容貼上文件。
						that.pasteFromInside(specialPasteCmd);
					},

					function(progress) {
						console.debug('progress : ', progress);
						return progress;
					}
				);
			} else {
				console.debug('Clipboard does not have required data type.("text/html" or "text/plain")');
			}
		} catch(e) {
			console.debug('Failed to read clipboard :', e);
		}
	},

	initialize: function() {
		let that = this;
		Promise.all(
			that.PERMISSIONS.map( descriptor => navigator.permissions.query(descriptor) )
		).then( permissions => {
			permissions.forEach( (status, index) => {
				// 監視讀取剪貼簿權限
				if (status.name === 'clipboard_read') {
					status.onchange = () => {
						that._pasteState = status.state;
						console.debug('clipboard_read status = ' + status.state);
					};
					status.onchange();
				}
			});
		});

		this.makePasteSelectDialog();
	},

	run: function(/*parameter*/) {
		// Do nothing.
	},
};
