/* -*- js-indent-level: 8 -*- */
/*
	Admin socket broker.
*/
/* global Admin AdminSocketBase */
var AdminSocketBroker = AdminSocketBase.extend({
	constructor: function(host, methods) {
		if (typeof methods == 'object')
		{
			this._methods = methods;
		}
		else
		{
			console.log('methods not found.');
		}
		this.base(host);
	},

	_methods : null,

	send: function(cmd) {
		this.socket.send(cmd);
	},

	onSocketOpen: function() {
		// Base class' onSocketOpen handles authentication
		this.base.call(this);
		if (typeof this._methods == 'object' && typeof this._methods.onOpen == 'function')
		{
			this._methods.onOpen();
		}
		else
		{
			console.log('onOpen function no set yet.');
		}
	},

	onSocketMessage: function(e) {
		if (typeof this._methods == 'object' && typeof this._methods.onMessage == 'function') {
			this._methods.onMessage(e);
		}
		else
		{
			console.log('onMessage function no set yet.');
		}
	},

	onSocketClose: function() {
		if (typeof this._methods == 'object' && typeof this._methods.onClose == 'function') {
			this._methods.onClose();
		}
		else
		{
			console.log('onClose function no set yet.');
		}
	}
});

Admin.SocketBroker = function(host, methods) {
	return new AdminSocketBroker(host, methods);
}
