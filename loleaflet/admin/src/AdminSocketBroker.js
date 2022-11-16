/* -*- js-indent-level: 8 -*- */
/*
	Admin socket broker.
*/
/* global Admin AdminSocketBase host MODULE_NAME */
var AdminSocketBroker = AdminSocketBase.extend({
	constructor: function(host, methods) {
		if (typeof methods === 'object') {
			this._methods = methods;
		} else {
			console.error('There must be an object method.');
		}
		this.base(host);
	},

	_methods : null,

	onSocketOpen: function() {
		// Base class' onSocketOpen handles authentication
		this.base.call(this);
		if (typeof this._methods === 'object' &&
			typeof this._methods.onSocketOpen === 'function') {
			this._methods.socket = this.socket;
			this._methods.onSocketOpen();
		} else {
			console.warn('onOpen function no set yet.');
		}
	},

	onSocketMessage: function(e) {
		if (typeof this._methods === 'object' &&
			typeof this._methods.onSocketMessage === 'function') {
			this._methods.onSocketMessage(e);
		} else {
			console.error('onMessage function no set yet.');
		}
	},

	onSocketClose: function() {
		this.base.call(this);
		if (typeof this._methods === 'object' &&
			typeof this._methods.onSocketClose === 'function') {
			this._methods.onSocketClose();
		} else {
			console.warn('onClose function no set yet.');
		}
	}
});

Admin.SocketBroker = function(methods) {
	var moduleName = (MODULE_NAME === '%MODULE_NAME%' ? '' : MODULE_NAME);
	return new AdminSocketBroker(host + moduleName, methods);
};
