/* -*- js-indent-level: 8 -*- */
/*

*/
/* global Admin $ SERVICE_ROOT */
Admin.SocketBroker({

	_module: null,

	// 完整的 API 位址
	_fullServiceURI: "",

	onSocketOpen: function() {
		this.socket.send('getModuleInfo'); // 發出取得模組資訊指令，回應由 onSocketMessage() 接收
		let helloBtn = document.getElementById('hello');
		helloBtn.onclick = function() {
			this.socket.send('sayHello');
		}.bind(this);
	},

	onSocketClose: function() {
		console.debug('on socket close!');
	},

	onSocketMessage: function(e) {
		let textMsg = e.data;
		if (typeof e.data !== 'string') {
			textMsg = '';
		}

		// 模組資訊
		if (textMsg.startsWith('moduleInfo '))  {
			let jsonIdx = textMsg.indexOf('{');
			if (jsonIdx > 0) {
				this._module = JSON.parse(textMsg.substring(jsonIdx));
				this._displayModuleInfo(); // 將模組資訊顯示在後臺管理畫面

			}
		// 回應訊息
		} else if (textMsg.startsWith('respond ')) {
			let spaceIdx = textMsg.indexOf(' ');
			alert(textMsg.substring(spaceIdx));
		}
	},

	_displayModuleInfo: function() {
		const table = document.getElementById('detial');
		const keys = [
			{key: 'name', exp: _('Name')},
			{key: 'serviceURI', exp: _('Service URI')},
			{key: 'version', exp: _('Version')},
			{key: 'summary', exp: _('Summary')},
			{key: 'author', exp: _('Author')},
			{key: 'license', exp: _('License')},
			{key: 'description', exp: _('Description')},
			{key: 'adminPrivilege', exp: _('Whether Service URI requires admin Privilege?')},
			{key: 'adminIcon', exp: _('Admin item icon')},
			{key: 'adminItem', exp: _('Admin item text')},
			{key: 'adminServiceURI', exp: _('Admin service URI')}
		];

		keys.forEach(function(item) {
			let row = table.insertRow();
			let colKey = row.insertCell();
			let colExp = row.insertCell();
			let colValue = row.insertCell();
			colKey.textContent = item.key;
			colExp.innerHTML = item.exp;
			colValue.textContent = this._module[item.key];
		}, this);
	}
});
