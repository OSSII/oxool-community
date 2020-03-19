/* -*- js-indent-level: 8 -*- */
/*
	Admin Global function.
*/
/* global $ _ vex AdminSocketBase Admin */
var GlobalSocketClass;
function GlobalFunctionRestartService()
{
	/*
	vex.dialog.confirm({
		message: _('Are you sure you want to restart the online service?'),
		callback: function(value) {
			if (value) {
				GlobalSocketClass.socket.send('shutdown maintenance');
			}
		}
	});
	*/
	if (confirm(_('Are you sure you want to restart the online service?')))
	{
		GlobalSocketClass.socket.send('shutdown maintenance');
	}
}

function GlobalFunctionCheckAccountPassword()
{
	vex.dialog.open({
		message: _('For security reasons, please enter your original management account and password.'),
		input: [
			'<input class="form-control" name="username" type="text" placeholder="' + _('Username') + '" required />',
			'<input name="password" type="password" placeholder="' + _('Password') + '" required />'
		].join(''),
		buttons: [
			$.extend({}, vex.dialog.buttons.YES, { text: _('Verification') }),
			$.extend({}, vex.dialog.buttons.NO, { text: _('Cancel') })
		],
		callback: function (data) {
			if (data)
			{
				GlobalSocketClass.socket.send('isConfigAuthOk ' + 
												data.username + ' ' + data.password);
			}
		}
	})
	
}

function GlobalFunctionChangeAccountPassword()
{
	vex.dialog.open({
		message: _('Please enter a new account and password.'),
		input: [
			'<input class="form-control" name="username" type="text" placeholder="' + _('Username') + '" required />',
			'<input class="form-control" name="password" type="password" placeholder="' + _('Password') + '" required />',
			'<input class="form-control" name="confirmpassword" type="password" placeholder="' + _('Confirm password') + '" required />'
		].join(''),
		buttons: [
			$.extend({}, vex.dialog.buttons.YES, { text: _('OK') }),
			$.extend({}, vex.dialog.buttons.NO, { text: _('Cancel') })
		],
		callback: function (data) {
			if (data)
			{
				if (data.password === data.confirmpassword)
				{
					GlobalSocketClass.socket.send('setAdminPassword ' + 
													data.username + ' ' + data.password);
				}
				else
				{
					alert(_('The password does not match the confirmation password!'));
					GlobalFunctionChangeAccountPassword();
				}
			}
		}
	})
}

function GlobalFunctionStart()
{
	var $menubar = $('#navbar-menu');
	if (!$menubar)	return;

	var funcs =
	[
		{name: _('Restart service'), exec: function() {GlobalFunctionRestartService();}},
		{name: _('Change account password'), exec: function() {GlobalFunctionCheckAccountPassword();}}
	];

	for (var i in funcs)
	{
		var $item = $(document.createElement('li'))
				.append('<a href="#">' + funcs[i].name + '</a>')
				.click(funcs[i].exec);

		$menubar.append($item);
	}
}

var AdminSocketGlobalFunction = AdminSocketBase.extend({
	constructor: function(host) {
		this.base(host);
		GlobalSocketClass = this;
		$(document).ready(function()
		{
			GlobalFunctionStart();
		});
	},

	onSocketOpen: function() {
		// Base class' onSocketOpen handles authentication
		this.base.call(this);
		this.socket.send('version');
	},

	onSocketMessage: function(e) {
		var textMsg;
		if (typeof e.data === 'string') {
			textMsg = e.data;
		}
		else {
			textMsg = '';
		}

		// 原來的帳號密碼與 oxoolwsd.xml 不符
		if (textMsg.startsWith('ConfigAuthWrong'))
		{
			alert(_('The account or password is inconsistent with the system!'));
			GlobalFunctionCheckAccountPassword();
		}
		// 原來的帳號密碼與 oxoolwsd.xml 一致
		else if (textMsg.startsWith('ConfigAuthOk'))
		{
			GlobalFunctionChangeAccountPassword();
		}
		else if (textMsg.startsWith('setAdminPasswordOk'))
		{
			alert(_('The account and password have been updated and will take effect after the next service restart.'));
		}
		else if (textMsg.startsWith('loolserver ')) {
			var oxoolwsdVersionObj = JSON.parse(textMsg.substring(textMsg.indexOf('{')));
			$('#version').text(_('Version') + ' : ' + oxoolwsdVersionObj.Version);
		}
		else if (textMsg.startsWith('lokitversion ')) {
			var lokitVersionObj = JSON.parse(textMsg.substring(textMsg.indexOf('{')));
			if (lokitVersionObj.ProductName === 'OxOffice') {
				$('#lokit').text(' , ' + _('Core') + ' : ' +
				lokitVersionObj.ProductName + ' ' +
				lokitVersionObj.ProductVersion + '(' +
				lokitVersionObj.ProductExtension + ')');
			} else {
				$('#lokit').text(' , ' + _('Core') + ' : ' +
				lokitVersionObj.ProductName + '(' +
				lokitVersionObj.ProductVersion +
				lokitVersionObj.ProductExtension + ')');
			}
		}
	},

	onSocketClose: function()
	{
	}
});

Admin.GlobalFunction = function(host) {
	new AdminSocketGlobalFunction(host);
};
