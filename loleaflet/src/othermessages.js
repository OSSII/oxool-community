/* -*- js-indent-level: 8 -*- */
/* global _ */
var otherMessages = {
	// 從 OxOffice 傳來的英文訊息
	fromOxOffice: [
		_('Autofilter do not support in multiuser mode'), // 在共編模式下，無法使用資料篩選功能
	],

	// control/Control.Menubar.js 之 ajax 載入的 json
	fromMenubar: [
		_('Share...'),
		_('See revision history'),
		_('Download as'),
		_('SecurePrint...'),
		_('Save As Password'),
		_('PDF Document (.pdf)'),
		_('TEXT Document (.txt)'),
		_('HTML Document (.html)'),
		_('ODF text document (.odt)'),
		_('ODF spreadsheet (.ods)'),
		_('ODF presentation (.odp)'),
		_('Word 2003 Document (.doc)'),
		_('Excel 2003 Spreadsheet (.xls)'),
		_('PowerPoint 2003 Presentation (.ppt)'),
		_('Word Document (.docx)'),
		_('Excel Spreadsheet (.xlsx)'),
		_('PowerPoint Presentation (.pptx)'),
		_('Rich Text (.rtf)'),
		_('CSV (.csv)'),
		_('EPUB Document (.epub)'),
		_('Sign document'),
		_('Repair'),
		_('Local Image...'),
		_('Fullscreen presentation'),
		_('Move'),
		_('All'),
		_('Horizontal Line'),
		_('None (Do not check spelling)'),
		_('Keyboard shortcuts'),
		_('About'),
		_('Binding line'),
		_('Insert on the left side of page'),
		_('Insert on the right side of page'),
		_('Insert on the top side of page'),
		_('Insert on the bottom side of page'),
		_('Customize'),
		_('Hand-drawn diagram'), // 手繪圖表
	],
};

if (typeof window !== 'undefined') {
	window.otherMessages = otherMessages;
}
