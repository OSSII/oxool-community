/* -*- js-indent-level: 8 -*- */
/*
	Socket to be intialized on opening the overview page in Admin console
*/
/* global _ vex $ Util AdminSocketBase Admin */
var AdminSocketOverview = AdminSocketBase.extend({
	constructor: function(host) {
		this.base(host);
	},

	_l10n: [
		_('Users online'), // 線上使用者
		_('Documents opened'), // 開啟的文件
		_('Memory consumed'), // 消耗的記憶體
		_('Bytes sent'), // 已傳送的流量
		_('Bytes received'), // 已接收的流量
		_('Server uptime'), // 服務時間
		_('Views'), // 開啟者
		_('PID'), // PID
		_('Document'), // 文件
		_('Elapsed time'), // 經過的時間
		_('Idle time'), // 閒置時間
		_('Modified'), // 已修改
		_('Number of Documents'), // 文件數
	],

	_basicStatsIntervalId: 0,

	_docElapsedTimeIntervalId: 0,

	/**
	 * 要求 server 回報資料
	 */
	_getBasicStats: function() {
		this.socket.send('mem_consumed');
		this.socket.send('active_docs_count');
		this.socket.send('active_users_count');
		this.socket.send('sent_bytes');
		this.socket.send('recv_bytes');
		this.socket.send('uptime');
	},

	onSocketOpen: function() {
		// Base class' onSocketOpen handles authentication
		this.base.call(this);

		this.socket.send('documents');
		this.socket.send('subscribe adddoc rmdoc resetidle propchange modifications');

		this._getBasicStats();
		// 每 5 秒要求 server 回報資料
		this._basicStatsIntervalId =
		setInterval(function() {
			this._getBasicStats();
		}.bind(this), 5000);

		// 每 2 秒更新文件的經過時間和閒置時間
		this._docElapsedTimeIntervalId =
		setInterval(function() {
			$('td.elapsed_time').each(function() {
				var newSecs = parseInt($(this).val()) + 1;
				$(this).val(newSecs);
				$(this).html(Util.humanizeSecs(newSecs));
			});
			$('td.idle_time').each(function() {
				var newSecs = parseInt($(this).val()) + 1;
				$(this).val(newSecs);
				$(this).html(Util.humanizeSecs(newSecs));
			});
		}, 2000);

		// Dialog uses <a href='#' - which triggers popstate
		vex.defaultOptions.closeAllOnPopState = false;
	},

	onSocketMessage: function(e) {
		var textMsg;
		if (typeof e.data === 'string') {
			textMsg = e.data;
		}
		else {
			textMsg = '';
		}

		var $doc, $a;
		var nTotalViews;
		var docProps, sPid;
		// 所有已經開啟的文件資訊
		if (textMsg.startsWith('documents')) {
			var jsonStart = textMsg.indexOf('{');
			this._onUpdateDocuments(JSON.parse(textMsg.substr(jsonStart).trim()).documents);
		// 重設某個文件的閒置時間為 0
		} else if (textMsg.startsWith('resetidle')) {
			textMsg = textMsg.substring('resetidle'.length);
			sPid = textMsg.trim().split(' ')[0];
			$('#docidle' + sPid).val(0);
			//document.getElementById('docidle' + sPid).innerText = Util.humanizeSecs(0);
		// 使用者開啟文件
		} else if (textMsg.startsWith('adddoc')) {
			textMsg = textMsg.substring('adddoc'.length);
			docProps = textMsg.trim().split(' ');
			// 0 : pid
			// 1 : 檔名(被 encode 過)
			// 2 : session id
			// 3 : user name(被 encode 過)
			// 4 : user id(被 encode 過)
			// 5 : 耗用的記憶體
			docProps = {
				'pid': docProps[0],
				'fileName': docProps[1],
				'memory': docProps[5],
				'elapsedTime': '0',
				'idleTime': '0',
				'modified': 'No',
				'views': [{
					'sessionid': docProps[2],
					'userName': decodeURI(docProps[3]),
					'userId': decodeURI(docProps[4])}]
			};

			this._upsertDocsTable(docProps);
			this._upsertUsersTable(docProps);
		// 各項統計資料回報
		} else if (textMsg.startsWith('mem_consumed') ||
			textMsg.startsWith('active_docs_count') ||
			textMsg.startsWith('active_users_count') ||
			textMsg.startsWith('sent_bytes') ||
			textMsg.startsWith('recv_bytes') ||
			textMsg.startsWith('uptime'))
		{
			textMsg = textMsg.split(' ');
			var sCommand = textMsg[0];
			var nData = parseInt(textMsg[1]);

			if (sCommand === 'mem_consumed' ||
			    sCommand === 'sent_bytes' ||
			    sCommand === 'recv_bytes') {
				nData = Util.humanizeMem(nData);
			}
			else if (sCommand === 'uptime') {
				nData = Util.humanizeSecs(nData);
			}
			document.getElementById(sCommand).innerText = nData;
		// 使用者關閉文件
		} else if (textMsg.startsWith('rmdoc')) {
			textMsg = textMsg.substring('rmdoc'.length);
			docProps = textMsg.trim().split(' ');
			sPid = docProps[0];
			var sessionid = docProps[1];

			var doc = document.getElementById('doc' + sPid);
			if (doc !== undefined && doc !== null) {
				this._getCollapsibleClass('ucontainer' + sPid).deleteItem('user' + sessionid);

				$a = $(document.getElementById('active_users_count'));
				nTotalViews = parseInt($a.text());
				$a.text(nTotalViews - 1);
			}

			var docEntry = document.getElementById(sessionid + '_' + sPid);
			if (docEntry !== null) {
				var userDocListCell = docEntry.parentNode.parentNode;
				this._getCollapsibleClass(userDocListCell.id).deleteItem(docEntry.id);
			}
		// 文件消耗的記憶體改變
		} else if (textMsg.startsWith('propchange')) {
			textMsg = textMsg.substring('propchange'.length);
			docProps = textMsg.trim().split(' ');
			sPid = docProps[0];
			var sProp = docProps[1];
			var sValue = docProps[2];

			$doc = $('#doc' + sPid);
			if ($doc.length !== 0) {
				if (sProp == 'mem') {
					var $mem = $('#docmem' + sPid);
					$mem.text(Util.humanizeMem(parseInt(sValue)));
				}
			}
		// 文件被修改
		} else if (textMsg.startsWith('modifications')) {
			textMsg = textMsg.substring('modifications'.length);
			docProps = textMsg.trim().split(' ');
			sPid = docProps[0];
			var value = docProps[1];

			var $mod = $(document.getElementById('mod' + sPid));
			$mod.html(value === 'Yes' ? '<i class="bi bi-check2 text-danger"></i>' : '');
		} else if (e.data == 'InvalidAuthToken' || e.data == 'NotAuthenticated') {
			var msg;
			if (window.location.protocol === 'http:')
			{
				// Browsers refuse to overwrite the jwt cookie in this case.
				msg =  _('Failed to set jwt authentication cookie over insecure connection');
			}
			else
			{
				msg =  _('Failed to authenticate this session over protocol %0');
				msg = msg.replace('%0', window.location.protocol);
			}
			vex.dialog.alert({ message: msg });
		}
	},

	onSocketClose: function() {
		clearInterval(this._basicStatsIntervalId);
		clearInterval(this._docElapsedTimeIntervalId);
		this.base.call(this);
	},

	/**
	 * 處理所有已開啟文件資訊
	 *
	 * @param {array} docList
	 */
	_onUpdateDocuments: function(docList) {
		docList.forEach(function(doc) {
			// 處理開啟的文件列表
			this._upsertDocsTable(doc);
			// 處理線上用者列表
			this._upsertUsersTable(doc);
		}.bind(this));
	},

	/**
	 * 處理開啟文件的列表
	 * @param {object} doc
	 */
	_upsertDocsTable: function(doc) {
		console.log('_upsertDocsTable', doc);
		var socket = this.socket;
		var docListTable = document.getElementById('doclist');
		var collapsableId = 'ucontainer' + doc.pid; // 姓名折疊區 ID
		var collapsable;
		var rowId = 'doc' + doc.pid;
		var row = document.getElementById(rowId);
		if (row) {
			collapsable = this._getCollapsibleClass(collapsableId);
			collapsable.addItem('user' + doc.views[0].sessionid, doc.views[0].userName);
		} else {
			row = document.createElement('tr');
			row.id = rowId;
			// 增加新的一列
			docListTable.appendChild(row);
			// This cell will open "Do you want to kill this session?" dialog.
			var sessionCloseCell = document.createElement('td');
			sessionCloseCell.innerText = '✖';
			sessionCloseCell.title = _('Kill session.');
			sessionCloseCell.className = 'text-center';
			sessionCloseCell.style.cursor = 'pointer';
			row.appendChild(sessionCloseCell);
			sessionCloseCell.onclick = function() {
				vex.dialog.confirm({
					message: _('Are you sure you want to terminate this session?'),
					buttons: [
						$.extend({}, vex.dialog.buttons.YES, { text: _('OK') }),
						$.extend({}, vex.dialog.buttons.NO, { text: _('Cancel') })
					],
					callback: function (value) {
						if (value) {
							socket.send('kill ' + doc['pid']);
						}
					}
				});
			};
			// 開啟者欄位
			var userInfoCell = document.createElement('td');
			userInfoCell.id = collapsableId;
			userInfoCell.className = 'text-start';
			row.appendChild(userInfoCell);
			// PID 欄位
			var pidCell = document.createElement('td');
			pidCell.className = 'text-center';
			pidCell.innerText = doc['pid'];
			row.appendChild(pidCell);
			// 文件名稱欄位
			var nameCell = document.createElement('td');
			nameCell.className = 'text-start';
			nameCell.innerText = decodeURI(doc.fileName);
			row.appendChild(nameCell);
			// 消耗的記憶體欄位
			var memoryCell = document.createElement('td');
			memoryCell.className = 'text-center';
			memoryCell.id = 'docmem' + doc.pid;
			memoryCell.innerText = Util.humanizeMem(parseInt(doc.memory));
			row.appendChild(memoryCell);
			// 經過的時間欄位
			var eTimeCell = document.createElement('td');
			eTimeCell.className = 'text-center elapsed_time';
			$(eTimeCell).val(doc.elapsedTime);
			//eTimeCell.innerText = Util.humanizeSecs(doc.elapsedTime);
			row.appendChild(eTimeCell);
			// 閒置的時間欄位
			var idleCell = document.createElement('td');
			idleCell.className = 'text-center idle_time';
			idleCell.id = 'docidle' + doc.pid;
			$(idleCell).val(doc.idleTime);
			//idleCell.innerText = Util.humanizeSecs(doc.idleTime);
			row.appendChild(idleCell);
			// 最後修改欄位
			var isModifiedCell = document.createElement('td');
			isModifiedCell.className = 'text-center';
			isModifiedCell.id = 'mod' + doc.pid;
			isModifiedCell.innerHTML = doc.modified === 'Yes' ? '<i class="bi bi-check2 text-danger"></i>' : '';
			row.appendChild(isModifiedCell);
			// 建立折疊區
			collapsable = this._createCollapsable(collapsableId, _('user(s).'));
			for (var i = 0; i < doc.views.length; i++) {
				collapsable.addItem('user' + doc.views[i].sessionid, doc.views[i].userName);
			}
		}
		/* // TODO: Is activeViews always the same with viewer count? We will hide this for now. If they are not same, this will be added to Users column like: 1/2 active/user(s).
		if (add === true) {
			var viewsCell = document.createElement('td');
			viewsCell.id = 'docview' + doc['pid'];
			viewsCell.innerText = doc['activeViews'];
			//row.appendChild(viewsCell);
		}
		else {
			//document.getElementById('docview' + doc['pid']).innerText = String(parseInt(document.getElementById('docview' + doc['pid'])) + 1);
		} */
	},

	/**
	 * 處理線上用者列表
	 *
	 * @param {object}} doc
	 */
	_upsertUsersTable: function(doc) {
		var docPid = doc.pid;
		var userListTable = document.getElementById('userlist');

		doc.views.forEach(function(viewer) {
			var encodedUId = encodeURI(viewer.userId);
			var rowId = 'usr' + encodedUId; // 線上用者 ROW ID
			var row = document.getElementById(rowId);
			var collapsableId = 'docListContainer_' + encodedUId; // 檔名折疊容器 ID
			var collapsable; // 折疊容器維護 class
			if (row) {
				collapsable = this._getCollapsibleClass(collapsableId);
			} else {
				row = document.createElement('tr');
				row.id = rowId;
				userListTable.appendChild(row);
				// 存放使用者姓名
				var userNameCell = document.createElement('td');
				userNameCell.className = 'text-center'; // 水平置中
				userNameCell.innerText = viewer.userName;
				row.appendChild(userNameCell);
				// 存放開啟文件折疊容器
				var docInfoCell = document.createElement('td');
				docInfoCell.id = collapsableId;
				row.appendChild(docInfoCell);
				collapsable = this._createCollapsable(collapsableId, _('document(s) open.'));
			}
			collapsable.addItem(viewer.sessionid + '_' + docPid, decodeURI(doc.fileName));
		}.bind(this));
	},

	/**
	 *	建立一個附屬於某 DOM Element 的折疊區
	 * @param {string} id - 這個折疊區的父 ID
	 * @param {string} suffix - 如果這個折疊區清單超過一個，會顯示 <數量> + ' ' + suffix 字樣
	 * @returns {object} 該折疊區操作物件
	 */
	_createCollapsable: function(id, suffix) {
		var listId = id + '-lists'; // 清單列表 ID

		$('<div/>', {
			'class': 'nav-link text-nowrap',
			'data-bs-target': '#' + listId,
			'suffix': suffix // 顯示字串的後綴字
		}).appendTo($('#' + id)); // 加到父容器

		$('<ul/>', {
			id: listId,
			class: 'collapse list-group'
		}).appendTo($('#' + id)); // 加到父容器

		return this._getCollapsibleClass(id);
	},

	/**
	 * 取得某個指定 id 的折疊區操作方法
	 * @param {*} id - 折疊區的父 ID
	 * @returns {object} 該折疊區操作物件
	 */
	_getCollapsibleClass: function(id) {
		var container = document.getElementById(id);
		return {
			_container: container,
			_label: container.children[0], // 第一個是顯示文字，會依據清單數量不同，顯示不同字串
			_list: container.children[1], // 清單列表

			getListCount: function() {
				return this._list.children.length;
			},
			/**
			 * 新增清單
			 * @param {string}} itemId - 清單 Id
			 * @param {string} text - 清單文字
			 */
			addItem: function(itemId, text) {
				var listItem = document.createElement('li');
				listItem.className = 'list-group-item text-nowrap';
				listItem.id = itemId;
				listItem.innerText = text;
				this._list.appendChild(listItem);
				this._setLabel();
			},
			/**
			 * 刪除清單
			 * @param {string}} itemId - 清單 Id
			 */
			deleteItem: function(itemId) {
				$('#' + itemId).remove();
				this._setLabel();
			},
			/**
			 * 設定折疊區顯示文字
			 */
			_setLabel: function() {
				switch (this._list.children.length)
				{
				case 0: // 清單是空的，表示該列不再使用，應該移除
					var element = this._container.parentElement; // 傳回 tr element
					var rowIndex = element.rowIndex; // 所屬的列號
					do { // 找到所屬的 table 為止
						element = element.parentElement;
					} while (element.tagName !== 'TABLE');
					// 這時的 element 是 table，才有辦法刪除整列
					element.deleteRow(rowIndex);
					break;
				case 1: // 只有一筆資料
					this._list.classList.remove('show'); // 移除折疊清單顯示屬性
					// 標籤文字就是第一筆文字
					this._label.innerText = this._list.children[0].innerText;
					this._label.style.cursor = 'auto'; // 改變標籤滑鼠游標式樣
					this._label.removeAttribute('data-bs-toggle'); // 移除折疊切換功能
					break;
				default: // 超過一筆
					// 標籤文字 = 清單數量 + ' ' + 標籤後綴文字
					this._label.innerText = String(this._list.children.length) + ' '
											+ this._label.getAttribute('suffix');
					this._label.style.cursor = 'pointer'; // 改變標籤滑鼠游標式樣
					this._label.setAttribute('data-bs-toggle', 'collapse'); // 恢復折疊切換功能
					break;
				}
			}
		};
	},
});

Admin.Overview = function(host) {
	return new AdminSocketOverview(host);
};
