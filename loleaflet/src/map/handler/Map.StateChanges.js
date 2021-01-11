/* -*- js-indent-level: 8 -*- */
/*
 * L.Map.StateChanges stores the state changes commands coming from core
 * LOK_CALLBACK_STATE_CHANGED callback
 */

/* global w2ui */
L.Map.mergeOptions({
	stateChangeHandler: true
});

L.Map.StateChangeHandler = L.Handler.extend({

	initialize: function (map) {
		this._map = map;
		// Contains the items for which state will be tracked
		// Stores the last received value from core ('true', 'false', 'enabled', 'disabled')
		this._items = {};
		this._stateProperties = {};
	},

	addHooks: function () {
		this._map.on('commandstatechanged', this._onStateChanged, this);
	},

	removeHooks: function () {
		this._map.off('commandstatechanged', this._onStateChanged, this);
	},

	_onStateChanged: function(e) {
		var index = e.state.indexOf('{');
		var state = index !== -1 ? JSON.parse(e.state.substring(index)) : e.state;
		this._items[e.commandName] = state;
		// Add by Firefly <firefly@ossii.com.tw>
		// 詳細紀錄 uno 指令的狀態，因為 uno 指令可能有兩種以上狀態
		// 例如：.uno:Bold(粗體)，可能是 checked，但又被 disabled
		// 原來的紀錄方式，無法紀錄
		var props = {};
		if (state === 'enabled' || state === 'disabled') {
			props.enabled = (state === 'enabled' ? true : false);
		} else if (state === 'true' || state === 'false') {
			props.checked = (state === 'true' ? true : false);
		} else {
			props.value = state;
		}
		this._stateProperties[e.commandName] = props;

		this._resetUIState(e.commandName, state);
	},

	// Add by Firefly <firefly@ossii.com.tw>
	// TODO: 未來完全替代 getItems()
	getProperties: function() {
		return this._stateProperties;
	},

	// Add by Firefly <firefly@ossii.com.tw>
	// 未來完全替代 getItemValue()
	getItemProperty: function(unoCmd) {
		if (unoCmd && unoCmd.substring(0, 5) !== '.uno:') {
			unoCmd = '.uno:' + unoCmd;
		}

		return this._stateProperties[unoCmd];
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

	_resetUIState: function(commandName, state) {
		var toolbar = w2ui['editbar'];
		if (commandName === '.uno:Context') {
			if (state.startsWith('編輯文字')) {
				toolbar.uncheck('horizontaltext');
				toolbar.uncheck('verticaltext');
			}
		}
	}
});

L.Map.addInitHook('addHandler', 'stateChangeHandler', L.Map.StateChangeHandler);
