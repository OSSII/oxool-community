/* -*- js-indent-level: 8 -*- */
/*
 * L.dialog.AsyncClipboard
 *
 * Author: Firefly <firefly@ossii.com.tw>
 */
/* global app */
L.dialog.AsyncClipboard = {
	PERMISSIONS : [
		{ name: "clipboard-write" },
		{ name: "clipboard-read" },
		//{ name: "clipboard-read",  allowWithoutGesture: false },
		//{ name: "clipboard-read",  allowWithoutGesture: true  },
		//{ name: "clipboard-write", allowWithoutGesture: false },
		//{ name: "clipboard-write", allowWithoutGesture: true  }
	],

	_debug: true,

	_clipboardState: {
		write: '', // 寫入剪貼簿權限
		read: '', // 讀取剪貼簿權限
	},

	_l10n: [
		// 貼上哪個來源
		_('Paste which one?'),
		// 貼上剪貼簿內容
		_('Paste the device\'s clipboard contents.'),
		// 或是
		_('or'),
		// 貼上內部複製資料
		_('Paste the internally copied data.'),
		// 無法貼上剪貼簿內容
		_('Unable to paste clipboard contents'),
		// 您的瀏覽器不支援讀取剪貼簿內容
		_('Your browser does not support the ability to paste clipboard content.'),
		// 僅能貼上文件內部所複製的資料
		_('Only data copied inside the document can be pasted.'),
		// 知道了
		_('Understood'),
		// 解決這個問題
		_('Solve the problem'),
		// 不再提醒
		_('Do not remind.'),
	],

	// 選擇貼上來源的對話框
	_pasteSelectDialog: null,

	/**
	 * 建立貼上來源選取對話框
	 *
	 * 當 wopi.DisableCopy === true 時，內部複製/剪下的資料，不會存入系統剪貼簿內
	 * 而使用者要執行貼上行為時，必須詢問使用者要貼上哪個來源
	 */
	makePasteSelectDialog: function() {
		this._pasteSelectDialog = L.DomUtil.create('div', '', document.body);
		this._pasteSelectDialog.innerHTML = `
		<div>
			<label>
				<input type="radio" name="pasteWhichOne" value="outside">
				<span _="Paste the device's clipboard contents."></span>
			</label>
		</div>
		<div _="or"></div>
		<div>
			<label>
				<input type="radio" name="pasteWhichOne" value="inside">
				<span _="Paste the internally copied data."></span>
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

	// 僅能貼上文件內部所複製的資料對話框
	_pasteInternalDialog: null,
	// 已經通知過只能貼上內部資料
	_pasteInternalUnderstood: false,

	/**
	 * 建立僅能貼上文件內部所複製的資料對話框
	 *
	 * 當 wopi.DisableCopy === true 時，內部複製/剪下的資料，不會存入系統剪貼簿內
	 * 且瀏覽器剪貼簿 API 又不支援讀取時，需要通知使用者，此時僅能貼上文件內部所複製的資料
	 */
	makePasteInternalDialog: function() {
		this._pasteInternalDialog = L.DomUtil.create('div', '', document.body);
		this._pasteInternalDialog.innerHTML = `<p>
		<span _="Your browser does not support the ability to paste clipboard content."></span>
		<span _="Only data copied inside the document can be pasted."></span>
		</p>
		<p><label><input type="checkbox" name="noNotification"><span _="Do not remind."></span></label></p>
		`;
		this._map.translationElement(this._pasteInternalDialog);

		let that = this;
		$(this._pasteInternalDialog).dialog({
			title: _('Unable to paste clipboard contents'),
			position: {my: 'center', at: 'center', of: window},
			minWidth: 200,
			autoOpen: false, // 不自動顯示對話框
			modal: true,
			resizable: false,
			draggable: true,
			closeOnEscape: true,
			buttons: [
				{
					text: _('Understood'),
					click: function() {
						let specialPasteCmd = $(this).attr('pastecommand');
						that.pasteFromInside(specialPasteCmd);
						$(this).dialog('close');
						let noNotification = this.querySelector('input[type=checkbox]:checked');
						if (noNotification !== null)
							that._pasteInternalUnderstood = true;
					}
				}/* , TODO: 按下這個按鈕後，顯示解決貼上剪貼簿的解說網頁
				{
					text: _('Solve the problem'),
					click: function() {
						$(this).dialog('close');
					}
				} */
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
		//return this._clipboardState.read !== 'denied';
		return true;
	},

	/**
	 * 若 wopi 的 DisableCopy 啟用，則文件內所複製的資料，不會送到系統的剪貼簿，
	 * 會出現文件剪貼簿和系統剪貼簿不一樣的情況，此時若使用者執行貼上動作，需詢問使用者要貼上哪個剪貼簿
	 */
	pasteWhichOne: function(specialPasteCmd) {
		// 剪貼簿讀取權限不是未知狀態，就詢問使用者貼上哪個來源
		if (this._clipboardState.read !== 'unknown') {
			$(this._pasteSelectDialog).attr('pastecommand', specialPasteCmd).dialog('open');
		} else { // 否則通知使用者，只能貼上文件內部所複製的資料
			// 沒通知過就顯示對話框通知使用者
			if (!this._pasteInternalUnderstood) {
				$(this._pasteInternalDialog).attr('pastecommand', specialPasteCmd).dialog('open');
			} else { // 直接執行內部貼上
				this.pasteFromInside(specialPasteCmd);
			}
		}
	},

	paste: function(specialPasteCmd = '.uno:Paste') {
		this.screenLog('clipboardState:', this._clipboardState);
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
			this.screenLog('clipboardItems', clipboardItems);
			const clipboardItem = clipboardItems[0];
			const clipboardTypes = clipboardItem.types;
			this.screenLog('clipboardItems.types', clipboardTypes);

			let content = [];
			for (let i = 0 ; i < clipboardTypes.length ; ++i) {
				let type = clipboardTypes[i];
				let dataStr = await clipboardItem.getType(type);
				// 不要空的剪貼內容
				if (dataStr.length === 0)
					continue;

				let data = new Blob([dataStr]);
				this.screenLog('type ' + type + ' length ' + data.size +
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
						this.screenLog('Posted ' + contentBlob.size + ' bytes successfully');
						// do internal paste.
						// 執行內部貼上，前面只是把剪貼簿內容傳到 OxOffice，變成 OxOffice 的剪貼簿內容，
						// 所以要執行 OxOffice 真正的貼上指令，才會把OxOffice 的剪貼簿內容貼上文件。
						that.pasteFromInside(specialPasteCmd);
					},

					function(progress) {
						this.screenLog('progress : ', progress);
						return progress;
					}
				);
			} else {
				this.screenLog('Clipboard does not have required data type.("text/html" or "text/plain")');
			}
		} catch(e) { // 貼上剪貼簿內容發生錯誤
			this.screenLog('Failed to read clipboard :', e);
			// 手機或平板，通知使用者，只能貼上文件內部所複製的資料
			if (window.mode.isMobile() || window.mode.isTablet()) {
				// 沒通知過就顯示對話框通知使用者
				if (!that._pasteInternalUnderstood) {
					$(that._pasteInternalDialog).attr('pastecommand', specialPasteCmd).dialog('open');
				} else { // 直接執行內部貼上
					that.pasteFromInside(specialPasteCmd);
				}
			} else { // 電腦，通知使用者改用 Ctrl + v
				that._map._clip._warnCopyPaste();
			}
		}
	},

	/**
	 * 初始化非同步剪貼簿 API 功能
	 */
	initialize: function() {
		// 製作貼上來源選擇的 Dialog，只有在 wopi.DisableCopy === true 時需要用
		this.makePasteSelectDialog();
		// 製作通知只能內部貼上的 Dialog
		this.makePasteInternalDialog();

		let that = this;
		// 查詢剪貼簿寫入及讀取權限
		for (let perm of this.PERMISSIONS) {
			navigator.permissions.query(perm).then(function(status) {
				switch (perm.name) {
					case 'clipboard-write': // 寫入剪貼簿權限
						that._clipboardState.write = status.state;
						status.onchange = function(e) {
							that._clipboardState.write = e.target.state;
						};
						break;
					case 'clipboard-read': // 讀取剪貼簿權限
						that._clipboardState.read = status.state;
						status.onchange = function(e) {
							that._clipboardState.read = e.target.state;
						};
						break;
					default:
						// nothing to do.
						break;
				}
			// 查詢失敗就將權限設爲 'unknown'
			}).catch(function(e) {
				this.screenLog('Permission query fail:', e);
				if (perm.name === 'clipboard-write') {
					that._clipboardState.write = 'unknown';
				} else if (perm.name === 'clipboard-read') {
					that._clipboardState.read = 'unknown';
				}
			});
		}

		this.screenLog("async clipboard initialize:", this._clipboardState);

	},

	screenLog: function(msg, data) {
		// 桌面環境直接顯示在 console.debug()
		if (window.mode.isDesktop() || this._debug === false) {
			console.debug(msg, data);
			return;
		}

		// 建立一個螢幕區塊
		const consoleId = 'console-debug';
		let screenConsole = document.getElementById(consoleId);

		if (screenConsole === null) {
			screenConsole = L.DomUtil.createWithId('div', consoleId, document.body);
			screenConsole.style.width  = '100%';
			screenConsole.style.height = "50px";
			screenConsole.style.overflow = 'auto';
			screenConsole.style.position = 'absolute';
			screenConsole.style.left = '0px';
			screenConsole.style.bottom = '50px';
			screenConsole.style.backgroundColor = "#ffffff";
			screenConsole.style.color = 'blue';
		}

		screenConsole.innerHTML += '<br>' + msg + (typeof(data) === 'object' ? JSON.stringify(data) : data);
	},

	run: function(/*parameter*/) {
		// Do nothing.
	},
};
