/* -*- js-indent-level: 8 -*- */
/**
 * L.Control.Dialogs
 *
 * @author Firefly <firefly@ossii.com.tw>
 * @description
 */
/* global L $ _*/
L.Control.Dialogs = L.Control.extend({
	options: {
	},

	_ref: undefined,

	/**
	 * 初始化 Control 元件
	 * @author Firefly <firefly@ossii.com.tw>
	 * @public
	 */
	initialize: function() {
		this._ref = document.getElementsByTagName('script')[0];
		// 紀錄目前已經載入的 dialog (借用 Global 物件 'L')
		L.dialog = {};
		// 實作 confirm 對話框
		L.dialog.confirm = this._confirmDialog.bind(this);
		// 實作 alert 對話框
		L.dialog.alert = this._alertDialog.bind(this);
		// 實作 prompt 對話框
		L.dialog.prompt = this._promptDialog.bind(this);
		// 新增載入並執行外部 javascript
		L.dialog.run = function(dialogName, args) {
			var e = $.extend(true, {}, args);
			e.dialog = dialogName;
			this._onExecuteDialog(e);
		}.bind(this);
	},

	/**
	 *
	 * @param {object} map - 公用 map 物件
	 */
	onAdd: function(map) {
		map.on('executeDialog', this._onExecuteDialog, this);
	},

	onRemove: function(/*map*/) {
		this._map.off('executeDialog', this._onExecuteDialog, this);
	},

	/**
	 * 動態載入並執行外部 javascript 程式碼
	 * @author Firefly <firefly@ossii.com.tw>
	 * @private
	 * @param {object} e
	 * @param {string} e.dialog - 外部 javascript 程式名稱(不含副檔名.js)
	 */
	_onExecuteDialog: function(e) {
		// 第一次呼叫的話，載入該 dialog
		if (L.dialog[e.dialog] === undefined) {
			var dialogURL = 'uiconfig/dialogs/' + e.dialog + '.js';
			var script = document.createElement('script');
			script.type = 'text/javascript';
			script.charset = 'UTF-8';
			script.src = dialogURL;
			//script.onreadystatechange = this._callback;
			script.onload = function() {
				this._dialogRun(e.dialog, e, true);
			}.bind(this);
			this._ref.parentNode.insertBefore(script, this._ref);
		} else {
			this._dialogRun(e.dialog, e, false);
		}
	},

	// 若該 dialog 有 run 函數，就把參數傳過去
	// id : dialog id
	// parameter : 以 map.fire('executeDialog', {dialog:'xxxx', .....}) 呼叫所傳遞的參數
	// isInit : 的話，先把 map 傳給 init 函數
	_dialogRun: function(id, parameter, isInit) {
		var handler = L.dialog[id];

		if (typeof handler === 'object') {

			if (isInit === true) {
				handler._map = this._map; // 把 _map 指定給這個 dialog
				if (typeof handler.initialize === 'function') {
					handler.initialize();
				}
				if (typeof handler.init === 'function') {
					handler.init(this._map);
				}
			}

			if (typeof handler.run === 'function') {
				handler.run(parameter);
			}
		}
	},

	/**
	 * Confirm 對話框
	 *
	 * @author Firefly <firefly@ossii.com.tw>
	 *
	 * @param {object} userPpropertys - confirm dialog's propertys
	 * @param {string} [userPpropertys.icon] - error, information, question, success, warning
	 * @param {string} [userPpropertys.title] - 對話框標題
	 * @param {string} [userPpropertys.message] - 訊息內容，可以是 html 或 text
	 * @param {function} [userPpropertys.callback] - 回呼函式，會傳回 boolean， true:按確定，false:按取消
	 */
	_confirmDialog: function(userPpropertys) {
		var prop = this._defaultPropertys(userPpropertys);

		prop.buttons = [
			{
				text: _('OK'),
				click: function() {
					$(this).dialog('close');
					prop.callback(true);
				}
			},
			{
				text: _('Cancel'),
				click: function() {
					$(this).dialog('close');
					prop.callback(false);
				}
			}
		];
		var dialog = L.DomUtil.create('div', '', document.body);
		dialog.style.display = 'none';
		dialog.innerHTML = prop.message;

		$(dialog).dialog(prop);
		return dialog;
	},

	/**
	 * alert 對話框
	 *
	 * @author Firefly <firefly@ossii.com.tw>
	 *
	 * @param {object} userPpropertys - alert dialog's propertys
	 * @param {string} [userPpropertys.icon] - error, information, question, success, warning
	 * @param {string} [userPpropertys.title] - 對話框標題
	 * @param {string} [userPpropertys.message] - 訊息內容，可以是 html 或 text
	 */
	_alertDialog: function(userPpropertys) {
		var prop = this._defaultPropertys(userPpropertys);
		prop.buttons = [
			{
				text: _('OK'),
				click: function() {
					$(this).dialog('close');
				}
			},
		];

		var dialog = L.DomUtil.create('div', '', document.body);
		dialog.style.display = 'none';
		dialog.innerHTML = prop.message;

		$(dialog).dialog(prop);
	},

	/**
	 * Prompt 對話框
	 *
	 * @author Firefly <firefly@ossii.com.tw>
	 *
	 * @param {object} userPpropertys - confirm dialog's propertys
	 * @param {string} [userPpropertys.icon] - error, information, question, success, warning
	 * @param {string} [userPpropertys.title] - 對話框標題
	 * @param {string} [userPpropertys.message] - 訊息內容，可以是 html 或 text
	 * @param {boolean} [userPpropertys.password] - 是否密碼欄位
	 * @param {any} [userPpropertys.default] - 預設值
	 * @param {function} [userPpropertys.callback] - 回呼函式，會傳回輸入的資料， 若按取消則是 null
	 */
	_promptDialog: function(userPropertys) {
		var dialog = L.DomUtil.create('div', '', document.body);
		var form = L.DomUtil.create('form', ''); // 建立 form
		var textInput = L.DomUtil.create('input', '', form); // 建立文字輸入
		var submit = L.DomUtil.create('submit', '', form); // 建立 submit 按 enter 就能完成輸入
		var prop = this._defaultPropertys(userPropertys);

		// 指定輸入類別
		textInput.setAttribute('type', (prop.password === true ? 'password' : 'text'));

		submit.tabIndex = -1; // 禁止鍵盤用 tab 聚焦
		submit.style.display = 'none'; // 不顯示
		// 送出表單就關閉 dialog
		form.onsubmit = function(e) {
			e.preventDefault();
			$(dialog).dialog('close');
			prop.callback(textInput.value);
		};

		prop.buttons = [
			{
				text: _('OK'),
				click: function() {
					$(this).dialog('close');
					prop.callback(textInput.value);
				}
			},
			{
				text: _('Cancel'),
				click: function() {
					$(this).dialog('close');
					prop.callback(null);
				}
			}
		];

		dialog.style.display = 'none';
		dialog.innerHTML = prop.message + '<br>';
		dialog.appendChild(form);
		textInput.value = prop.default; // 指定預設值

		$(dialog).dialog(prop);
	},

	/**
	 * 將使用者的 propertys 結合預設的 property
	 */
	_defaultPropertys: function(userPropertys) {
		var newPropertys = $.extend(true, {}, userPropertys);
		var icon = this._getDialogIcon(newPropertys.icon);

		if (newPropertys.message === undefined) {
			newPropertys.message = '';
		}

		if (icon) {
			newPropertys.message = '<img src="' + icon
				+ '" style="float:left;width:32px;height:32px;margin-right:8px;">'
				+ newPropertys.message;
		}

		if (newPropertys.default === undefined) {
			newPropertys.default = '';
		}

		// 關閉按鈕的文字
		if (newPropertys.closeText === undefined) {
			newPropertys.closeText = _('Close');
		}
		// 顯示位置
		if (newPropertys.position === undefined) {
			newPropertys.position = {my: 'center', at: 'center', of: window};
		}
		// 是否自動顯示對話框
		if (newPropertys.autoOpen === undefined) {
			newPropertys.autoOpen = true;
		}
		// 是否獨占模式
		if (newPropertys.modal === undefined) {
			newPropertys.modal = true;
		}
		// 能否縮放
		if (newPropertys.resizable === undefined) {
			newPropertys.resizable = false;
		}
		// 能否拖曳視窗
		if (newPropertys.draggable === undefined) {
			newPropertys.draggable = true;
		}
		// 按 esc 視同關閉視窗
		if (newPropertys.closeOnEscape === undefined) {
			newPropertys.closeOnEscape = true;
		}
		// Dialog 建構完成執行這裡
		if (newPropertys.create === undefined) {
			newPropertys.create = function(e) {
				// 如果未指定 title 的話，隱藏 title bar
				if (!$(this).dialog('option', 'title')) {
					$(e.target.parentNode.childNodes[0]).hide();
				}
			};
		}
		// 沒有指定 callback 函數
		if (typeof newPropertys.callback !== 'function') {
			newPropertys.callback = $.noop;
		}
		// Dialog 關閉後執行這裡
		if (newPropertys.close === undefined) {
			newPropertys.close = function(e/*, ui*/) {
				// 對話框關閉就徹底移除，下次要重新建立
				$(this).dialog('destroy').remove();
				// 關閉 dialog 是因為按下 Esc 引起的
				if (e.keyCode === 27) {
					newPropertys.callback(null);
				}
			};
		}

		// 設定寬度與高度
		newPropertys.height = 'auto';
		newPropertys.minHeight = 'none';
		return newPropertys;
	},

	_getDialogIcon: function(type) {
		var iconSet = {
			error: 'errorbox.svg',
			information: 'infobox.svg',
			question: 'querybox.svg',
			success: 'successbox.svg',
			warning: 'warningbox.svg'
		};

		if (typeof type == 'string') {
			var icon = iconSet[type.toLowerCase()];
			if (icon !== undefined) {
				return L.Icon.Default.imagePath + '/res/' + icon;
			}
		}
		return null;
	}
});

L.control.dialogs = function (options) {
	return new L.Control.Dialogs(options);
};
