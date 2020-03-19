/* -*- js-indent-level: 8 -*- */
/*
 * L.Control.Dialogs
 */
/* global L */
L.Control.Dialogs = L.Control.extend({
	options: {
	},

	_ref: undefined,

	onAdd: function (map) {
		this._ref = document.getElementsByTagName('script')[0];
		// 紀錄目前已經載入的 dialog (借用 Global 物件 'L')
		L.dialog = {};
		map.on('executeDialog', this._onExecuteDialog, this);
	},

	onRemove: function (/*map*/) {
		this._map.off('executeDialog', this._onExecuteDialog, this);
	},

	/* Private methods */
	_onExecuteDialog: function (e) {
		// 第一次呼叫的話，載入該 dialog
		if (L.dialog[e.dialog] === undefined) {
			var that = this;
			var dialogURL = 'uiconfig/dialogs/' + e.dialog + '.js';
			var script = document.createElement('script');
			script.type = 'text/javascript';
			script.charset = 'UTF-8';
			script.src = dialogURL;
			//script.onreadystatechange = this._callback;
			script.onload = function() {
				that._dialogRun(e.dialog, e, true);
			}
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

			if (isInit === true && typeof handler.init === 'function')
				handler.init(this._map);

			if (typeof handler.run === 'function')
				handler.run(parameter);
		}
	},
});

L.control.dialogs = function (options) {
	return new L.Control.Dialogs(options);
};
