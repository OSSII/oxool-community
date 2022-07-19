/* -*- js-indent-level: 8 -*- */
/**
 * L.Control.AlternativeCommand
 *
 * 指令替代機制
 * 有些指令無法直接執行，需要替代程序模擬出相同功能
 *
 * @author Firefly <firefly@ossii.com.tw>
 */

/* global L _ app */
L.Control.AlternativeCommand = L.Control.extend({

	onAdd: function(map) {
		this._map = map;
		this._commands._map = map;
	},

	/**
	 * 查詢有無指定的替代指令
	 * @param {string} orignalCommand: 指令名稱
	 * @returns {boolean} true:有, false: 無
	 */
	has: function(orignalCommand) {
		return typeof(this._commands[orignalCommand]) === 'function';
	},

	/**
	 *	取得替代指令
	 * @param {string} orignalCommand: 指令名稱
	 * @returns {function} 替代指令的函數
	 */
	get: function(orignalCommand) {
		if (this.has(orignalCommand)) {
			return this._commands[orignalCommand];
		}
	},

	/**
	 * 執行替代指令
	 * @param {string} orignalCommand: 指令名稱
	 * @param {object} json: 物件
	 * @returns {boolean} true: 已執行, false: 未執行
	 */
	run: function(orignalCommand, json) {
		if (this.has(orignalCommand)) {
			this._commands[orignalCommand]({
				commandName: orignalCommand,
				json: json
			});
			window.app.console.debug('Alternative command(%s), target:', orignalCommand, this._commands[orignalCommand]);
			return true;
		}
		return false;
	},

	/**
	 * 新增替代指令
	 * @param {string} cmd: 指令名稱
	 * @param {*} func: 函數
	 * @returns {boolean} true: success, false: fail
	 */
	add: function(cmd, func) {
		// 已存在或格式不符
		if (this.has(cmd) || typeof cmd !== 'string' || typeof func !== 'function') {
			return false;
		}

		this._commands[cmd] = func;
		return true;
	},

	/**
	 * 移除替代指令
	 * @param {string} cmd: 指令名稱
	 */
	remove: function(cmd) {
		if (this.has(cmd)) {
			delete this._command[cmd];
		}
	},

	_commands: {
		_map: null,

		/**
		 * 存檔
		 */
		'.uno:Save': function() {
			// Save only when not read-only.
			if (!this._map.isPermissionReadOnly()) {
				this._map.fire('postMessage', {msgId: 'UI_Save'});
				if (!this._map._disableDefaultAction['UI_Save']) {
					this._map.save(false, false);
				}
			}
		},
		/**
		 * 另存新檔
		 */
		'.uno:SaveAs': function() {
			this._map.openSaveAs();
		},
		/**
		 * 分享
		 */
		'ShareAs': function() {
			this._map.openShare();
		},
		/**
		 * 檢視修訂紀錄
		 */
		'rev-history': function() {
			this._map.openRevisionHistory();
		},
		/**
		 * 修復
		 */
		'Repair': function() {
			app.socket.sendMessage('commandvalues command=.uno:DocumentRepair');
		},
		/**
		 * 列印
		 */
		'.uno:Print': function() {
			this._map.print();
		 },
		/**
		 * 關閉檔案
		 */
		'.uno:CloseDoc': function() {
			this._map.closeDocument();
		},
		/**
		 * 編輯檔案
		 */
		'.uno:EditDoc': function() {
			// 如果有任何更改，先存檔，否則會 crash
			if (this._map._everModified) {
				this._map.save(true, true);
			}
			this._map.sendUnoCommand('.uno:EditDoc');
		},
		'.uno:FullScreen': function() {
			L.toggleFullScreen();
		},
		/**
		 * 拉遠
		 */
		'.uno:ZoomMinus': function() {
			if (this._map.getZoom() > this._map.getMinZoom()) {
				this._map.zoomOut(1, null, true /* animate? */);
			}
		},
		/**
		 * 拉近
		 */
		'.uno:ZoomPlus': function() {
			if (this._map.getZoom() < this._map.getMaxZoom()) {
				this._map.zoomIn(1, null, true /* animate? */);
			}
		},
		/**
		 * 重設遠近
		 */
		'.uno:Zoom100Percent': function() {
			this._map.setZoom(this._map.options.zoom, null, true);
		},
		/**
		 * 插入電腦(本地)圖片
		 */
		'.uno:InsertGraphic': function() {
			L.DomUtil.get('insertgraphic').click();
		},
		/**
		 * 以外部工具編輯
		 */
		'.uno:ExternalEdit': function() {
			app.socket.sendMessage('getgraphicselection id=edit');
		},
		/**
		 * 儲存(下載)文件中的圖片
		 */
		'.uno:SaveGraphic': function() {
			app.socket.sendMessage('getgraphicselection id=export');
		},
		/**
		 * 插入特殊符號
		 */
		'.uno:InsertSymbol': function() {
			L.dialog.run('CommonSymbols');
		},
		/**
		 * 插入/修改超連結
		 */
		'.uno:HyperlinkDialog': function(e) {
			// 手機界面不一樣
			if (window.mode.isMobile()) {
				this._map.showHyperlinkDialog();
			} else {
				this._map.sendUnoCommand(e.commandName);
			}
		},
		/**
		 * 修改超連結
		 * @param {*} e
		 */
		'.uno:EditHyperlink': function(e) {
			this['.uno:HyperlinkDialog'](e);
		},
		/**
		 * 修改圖案超連結
		 * @param {*} e
		 */
		'.uno:EditShapeHyperlink': function(e) {
			this['.uno:HyperlinkDialog'](e);
		},
		/**
		 * writer: 前往頁面
		 */
		'.uno:GotoPage': function() {
			L.dialog.run('GotoPage');
		},
		/**
		 * 插入註解
		 */
		'.uno:InsertAnnotation': function() {
			this._map.insertComment();
		},
		/**
		 * calc: 插入工作表
		 */
		'.uno:Insert': function() {
			L.dialog.run('InsertTable');
		},
		/**
		 * calc: 從結尾插入工作表
		 */
		'.uno:Add': function() {
			L.dialog.run('AddTableAtEnd');
		},
		/**
		 * calc: 刪除工作表
		 */
		'.uno:Remove': function() {
			var currPart = this._map.getCurrentPartNumber();
			var currName = this._map._docLayer._partNames[currPart];
			L.dialog.confirm({
				icon: 'warning',
				message: _('Are you sure you want to delete sheet, %sheet% ?').replace('%sheet%', currName),
				callback: function(ans) {
					if (ans) {
						this._map.deletePage(currPart);
					}
				}.bind(this)
			});

		},
		/**
		 * 重新命名工作表
		 */
		'.uno:RenameTable': function() {
			var currPart = this._map.getCurrentPartNumber();
			// 工作表被保護就不能重新命名
			if (this._map.isPartProtected(currPart)) {
				return;
			}

			var currName = this._map._docLayer._partNames[currPart];
			L.dialog.prompt({
				icon: 'question',
				message: _('Enter new sheet name'),
				default: currName,
				callback: function(data) {
					// 有輸入資料
					if (data !== null) {
						if (this._map.isSheetnameValid(data, currPart)) {
							this._map.renamePage(data, currPart);
						} else {
							L.dialog.alert({
								icon: 'error',
								message: _('Invalid sheet name.\nThe sheet name must not be empty or a duplicate of \nan existing name and may not contain the characters [ ] * ? : / \\ \nor the character \' (apostrophe) as first or last character.')
							});
						}
					}
				}.bind(this)
			});
		},
		/**
		 * 移動或複製工作表
		 */
		'.uno:Move': function() {
			L.dialog.run('MoveTable');
		},
		/**
		 * 顯示工作表
		 */
		'.uno:Show': function() {
			L.dialog.run('ShowTable');
		},
		/**
		 * impress: 從第一張投影片開始播放
		 */
		'.uno:Presentation': function() {
			this._map.fire('fullscreen');
		},
		/**
		 * impress: 從目前投影片開始播放
		 */
		'.uno:PresentationCurrentSlide': function() {
			this._map.fire('fullscreen', {startSlideNumber: this._map.getCurrentPartNumber()});
		},
		/**
		 * 顯示線上說明
		 */
		'online-help': function() {
			L.dialog.run('ShowHelp', {id: 'online-help'});
		},
		/**
		 * 顯示鍵盤快捷鍵說明
		 */
		'keyboard-shortcuts': function() {
			L.dialog.run('ShowHelp', {id: 'keyboard-shortcuts'});
		},
		/**
		 * 顯示「關於」對話框
		 */
		'about': function() {
			this._map.showLOAboutDialog();
		}
	},
});

L.control.alternativeCommand = function() {
	return new L.Control.AlternativeCommand;
};
