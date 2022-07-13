/* -*- js-indent-level: 8 -*- */
/*
 * L.Map.StateChanges stores the state changes commands coming from core
 * LOK_CALLBACK_STATE_CHANGED callback
 */
/*eslint no-extend-native:0*/
L.Map.mergeOptions({
	stateChangeHandler: true
});

L.Map.StateChangeHandler = L.Handler.extend({

	initialize: function (map) {
		this._map = map;
		// Contains the items for which state will be tracked
		// Stores the last received value from core ('true', 'false', 'enabled', 'disabled')
		this._items = {};

		this._commandCallbacks = {};
	},

	addHooks: function () {
		//this._map.on('commandstatechanged', this._onStateChanged, this);
	},

	removeHooks: function () {
		//this._map.off('commandstatechanged', this._onStateChanged, this);
	},

	_onStateChanged: function(e) {
		var state;

		if (typeof(e.state) == 'object') {
			state = e.state;
		} else if (typeof(e.state) == 'string') {
			var index = e.state.indexOf('{');
			state = index !== -1 ? JSON.parse(e.state.substring(index)) : e.state;
		}

		this._items[e.commandName] = state;
		if (e.commandName === '.uno:CurrentTrackedChangeId') {
			var redlineId = 'change-' + state;
			this._map._docLayer._annotations.selectById(redlineId);
		}

		var newEvent = this._createStateEvent(e.commandName, state);
		// 檢查並執行已註冊的命令
		this._launch(newEvent);
		// 處理完後再廣播
		this._map.fire('commandstatechanged', newEvent);
	},

	getItems: function() {
		return this._items;
	},

	getItemValue: function(unoCmd) {
		if (unoCmd && unoCmd.substring(0, 5) !== '.uno:') {
			unoCmd = '.uno:' + unoCmd;
		}

		return this._items[unoCmd];
	},

	setItemValue: function(unoCmd, value) {
		if (unoCmd && unoCmd.substring(0, 5) !== '.uno:') {
			unoCmd = '.uno:' + unoCmd;
		}

		// 透過 _onStateChanged 紀錄並發送
		this._onStateChanged({commandName: unoCmd, state: value});
	},

	/**
	 * 設定命令狀態
	 * @param {string} command - 任何命令
	 * @param {any} state - 任意資料
	 */
	setItemProperty: function(command, state) {
		// 直接透過 _onStateChanged 紀錄並發送
		this._onStateChanged({commandName: command, state: state});
	},

	/**
	 * 啟用需即時反應指令狀態的自訂功能
	 * @author Firefly <firefly@ossii.com.tw>
	 *
	 * @param {*} cmd - 需要
	 * @param {*} func -
	 * @param {*} bind
	 */
	on: function(cmd, func, bind) {
		if (typeof(cmd) !== 'string' && typeof(func) !== 'function') {
			window.app.console.debug('Warning! map.stateChangeHandler.on(""command", callback[, bind])');
			return this;
		}
		// 建立新的 callback function 物件
		var callbackFunc = {function: func};
		// 有 bind 對象也一併建立
		if (bind !== undefined) {
			callbackFunc.bind = bind;
		}

		// 是否已有有這個命令的 callback
		var callbacks = this._commandCallbacks[cmd];
		// 沒有的話新增這個命令的 callbacks
		if (callbacks === undefined) {
			callbacks = [];
			this._commandCallbacks[cmd] = callbacks;
		}

		// 檢查新的 callback function 是否存在
		var callbackExist = false;
		for (var i = 0 ; i < callbacks.length ; i++) {
			if (callbacks[i].function === callbackFunc.function &&
				callbacks[i].bind === callbackFunc.bind) {
				callbackExist = true;
				break;
			}
		}
		// 不存在的話就新增
		if (!callbackExist) {
			callbacks.push(callbackFunc);
		}

		return this;
	},

	/**
	 * 解除指令自訂功能
	 * @author Firefly <firefly@ossii.com.tw>
	 *
	 * @param {*} cmd
	 * @param {*} func
	 * @param {*} bind
	 */
	off: function(cmd, func, bind) {
		// 是否已有有這個命令的 callbacks
		var callbacks = this._commandCallbacks[cmd];
		// 沒有就結束
		if (callbacks === undefined) return this;

		// 檢查 callback function 是否存在
		for (var i = 0 ; i < callbacks.length ; i++) {
			// 若存在的話，移除它
			if (callbacks[i].function === func && callbacks[i].bind === bind) {
				callbacks.splice(i, 1);
				break;
			}
		}

		// 若 callbacks 為空陣列的話，將這個指令也從 _commandCallbacks 移除
		if (callbacks.length === 0) {
			delete this._commandCallbacks[cmd];
		}

		return this;
	},

	/**
	 * 取得指令狀態物件
	 * @param {string} command - 指令
	 * @returns object
	 */
	getItemProperty: function(command) {
		var state = this._items[command];
		return this._createStateEvent(command, state);
	},

	/**
	 * 刷新全部註冊過的回報指令
	 */
	refreshAllCallbacks: function() {
		for (var command in this._commandCallbacks) {
			this._launch(this._createStateEvent(command, this._items[command]));
		}
	},

	/**
	 * 執行已註冊的命令
	 */
	_launch: function(event) {
		// 是否已註冊這個命令
		var callbacks = this._commandCallbacks[event.commandName];
		if (callbacks !== undefined) {
			// 有的話依序執行已註冊的功能
			callbacks.forEach(function(cb) {
				if (cb.bind === undefined) {
					cb.function(event);
				} else {
					cb.function.call(cb.bind, event);
				}
			}.bind(this));
		}
	},

	/**
	 * 重新封裝 state change 物件，增加 disabled(), checked(), value()
	 * @param {string} command - 指令名稱
	 * @param {any} state - 指令狀態值
	 * @returns object
	 */
	 _createStateEvent: function(command, state) {
		return {
			commandName: command, // 紀錄指令名稱
			state: state, // 指令狀態值
			/**
			 * 該指令是否 disabled
			 * @returns true: 是, false: 否
			 */
			disabled: function() {
				return this.state === 'disabled';
			},
			/**
			 * 該指令是否被選取
			 * @returns true: 是, false: 否
			 */
			checked: function() {
				return (this.state === 'true' || this.state === true);
			},
			/**
			 * 真的有值(非 enabled/disabled/true/false/undefined/null)
			 */
			hasValue: function() {
				return (this.state !== 'enabled' && this.state !== 'disabled' &&
					this.state !== 'true' && this.state !== 'false' &&
					this.state !== true && this.state !== undefined &&
					this.state !== null);
			},
			/**
			 * 該指令的實際狀態值
			 * @returns
			 */
			value: function() {
				return this.state;
			}
		};
	},
});

L.Map.addInitHook('addHandler', 'stateChangeHandler', L.Map.StateChangeHandler);
