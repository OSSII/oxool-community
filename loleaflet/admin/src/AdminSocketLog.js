/* -*- js-indent-level: 8 -*- */
/*
	Socket to be intialized on opening the log page in Admin console
*/
/* global Admin $ AdminSocketBase _ */
var AdminSocketLog = AdminSocketBase.extend({
	_logLines: '',

	_l10n: [
		_('None'), // 無
		_('Channel Filter:'), // 過濾類別:
		_('Refresh Log'), // 更新日誌
		_('Set Log Levels'), // 設定紀錄層級
		_('Log Levels'), // 紀錄層級
		_('Update Log Levels'), // 更新紀錄層級

	],

	constructor: function(host) {
		this.base(host);
		// There is a "$" is never used error. Let's get rid of this. This is vanilla script and has not more lines than the one with JQuery.
		$('#form-channel-list').id;
	},

	refreshLog: function() {
		this.socket.send('log_lines');
	},

	pullChannelList: function() {
		this.socket.send('channel_list');
	},

	sendChannelListLogLevels: function(e) {
		e.stopPropagation();

		// Get the form.
		var form = document.getElementById('form-channel-list');

		// Get channel select elements.
		var selectList = form.querySelectorAll('select');

		// Prepare the statement.
		var textToSend = 'update-log-levels';
		for (var i = 0; i < selectList.length; i++) {
			textToSend += ' ' + selectList[i].getAttribute('name').replace('channel-', '') + '=' + selectList[i].value;
		}

		this.socket.send(textToSend);
	},

	onSocketOpen: function() {
		// Base class' onSocketOpen handles authentication
		this.base.call(this);

		document.getElementById('refresh-log').onclick = this.refreshLog.bind(this);
		document.getElementById('update-log-levels').onclick = this.sendChannelListLogLevels.bind(this);
		document.getElementById('log-channel-filter').onchange = this.applyChannelFilter.bind(this);

		this.pullChannelList();
		this.refreshLog();
	},

	applyChannelList: function(channelListStr) {
		var channelListArr = channelListStr.split(' '); // Every item holds: channel name + = + log level.

		// Here we have the log channel list and their respective log levels.
		// We will create items for them. User will be able to set the log level for each channel.
		var channelForm = document.getElementById('form-channel-list');
		channelForm.innerHTML = ''; // Clear and refill it.
		var optionList = Array('none', 'fatal', 'critical', 'error', 'warning', 'notice', 'information', 'debug', 'trace');
		var innerHTML = ''; // Of select elements.
		for (var i = 0; i < optionList.length; i++) {
			innerHTML += '<option value="' + optionList[i] + '">' + optionList[i] + '</option>';
		}

		for (i = 0; i < channelListArr.length; i++) {
			if (channelListArr[i].split('=').length === 2) {
				var channelName = channelListArr[i].split('=')[0];
				var channelLogLevel = channelListArr[i].split('=')[1];

				var newDiv = document.createElement('div');
				newDiv.className = 'input-group mb-2';

				var newLabel = document.createElement('label');
				newLabel.className = 'input-group-text col-sm-2';
				newLabel.innerText = channelName;

				var newSelectElement = document.createElement('select');
				newSelectElement.name = 'channel-' + channelName;
				newSelectElement.id = 'channel-' + channelName;
				newSelectElement.innerHTML = innerHTML;
				newSelectElement.value = channelLogLevel;
				newSelectElement.className = 'form-select';

				channelForm.appendChild(newDiv);
				newDiv.appendChild(newLabel);
				newDiv.appendChild(newSelectElement);
			}
		}
	},

	applyChannelFilter: function() {
		if (document.getElementById('log-channel-filter').selectedIndex !== 0) {
			var filteredChannel = document.getElementById('log-channel-filter').value;
			var filteredLines = '';
			var lineList = this._logLines.split('\n');
			for (var i = 0; i < lineList.length; i++) {
				if (lineList[i].split('[').length > 1) {
					if (lineList[i].split('[')[1].split(']')[0].trim() === filteredChannel)
						filteredLines += lineList[i] + '\n';
				}
			}
			document.getElementById('log-lines').value = filteredLines;
		}
		else {
			document.getElementById('log-lines').value = this._logLines;
		}
	},

	refreshChannelFilter: function() {
		var lineList = this._logLines.split('\n');
		var channelList = new Array(0);
		for (var i = 0; i < lineList.length; i++) {
			if (lineList[i].trim() !== '' && lineList[i].split('[').length > 1) {
				var channelName = lineList[i].split('[')[1].split(']')[0].trim();
				if (!channelList.includes(channelName))
					channelList.push(channelName);
			}
		}

		var currentFilteredChannel = document.getElementById('log-channel-filter').value;

		// Remove previous channels.
		for (i = document.getElementById('log-channel-filter').options.length - 1; i > 0; i--)
			document.getElementById('log-channel-filter').remove(i);

		// Now add new ones.
		for (i = 0; i < channelList.length; i++) {
			var option = document.createElement('option');
			option.text = channelList[i];
			document.getElementById('log-channel-filter').add(option);
		}

		// Does previously selected channel name still exist? If not, we will re-set filter.
		if (!channelList.includes(currentFilteredChannel))
			document.getElementById('log-channel-filter').selectedIndex = 0;
		else
			document.getElementById('log-channel-filter').selectedIndex = channelList.findIndex(function(item) {return item === currentFilteredChannel;}) + 1;

		// Now, we will apply filter.
		this.applyChannelFilter();
	},

	onSocketMessage: function(e) {
		if (e.data.startsWith('log_lines')) {
			var result = e.data;
			result = result.substring(10, result.length);
			this._logLines = result;
			this.refreshChannelFilter();
		}
		else if (e.data.startsWith('channel_list')) {
			var channelListStr = e.data.substring(13, e.data.length);
			this.applyChannelList(channelListStr);
		}
	},

	onSocketClose: function() {
		this.base.call(this);
	}
});

Admin.Log = function(host) {
	return new AdminSocketLog(host);
};
