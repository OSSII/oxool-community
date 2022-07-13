/* -*- js-indent-level: 8 -*- */
/**
 * L.dialog.ShowHelp
 * 顯示線上/按鍵說明
 *
 * Author: Firefly <firefly@ossii.com.tw>
 */
/* global $ _ brandProductName */
L.dialog.ShowHelp = {
	_dialog: undefined,

	// init 只會在載入的第一次執行
	initialize: function() {
		// do nothing;
	},

	// 每次都會從這裡開始
	run: function(args) {
		var that = this;

		if (window.ThisIsAMobileApp) {
			that.showHelp(window.HelpFile, args.id);
			return;
		}

		var helpLocation = 'loleaflet-help.html';
		if (window.socketProxy) {
			helpLocation = window.makeWsUrl('/loleaflet/dist/' + helpLocation);
		}
		$.get(helpLocation, function(data) {
			that.showHelp(data, args.id);
		});
	},

	/**
	 * 顯示說明 Dialog
	 * @param {string} data - html 內容
	 * @param {string} id - 'online-help' 或 'keyboard-shortcuts'
	 */
	showHelp: function(data, id) {
		var title = (id === 'online-help' ? _('Online Help') : _('Keyboard shortcuts'));
		var productName;

		if (window.ThisIsAMobileApp) {
			productName = window.MobileAppName;
		} else {
			productName = brandProductName;
		}

		var map = this._map;
		this._dialog = L.DomUtil.createWithId('div', 'ShowHelp', document.body);
		var $dialog = $(this._dialog);

		$dialog.html(data);

		var i;
		// Display keyboard shortcut or online help
		if (id === 'keyboard-shortcuts') {
			document.getElementById('online-help').style.display='none';
			// Display help according to document opened
			if (map.getDocType() === 'text') {
				document.getElementById('text-shortcuts').style.display='block';
			}
			else if (map.getDocType() === 'spreadsheet') {
				document.getElementById('spreadsheet-shortcuts').style.display='block';
			}
			else if (map.getDocType() === 'presentation') {
				document.getElementById('presentation-shortcuts').style.display='block';
			}
			else if (map.getDocType() === 'drawing') {
				document.getElementById('drawing-shortcuts').style.display='block';
			}
		} else /* id === 'online-help' */ {
			document.getElementById('keyboard-shortcuts').style.display='none';
			if (window.socketProxy) {
				var helpdiv = document.getElementById('online-help');
				var imgList = helpdiv.querySelectorAll('img');
				for (var p = 0; p < imgList.length; p++) {
					var imgSrc = imgList[p].src;
					imgSrc = imgSrc.substring(imgSrc.indexOf('/images'));
					imgList[p].src = window.makeWsUrl('/loleaflet/dist'+ imgSrc);
				}
			}
			// Display help according to document opened
			if (map.getDocType() === 'text') {
				var x = document.getElementsByClassName('text');
				for (i = 0; i < x.length; i++) {
					x[i].style.display = 'block';
				}
			}
			else if (map.getDocType() === 'spreadsheet') {
				x = document.getElementsByClassName('spreadsheet');
				for (i = 0; i < x.length; i++) {
					x[i].style.display = 'block';
				}
			}
			else if (map.getDocType() === 'presentation' || map.getDocType() === 'drawing') {
				x = document.getElementsByClassName('presentation');
				for (i = 0; i < x.length; i++) {
					x[i].style.display = 'block';
				}
			}
		}

		// Let's translate
		var max;
		var translatableContent = $dialog.find('h1');
		for (i = 0, max = translatableContent.length; i < max; i++) {
			translatableContent[i].innerHTML = translatableContent[i].innerHTML.toLocaleString();
		}
		translatableContent = $dialog.find('h2');
		for (i = 0, max = translatableContent.length; i < max; i++) {
			translatableContent[i].innerHTML = translatableContent[i].innerHTML.toLocaleString();
		}
		translatableContent = $dialog.find('h3');
		for (i = 0, max = translatableContent.length; i < max; i++) {
			translatableContent[i].innerHTML = translatableContent[i].innerHTML.toLocaleString();
		}
		translatableContent = $dialog.find('h4');
		for (i = 0, max = translatableContent.length; i < max; i++) {
			translatableContent[i].innerHTML = translatableContent[i].innerHTML.toLocaleString();
		}
		translatableContent = $dialog.find('td');
		for (i = 0, max = translatableContent.length; i < max; i++) {
			var orig = translatableContent[i].innerHTML;
			var trans = translatableContent[i].innerHTML.toLocaleString();
			// Try harder to get translation of keyboard shortcuts (html2po trims starting <kbd> and ending </kbd>)
			if (orig === trans && orig.indexOf('kbd') != -1) {
				var trimmedOrig = orig.replace(/^(<kbd>)/,'').replace(/(<\/kbd>$)/,'');
				var trimmedTrans = trimmedOrig.toLocaleString();
				if (trimmedOrig !== trimmedTrans) {
					trans = '<kbd>' + trimmedTrans + '</kbd>';
				}
			}
			translatableContent[i].innerHTML = trans;
		}
		translatableContent = $dialog.find('p');
		for (i = 0, max = translatableContent.length; i < max; i++) {
			translatableContent[i].innerHTML = translatableContent[i].innerHTML.toLocaleString();
		}
		translatableContent = $dialog.find('button'); // TOC
		for (i = 0, max = translatableContent.length; i < max; i++) {
			translatableContent[i].innerHTML = translatableContent[i].innerHTML.toLocaleString();
		}

		//translatable screenshots
		var supportedLanguage = ['fr', 'it', 'de', 'es', 'pt-BR'];
		var currentLanguage = String.locale;
		if (supportedLanguage.indexOf(currentLanguage) >= 0) {
			translatableContent = $($dialog.find('.screenshot')).find('img');
			for (i = 0, max = translatableContent.length; i < max; i++) {
				translatableContent[i].src = translatableContent[i].src.replace('/en/', '/'+currentLanguage+'/');
			}
		}

		// Substitute %productName in Online Help and replace special Mac key names
		if (id === 'online-help') {
			var productNameContent = $dialog.find('span.productname');
			for (i = 0, max = productNameContent.length; i < max; i++) {
				productNameContent[i].innerHTML = productNameContent[i].innerHTML.replace(/%productName/g, productName);
			}
			document.getElementById('online-help').innerHTML = L.Util.replaceCtrlAltInMac(document.getElementById('online-help').innerHTML);
		}
		if (id === 'keyboard-shortcuts') {
			document.getElementById('keyboard-shortcuts').innerHTML = L.Util.replaceCtrlAltInMac(document.getElementById('keyboard-shortcuts').innerHTML);
		}

		var minHeight = (window.innerHeight * 0.8).toFixed(); // 最小高度為視窗高度 80 %
		$dialog.dialog({
			title: title,
			position: {my: 'center', at: 'center', of: window},
			minWidth: 720,
			height: minHeight < 512 ? 512 : minHeight, // 若高不能小於 512
			autoOpen: true, // 自動顯示對話框
			modal: true,	// 獨占模式
			resizable: false, // 不能縮放視窗
			draggable: true, // 可以拖放視窗
			closeOnEscape: true, // 按 esc 視同關閉視窗
			close: function(/*e, ui*/) {
				// 對話框關閉就徹底移除，下次要重新建立
				$(this).dialog('destroy').remove();
				map.focus();
			}
		});
	}
};
