/* -*- js-indent-level: 8 -*- */
/*
 * Macro handler
 */

 /*
  * 執行巨集以及取得傳回值
  * sendMacroCommand(巨集名稱[, callback function]);
  * 若有指定 callback function，會把傳回結果以字串方式，傳給自訂 function

  例：
  	map.sendMacroCommand(
		'OxOOL.Writer.getBookmarks()',
		function (result) {
			console.log('result);
		}
	);
  */
L.Map.include({
	_macroCallbacks: {},

	// 執行 callback
	_macroResult: function (macroCmd, macroResult) {
		var callback = this._macroCallbacks[macroCmd];
		if (callback === undefined) {
			console.debug('unknow macro result -> ' + macroCmd, macroResult);
			return;
		}
		delete this._macroCallbacks[macroCmd];
		callback(macroResult);
	},

	// 傳送執行巨集指令
	sendMacroCommand: function (command, callback) {
		var macroCmd = command;
		command = L.Util.trim(command);
		if (!command.startsWith('macro:///')) {
			command = 'macro:///' + command;
		}
		else {
			macroCmd = command.substring('macro:///'.length);
		}
		var idx = macroCmd.indexOf('(');
		if (idx > 0) {
			macroCmd = macroCmd.substr(0, idx);
		}
		if (typeof callback === 'function') {
			this._macroCallbacks[macroCmd] = callback;
		}

		this._socket.sendMessage('uno ' + encodeURI(command));
	},
});
