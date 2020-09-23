/* -*- js-indent-level: 8 -*- */
/*
 * L.dialog.Action
 * 依據 id，執行指定的小程式
 *
 * Author: Firefly <firefly@ossii.com.tw>
 */
/* global L _ vex revHistoryEnabled */
L.dialog.Action = {
	// init 只會在載入的第一次執行
	init: function(map) {
		this._map = map;
	},

	// 每次都會從這裡開始
	run: function(params) {
		var map = this._map;
		var docType = map.getDocType();
		var id = params.id;

		if (id === undefined)
			return;

		var fileName = map['wopi'].BaseFileName;
		fileName = fileName.substr(0, fileName.lastIndexOf('.'));
		fileName = fileName === '' ? 'document' : fileName;

		switch (id) {
		case 'save': // 儲存
			map.save(true, true);
			break;
		case 'saveas': // 另存新檔
			map.fire('postMessage', {msgId: 'UI_SaveAs'});
			break;
		case 'shareas': // 分享
			map.fire('postMessage', {msgId: 'UI_Share'});
			break;
		case 'print': // 列印
			map.print();
			break;
		case 'insertgraphic': // 插入電腦圖片
			L.DomUtil.get('insertgraphic').click();
			break;
		case 'insertgraphicremote': // 插入雲端圖片
			map.fire('postMessage', {msgId: 'UI_InsertGraphic'});
			break;
		case 'insertcomment': // 插入註解
			map.insertComment();
			break;
		case 'OXSaveAs': // online 自己的另存新檔 dialog
			map.fire('executeDialog', {dialog: 'OXSaveAs'});
			break;
		case 'signdocument': // 數位簽章
			map.showSignDocument();
			break;
		case 'zoomin': // 拉近
			if (map.getZoom() < map.getMaxZoom()) {
				map.zoomIn(1);
			}
			break;
		case 'zoomout': // 拉遠
			// 試算表最小不能低於 100%
			var minZoom = docType === 'spreadsheet' ? 7 : map.getMinZoom();
			if (map.getZoom() > minZoom) {
				map.zoomOut(1);
			}
			break;
		case 'zoomreset': // 100%
			map.setZoom(map.options.zoom);
			break;
		case 'fullscreen': // 全螢幕
			L.toggleFullScreen();
			break;
		case 'fullscreen-presentation': // 從第一張投影片開始播放
			if (docType === 'presentation') {
				map.fire('fullscreen');
			}
			break;
		case 'presentation-currentslide': // 從目前投影片開始播放
			if (docType === 'presentation') {
				map.fire('fullscreen', {startSlideNumber: map.getCurrentPartNumber()});
			}
			break;
		case 'insertpage': // 新增頁面
			map.insertPage();
			break;
		case 'duplicatepage': // 複製頁面
			map.duplicatePage();
			break;
		case 'deletepage': // 刪除頁面
			vex.dialog.confirm({
				message: _('Are you sure you want to delete this slide?'),
				callback: function(e) {
					if (e) {
						map.deletePage();
					}
				}
			});
			break;
		case 'about': // 顯示關於 dialog
			map.showLOAboutDialog();
			break;
		case 'keyboard-shortcuts': // 顯示按鍵說明
			map.fire('executeDialog', {dialog: 'ShowKeyboardHelp'});
			break;
		case 'rev-history': // 檢視版本
			if (revHistoryEnabled) {
				// if we are being loaded inside an iframe, ask
				// our host to show revision history mode
				map.fire('postMessage', {msgId: 'rev-history', args: {Deprecated: true}});
				map.fire('postMessage', {msgId: 'UI_FileVersions'});
			}
			break;
		case 'closedocument': // 關閉檔案
			if (window.ThisIsAMobileApp) {
				window.webkit.messageHandlers.lool.postMessage('BYE', '*');
			} else {
				map.fire('postMessage', {msgId: 'close', args: {EverModified: map._everModified, Deprecated: true}});
				map.fire('postMessage', {msgId: 'UI_Close', args: {EverModified: map._everModified}});
			}
			map.remove();
			break;
		case 'repair': // 修復
			map._socket.sendMessage('commandvalues command=.uno:DocumentRepair');
			break;
		case 'downloadas-pdf': // 下載 pdf
			map.downloadAs(fileName + '.pdf', 'pdf');
			break;
		case 'downloadas-txt': // 下載 txt
			map.downloadAs(fileName + '.txt', 'txt');
			break;
		case 'downloadas-html': // 下載 html
			map.downloadAs(fileName + '.html', 'html');
			break;
		case 'downloadas-rtf': // 下載 rtf
			map.downloadAs(fileName + '.rtf', 'rtf');
			break;
		case 'downloadas-odt': // 下載 odt
			map.downloadAs(fileName + '.odt', 'odt');
			break;
		case 'downloadas-doc': // 下載 doc
			map.downloadAs(fileName + '.doc', 'doc');
			break;
		case 'downloadas-docx': // 下載 docx
			map.downloadAs(fileName + '.docx', 'docx');
			break;
		case 'downloadas-ods': // 下載 ods
			map.downloadAs(fileName + '.ods', 'ods');
			break;
		case 'downloadas-xls': // 下載 xls
			map.downloadAs(fileName + '.xls', 'xls');
			break;
		case 'downloadas-xlsx': // 下載 xlsx
			map.downloadAs(fileName + '.xlsx', 'xlsx');
			break;
		case 'downloadas-csv': // 下載 csv
			map.downloadAs(fileName + '.csv', 'csv');
			break;
		case 'downloadas-odp': // 下載 odp
			map.downloadAs(fileName + '.odp', 'odp');
			break;
		case 'downloadas-ppt': // 下載 ppt
			map.downloadAs(fileName + '.ppt', 'ppt');
			break;
		case 'downloadas-pptx': // 下載 xlsx
			map.downloadAs(fileName + '.pptx', 'pptx');
			break;
		case 'noneselection': // 語言(選取)：無(不拼字檢查)
			map.sendUnoCommand('.uno:LanguageStatus?Language:string=Current_LANGUAGE_NONE');
			break;
		case 'noneparagraph': // 語言(段落)：無(不拼字檢查)
			map.sendUnoCommand('.uno:LanguageStatus?Language:string=Paragraph_LANGUAGE_NONE');
			break;
		case 'nonelanguage': // 語言(所有文字)：無(不拼字檢查)
			map.sendUnoCommand('.uno:LanguageStatus?Language:string=Default_LANGUAGE_NONE');
			break;
		case 'gotopage':
			map.fire('executeDialog', {dialog: 'GotoPage'});
			break;
		case 'zoom30':
			map.setZoom(4);
			break;
		case 'zoom40':
			map.setZoom(5);
			break;
		case 'zoom50':
			map.setZoom(6);
			break;
		case 'zoom60':
			map.setZoom(7);
			break;
		case 'zoom70':
			map.setZoom(8);
			break;
		case 'zoom85':
			map.setZoom(9);
			break;
		case 'zoom100':
			map.setZoom(10);
			break;
		case 'zoom120':
			map.setZoom(11);
			break;
		case 'zoom150':
			map.setZoom(12);
			break;
		case 'zoom175':
			map.setZoom(13);
			break;
		case 'zoom200':
			map.setZoom(14);
			break;
		default:
			console.debug('Found unknow action ID : ' + id);
			break;
		}
	},
};
