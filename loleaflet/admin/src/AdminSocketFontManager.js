/* -*- js-indent-level: 8 -*- */
/*
	Font manager.
*/
/* global AdminSocketBase Admin $ */
var AdminSocketFontManager = AdminSocketBase.extend({
	constructor: function(host) {
		this.base(host);
	},

	_lang: String.locale.toLowerCase(),
	_fontList: {},

	_uploadFileList: null,
	_uploadIndex: -1,

	_fileInfo : null, // 欲傳送的檔案資訊
	_fileReader : new FileReader(), // 檔案存取物件
	_sliceSize : 1024000, // 每次傳送的大小
	_loaded : 0, // 已經傳輸的 bytes

	onSocketOpen: function() {
		var that = this;
		// Base class' onSocketOpen handles authentication
		this.base.call(this);

		$('#fontFiles').change(function(e) {
			$('#filename-disp').val($('#fontFiles')[0].files.length + ' 個檔案');
			$('#upload').attr('disabled', e.target.files.length === 0 ? true : false);
		});

		$('#upload').click(function() {
			$('#upload').attr('disabled', true);
			$('#progress').show();
			that._uploadFileList = $('#fontFiles')[0].files;
			if (that._uploadFileList.length > 0) {
				that._uploadIndex = 0;
				that._uploadInOrder();
			}
		});

		$('#deleteButton').click(function(/*e*/) {
			var checked = $('input[name="filename"]:checked');
			var yes = confirm('刪除選取的 ' + checked.length + ' 個檔案嗎？');
			if (yes) {
				for (var i = 0 ; i < checked.length ; i++) {
					that.socket.send('deleteFont ' + encodeURIComponent(checked[i].value));
				}
				that.socket.send('getFontlist');
			}
		});

		// 檔案全選或取消
		$('#selectAllFiles').change(function(/*e*/) {
			var $filenames = $('input[name="filename"]');
			if ($filenames.length > 0) {
				$filenames.prop('checked', $(this).is(':checked'));
			}
			that._showOrHideDeleteButton();
		});

		this.socket.send('getFontlist');
	},

	onSocketMessage: function(e) {
		var textMsg = e.data;
		var jsonIdx;
		if (typeof e.data !== 'string') {
			textMsg = '';
		}

		// 傳回字型列表
		if (textMsg.startsWith('fontList:'))  {
			jsonIdx = textMsg.indexOf('[');
			if (jsonIdx > 0) {
				var json = JSON.parse(textMsg.substring(jsonIdx));
				this._updateFontList(json);
				console.debug('Font list:', this._fontList);
			}
			$('#fontFiles').val('');
		} else if (textMsg === 'readyToReceiveFile') { // Server 已準備接收檔案
			this._uploadFile(0);
		} else if (textMsg.startsWith('receivedSize:')) { // Server 通知已收到的檔案大小
			var totalBytes = parseInt(textMsg.substr(13), 10);
			console.debug(this._fileInfo.name + ' recv ' + totalBytes + 'bytes');
		} else if (textMsg === 'upgradeFileReciveOK') { // Server 通知檔案接收完畢
			console.debug(this._fileInfo.name + ' upload OK');
			this.socket.send('moveFontFile'); // 通知 Server 移動字型檔案
		} else if (textMsg === 'moveFontSuccess') {
			console.debug('字型檔案移動 OK');
			this.socket.send('clearUpgradeFiles'); // 清除升級暫存檔案
		} else if (textMsg === 'moveFontFail') {
			console.debug('字型檔案移動失敗');
			this.socket.send('clearUpgradeFiles'); // 清除升級暫存檔案
		} else if (textMsg === 'clearUpgradeFilesOK') { // 清除升級暫存檔案成功
			console.debug('清除升級暫存檔案成功');
			this._uploadInOrder(); // 繼續上傳下個檔案（如果還有的話）
		} else if (textMsg === 'clearUpgradeFilesFail') { // 清除升級暫存檔案失敗
			console.debug('清除升級暫存檔案失敗');
		} else {
			console.debug('unknow message :', textMsg);
		}
	},

	onSocketClose: function() {

	},

	_uploadInOrder: function() {
		if (this._uploadIndex < this._uploadFileList.length) {
			this._fileInfo = this._uploadFileList[this._uploadIndex];
			var fileObj = {name: this._fileInfo.name, size:this._fileInfo.size};
			this.socket.send('uploadFont ' + JSON.stringify(fileObj));
			var percent = Math.floor(((this._uploadIndex + 1) / this._uploadFileList.length) * 100); // 計算傳送比例
			$('#progressbar').css('width', percent +'%')
				.attr('aria-valuenow', percent)
				.text(percent + ' %');
			this._uploadIndex ++;
		} else {
			$('#filename-disp').val('');
			$('#progress').hide();
			this.socket.send('getFontlist');
		}

	},

	/*
	 * 上傳檔案
	 */
	_uploadFile: function(start) {
		if (start === 0) this._loaded = 0;
		var that = this;
		var nextSlice = start + this._sliceSize;
		var blob = this._fileInfo.slice(start, nextSlice);
		this._fileReader.onloadend = function(e) {
			if (e.target.readyState !== FileReader.DONE) {
				return;
			}
			that.socket.send(e.target.result); // 資料傳送給 server
			that._loaded += e.loaded; // 累計傳送大小
			if (that._loaded < that._fileInfo.size)
				that._uploadFile(nextSlice);
		}
		this._fileReader.readAsArrayBuffer(blob);
	},

	/*
	 * 解析字型列表
	 */
	_updateFontList: function(fontList) {
		var that = this;
		this._fontList = {}; // 清空之前的列表
		fontList.forEach(function(item/*, index*/) {
			var file = Object.keys(item)[0];
			var prop = item[file];
			var newProp = {};
			// 解析字型資訊
			// 1. 字型名稱
			newProp.family = that._getNameByLocale(prop.family, prop.familylang);
			// 2. 式樣名稱
			newProp.style = that._getNameByLocale(prop.style, prop.stylelang);
			// 3. 彩色字型?
			newProp.color = (prop.color === 'true');
			// 4. 符號字型?
			newProp.symbol = (prop.symbol === 'true');
			// 4.1 可變字型
			newProp.variable = (prop.variable === 'true');
			// 5. 支援語系?
			newProp.lang = prop.lang;
			// 6. index
			newProp.index = prop.index;
			// 7. weight
			switch (parseInt(prop.weight, 10)) {
			case 0: // Thin
				newProp.weight = 100;
				break;
			case 40: // Extra Light (Ultra Light)
				newProp.weight = 200;
				break;
			case 50: //
				newProp.weight = 300;
				break;
			case 80: // Normal (Regular)
				newProp.weight = 400;
				break;
			case 100: // Medium
				newProp.weight = 500
				break;
			case 180: // Semi Bold
				newProp.weight = 600
				break;
			case 200: // bold
				newProp.weight = 700;
				break;
			case 205: // Extra Bold
				newProp.weight = 800;
				break;
			case 210: // Black
				newProp.weight = 900;
				break;
			case 215: // Extra Black
				newProp.weight = 950;
				break;
			default:
				newProp.weight = 400; // normal
				break;
			}
			// 8. slant
			var slant = parseInt(prop.slant, 10);
			newProp.slant = slant === 100 ? 'italic'
				: slant === 110 ? 'oblique' : 'normal';

			if (that._fontList[file] === undefined) {
				that._fontList[file] = [];
			}
			that._fontList[file].push(newProp);
		});

		// 更新畫面
		$('#font_list').html('');
		var count = 0, nFonts = 0;
		for (var key in this._fontList) {
			var trClass = '';
			var prop = this._fontList[key];
			nFonts += prop.length;
			count ++;
			if ((count % 2) === 0) {
				trClass = 'success';
			}
			this._makeRow(key, prop, trClass);
		}
		$('#selectAllFiles').prop('checked', false);
		that._showOrHideDeleteButton();
		$('#totalFiles').text(count);
		$('#totalFonts').text(nFonts);
		$('input[name="filename"]').change(function(/*e*/) {
			var allFilenames = $('input[name="filename"]');
			var checked = $('input[name="filename"]:checked');
			$('#selectAllFiles').prop('checked', allFilenames.length === checked.length);
			that._showOrHideDeleteButton();
		});
	},

	_showOrHideDeleteButton: function() {
		var checked = $('input[name="filename"]:checked');
		// 有任何檔案被選中，就顯示刪除按鈕
		if (checked.length > 0) {
			$('#deleteButton').show();
		} else {
			$('#deleteButton').hide();
		}
	},

	/*
	 * 找出符合客戶端語系的名稱
	 */
	_getNameByLocale: function(name, nameLang) {
		var aName = name.split(','); // 以逗號','串接的名稱
		var aNameLang = nameLang.split(','); // 以逗號','串接的語系
		var langIdx = aNameLang.indexOf(this._lang); // 找指定的語系
		if (langIdx === -1) { // 沒有
			langIdx = aNameLang.indexOf('en'); // 找 en
			if (langIdx === -1) { // 又沒有
				langIdx = 0; // 預設第一個
			}
		}
		if (langIdx < aName.length) { // 索引在名稱列表範圍內
			return aName[langIdx]; // 傳回指定位置的名稱
		}
		return '';
	},

	_makeRow: function(key, prop, trClass) {
		var checkbox = '<label><input type="checkbox" name="filename" value="'
			+ key + '">&nbsp;' + key + '</label>';
		for (var i = 0 ; i < prop.length ; i++) {
			var row, span;
			if (trClass.length > 0) {
				row = '<tr class="' + trClass + '">';
			} else {
				row = '<tr>';
			}

			if (prop.length > 1) {
				if (i > 0)
					span = '';
				else
					span = '<td rowspan="' + prop.length + '" style="vertical-align:middle">'
						 + checkbox + '</td>';
			} else {
				span = '<td style="vertical-align:middle">' + checkbox + '</td>';
			}

			row += span
				+ '<td style="font-family:\'' + prop[i].family +'\'; font-weight:' + prop[i].weight + '; font-style:' + prop[i].slant + '; color:blue;">' + prop[i].family + '</td>'
				+ '<td>' + prop[i].style + '</td>'
				+ '<td style="text-align:center">' + (prop[i].color ? '是':'x') + '</td>'
				+ '<td style="text-align:center">' + (prop[i].symbol ? '是':'x') + '</td>';
			row += '</tr>';
			$('#font_list').append(row);
		}
	}
});

Admin.FontManager = function(host) {
	return new AdminSocketFontManager(host);
};
