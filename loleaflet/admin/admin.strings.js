/* -*- js-indent-level: 8 -*- */
/* Stringtable for Admin Console User Interface */
/* global _ _UNO SERVICE_ROOT */
var l10nstrings = {
	productName: 'OxOffice Online Community',
	/**
	 * 找出整頁中，含有 _="字串" 的 DOM，把該 DOM 的 innerHTML 改成 _("字串") 的值
	 */
	fullPageTranslation: function() {
		this.translationElement(document);
	},

	/**
	 * 翻譯指定 DOM 內所有 element 有指定的 attribute
	 */
	 translationElement: function(DOM) {
		// 需要找出的 attributes
		var trAttrs = ['_', '_UNO', 'title', 'placeholder'];
		DOM.querySelectorAll('[' + trAttrs.join('],[') + ']').forEach(function(el) {
			for (var idx in trAttrs) {
				var attrName = trAttrs[idx]
				if (el.hasAttribute(attrName)) {
					// 讀取該 attribute 字串
					var origStr = el.getAttribute(attrName);
					// 翻譯結果
					var l10nStr = '';
					switch (attrName) {
					case '_':
					case 'title':
					case 'placeholder':
						l10nStr = _(origStr);
						break;
					case '_UNO':
						l10nStr = _UNO(origStr);
						break;
					default:
						break;
					}
					// 替代原來的字串
					if (attrName === 'title' || attrName === 'placeholder') {
						el.setAttribute('title', l10nStr);
					// 把翻譯結果插到該 element 的結尾
					} else if (attrName === '_' || attrName === '_UNO') {
						el.insertBefore(document.createTextNode(l10nStr), null);
					}
					if (origStr === l10nStr) {
						console.debug('warning! "' + origStr + '" may not be translation.');
					}
				}
			}
		}.bind(this));
	},

	/**
	 * 建立主選單
	 * @param {array} mainMenuArray
	 */
	buildMainMenu: function(mainMenuArray) {
		// 選單 DOM
		var mainMenu = document.getElementById('mainMenu');

		mainMenuArray.forEach(function(item) {
            var menuItem = document.createElement('a');
            menuItem.classList.add('list-group-item', 'list-group-item-action');
            menuItem.id = 'admin-' + item.file;
            menuItem.href = SERVICE_ROOT + '/loleaflet/dist/admin/' + item.file

            var menuIcon = document.createElement('i');
            menuIcon.classList.add('bi');
            if (item.icon !== undefined && item.icon !== '') {
                menuIcon.classList.add('bi-' + item.icon);
                menuIcon.innerHTML = '&nbsp;&nbsp;'
            }
            menuItem.appendChild(menuIcon);
            menuItem.appendChild(document.createTextNode(item.name));
            mainMenu.appendChild(menuItem);
        }.bind(this));
	},

	/**
	 * 建立模組選單
	 * @param {array} moduleMenuArray
	 */
	 buildModuleMenu: function(moduleMenuArray) {
		// 選單 DOM
		var mainMenu = document.getElementById('mainMenu');

		moduleMenuArray.forEach(function(item) {
            var menuItem = document.createElement('a');
            menuItem.classList.add('list-group-item', 'list-group-item-action');
            menuItem.id = 'admin-' + item.name;
            menuItem.href = SERVICE_ROOT + item.adminServiceURI;

            var menuIcon = document.createElement('i');
            menuIcon.classList.add('bi');
            if (item.adminIcon !== undefined && item.adminIcon !== '') {
                menuIcon.classList.add('bi-' + item.adminIcon);
                menuIcon.innerHTML = '&nbsp;&nbsp;'
            }
            menuItem.appendChild(menuIcon);
            menuItem.appendChild(document.createTextNode(_(item.adminItem)));
            mainMenu.appendChild(menuItem);
        }.bind(this));
	},

	setActiveItem: function() {
		var menuList = $('#mainMenu .list-group-item');
        // 找出與本頁相符的 item
        for (var i=0 ; i < menuList.length ; i++) {
            var element = menuList[i];
            if (element.href === window.location.href)
            {
                document.title = this.productName + ' - ' + _('Admin console') + ' / ' + element.innerText;
                $('#functionTitle').html(element.innerHTML); // 更新導行列標題
                element.classList.add('active'); // 設定這個 item 是 active
                break;
            }
        }
	},

	// 內部翻譯的字串陣列
	strings: [
		_('Admin console'), // 管理主控臺
		_('Overview'), // 概覽
		_('Analytics'), // 分析
		_('Log'), // 日誌
		_('SSL certificate manager'), // SSL 憑證管理
		_('System configuration'), // 系統配置設定
		_('Software upgrade'), // 軟體升級
		_('Font manager'), // 字型管理
	],
};

if (module) {
	module.exports = l10nstrings;
}
