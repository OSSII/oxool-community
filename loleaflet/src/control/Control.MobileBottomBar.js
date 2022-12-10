/* -*- js-indent-level: 8 -*- */
/*
 * L.Control.MobileBottomBar
 */

/* global $ w2ui _ _UNO */
L.Control.MobileBottomBar = L.Control.extend({

	options: {
		doctype: 'text'
	},

	_bar: null,

	initialize: function (docType) {
		L.setOptions(this, {docType: docType});
	},

	onAdd: function (map) {
		this.map = map;
		this.create();

		map.on('contextchange', this.onContextChange, this);
	},

	getToolItems: function(docType) {
		if (docType === 'drawing') {
			docType = 'presentation';
		}

		var toolbarItems = {
			common: [
				{	// 顯示搜尋 bar
					type: 'button',  id: 'showsearchbar',  img: 'search', hint: _('Show the search bar')
				},
				{type: 'break'},
				{	// 粗體
					type: 'button',  id: 'bold',  img: 'bold', hint: _UNO('.uno:Bold'), uno: '.uno:Bold',
					stateChange: true
				},
				{	// 斜體
					type: 'button',  id: 'italic', img: 'italic', hint: _UNO('.uno:Italic'), uno: '.uno:Italic',
					stateChange: true
				},
				{	// 底線
					type: 'button',  id: 'underline',  img: 'underline', hint: _UNO('.uno:Underline'), uno: '.uno:Underline',
					stateChange: true
				},
				{type: 'break'},
				{	// 字體顏色
					type: 'button',  id: 'fontcolor', img: 'textcolor', hint: _UNO('.uno:FontColor')
				},
				{	// 背景顏色
					type: 'button',  id: 'backcolor', img: 'backcolor', hint: _UNO('.uno:BackgroundColor')
				},
				{type: 'break'}
			],

			text: [
				{	// 對齊選單
					type: 'menu', id: 'textalign', img: 'alignblock', hint: _UNO('.uno:TextAlign', docType, true),
					items: [
						{	// 對齊左側
							id: 'alignleft', text: _UNO('.uno:CommonAlignLeft', docType), img: 'alignleft',
							uno: '.uno:CommonAlignLeft', stateChange: true
						},
						{	// 置中
							id: 'alignhorizontalcenter', text: _UNO('.uno:CommonAlignHorizontalCenter', docType), img: 'alignhorizontal',
							uno: '.uno:CommonAlignHorizontalCenter', stateChange: true
						},
						{	// 對齊右側
							id: 'alignright', text: _UNO('.uno:CommonAlignRight', docType), img: 'alignright',
							uno: '.uno:CommonAlignRight', stateChange: true
						},
						{	// 分散對齊
							id: 'alignblock', text: _UNO('.uno:CommonAlignJustified', docType), img: 'alignblock',
							uno: '.uno:CommonAlignJustified', stateChange: true
						},
						{type: 'break'},
						{	// 對齊上方
							id: 'aligntop', text: _UNO('.uno:CommonAlignTop', docType), img: 'aligntop',
							uno: '.uno:CommonAlignTop', stateChange: true
						},
						{	// 垂直中間
							id: 'alignvcenter', text: _UNO('.uno:CommonAlignVerticalCenter', docType), img: 'alignvcenter',
							uno: '.uno:CommonAlignVerticalCenter', stateChange: true
						},
						{	// 對齊底部
							id: 'alignbottom', text: _UNO('.uno:CommonAlignBottom', docType), img: 'alignbottom',
							uno: '.uno:CommonAlignBottom', stateChange: true
						},
					]
				},
				{type: 'break', id: 'breakspacing'},
				{	// 數字清單
					type: 'button',  id: 'defaultnumbering',  img: 'numbering', hint: _UNO('.uno:DefaultNumbering', docType),uno: '.uno:DefaultNumbering',
					stateChange: true
				},
				{	// 符號清單
					type: 'button',  id: 'defaultbullet',  img: 'bullet', hint: _UNO('.uno:DefaultBullet', docType), uno: '.uno:DefaultBullet',
					stateChange: true
				},
				{type: 'break', id: 'breakbullet', hidden: true},
				{	// 增加縮排
					type: 'button',  id: 'incrementindent',  img: 'incrementindent', hint: _UNO('.uno:IncrementIndent', docType), uno: '.uno:IncrementIndent',
					stateChange: true
				},
				{	// 減少縮排
					type: 'button',  id: 'decrementindent',  img: 'decrementindent', hint: _UNO('.uno:DecrementIndent', docType), uno: '.uno:DecrementIndent',
					stateChange: true
				},
				{type: 'break', context: ['Table']},
				{	// 表格(列)選單
					type: 'menu', id: 'insertrowsbefore', img: 'insertrowsbefore', hint: _UNO('.uno:InsertRowsBefore'), context: ['Table'],
					items: [
						{	// 前方插列
							id: 'insertrowsbefore', text: _UNO('.uno:InsertRowsBefore', docType), img: 'insertrowsbefore', uno: '.uno:InsertRowsBefore',
							stateChange: true
						},
						{	// 後方插列
							id: 'insertrowsafter', text: _UNO('.uno:InsertRowsAfter', docType), img: 'insertrowsafter', uno: '.uno:InsertRowsAfter',
							stateChange: true
						},
						{	// 刪除列
							id: 'deleterows', text: _UNO('.uno:DeleteRows', docType), img: 'deleterows', uno: '.uno:DeleteRows',
							stateChange: true
						},
						{type: 'break'},
						{	// 選取儲存格
							id: 'entirecell', text: _UNO('.uno:EntireCell', docType), img: 'entirecell', uno: '.uno:EntireCell',
							stateChange: true
						},
						{	// 選取整列
							id: 'entirerow', text: _UNO('.uno:EntireRow', docType), img: 'entirerow', uno: '.uno:EntireRow',
							stateChange: true
						},
						{
							id: 'selecttable', text: _UNO('.uno:SelectTable', docType), img: 'selecttable', uno: '.uno:SelectTable',
							stateChange: true
						},
						{type: 'break'},
						{	// 最佳列高
							id: 'setoptimalrowheight', text: _UNO('.uno:SetOptimalRowHeight', docType), img: 'setoptimalrowheight', uno: '.uno:SetOptimalRowHeight',
							stateChange: true
						},
					]
				},
				{	// 表格(欄)功能表
					type: 'menu', id: 'insertcolumnsbefore', img: 'insertcolumnsbefore', hint: _UNO('.uno:InsertColumnsBefore'), context: ['Table'],
					items: [
						{	// 前方插欄
							id: 'insertcolumnsbefore', text: _UNO('.uno:InsertColumnsBefore', docType), img: 'insertcolumnsbefore', uno: '.uno:InsertColumnsBefore',
							stateChange: true
						},
						{	// 後方插欄
							id: 'insertcolumnsafter', text: _UNO('.uno:InsertColumnsAfter', docType), img: 'insertcolumnsafter', uno: '.uno:InsertColumnsAfter'
						},
						{	// 刪除欄
							id: 'deletecolumns', text: _UNO('.uno:DeleteColumns', docType), img: 'deletecolumns', uno: '.uno:DeleteColumns',
							stateChange: true
						},
						{type: 'break'},
						{	// 選取儲存格
							id: 'entirecell', text: _UNO('.uno:EntireCell', docType), img: 'entirecell', uno: '.uno:EntireCell',
							stateChange: true
						},
						{	// 選取整欄
							id: 'entirecolumn', text: _UNO('.uno:EntireColumn', docType), img: 'entirecolumn', uno: '.uno:EntireColumn',
							stateChange: true
						},
						{	// 選取表格
							id: 'selecttable', text: _UNO('.uno:SelectTable', docType), img: 'selecttable', uno: '.uno:SelectTable',
							stateChange: true
						},
						{type: 'break'},
						{	// 最佳欄寬
							id: 'setoptimalcolumnwidth', text: _UNO('.uno:SetOptimalColumnWidth', docType), img: 'setoptimalcolumnwidth', uno: '.uno:SetOptimalColumnWidth',
							stateChange: true
						},
					]
				},
				{	// 合併儲存格
					type: 'button',  id: 'togglemergecells',  img: 'togglemergecells', hint: _UNO('.uno:ToggleMergeCells', docType), uno: '.uno:MergeCells', context: ['Table'],
					stateChange: true
				},
				{type: 'break', context: ['Graphic', 'Draw']},
				{	// 環繞選單
					type: 'menu', id: 'wrapmenu', img: 'wrapmenu', hint: _UNO('.uno:WrapMenu'), context: ['Graphic', 'Draw'],
					items: [
						{
							id: 'wrapoff', text: _UNO('.uno:WrapOff', docType), img: 'wrapoff', uno: '.uno:WrapOff',
							stateChange: true
						},
						{
							id: 'wrapon', text: _UNO('.uno:WrapOn', docType), img: 'wrapon', uno: '.uno:WrapOn',
							stateChange: true
						},
						{
							id: 'wrapideal', text: _UNO('.uno:WrapIdeal', docType), img: 'wrapideal', uno: '.uno:WrapIdeal',
							stateChange: true
						},
						{type: 'break'},
						{
							id: 'wrapleft', text: _UNO('.uno:WrapLeft', docType), img: 'wrapleft', uno: '.uno:WrapLeft',
							stateChange: true
						},
						{
							id: 'wrapright', text: _UNO('.uno:WrapRight', docType), img: 'wrapright', uno: '.uno:WrapRight',
							stateChange: true
						},
						{
							id: 'wrapthrough', text: _UNO('.uno:WrapThrough', docType), img: 'wrapthrough', uno: '.uno:WrapThrough',
							stateChange: true
						},
						{type: 'break'},
						{
							id: 'wrapthroughtransparencytoggle', text: _UNO('.uno:WrapThroughTransparencyToggle', docType), img: 'wrapthroughtransparencytoggle', uno: '.uno:WrapThroughTransparencyToggle',
							stateChange: true
						},
						{
							id: 'wrapcontour', text: _UNO('.uno:WrapContour', docType), img: 'wrapcontour', uno: '.uno:WrapContour',
							stateChange: true
						},
						{
							id: 'wrapanchoronly', text: _UNO('.uno:WrapAnchorOnly', docType), img: 'wrapanchoronly', uno: '.uno:WrapAnchorOnly',
							stateChange: true
						},
					]
				},
				{type: 'break', context: ['Graphic', 'Draw']},
				{	// 物件對齊
					type: 'menu', id: 'aligncenter', img: 'aligncenter', hint: _UNO('.uno:AlignCenter'), context: ['Graphic', 'Draw'],
					items: [
						{
							id: 'objectalignleft', text: _UNO('.uno:ObjectAlignLeft', docType), img: 'objectalignleft', uno: '.uno:ObjectAlignLeft',
							stateChange: true
						},
						{
							id: 'aligncenter', text: _UNO('.uno:AlignCenter', docType), img: 'aligncenter', uno: '.uno:AlignCenter',
							stateChange: true
						},
						{
							id: 'objectalignright', text: _UNO('.uno:ObjectAlignRight', docType), img: 'objectalignright', uno: '.uno:ObjectAlignRight',
							stateChange: true
						},
						{type: 'break'},
						{
							id: 'alignup', text: _UNO('.uno:AlignUp', docType), img: 'alignup', uno: '.uno:AlignUp',
							stateChange: true
						},
						{
							id: 'alignmiddle', text: _UNO('.uno:AlignMiddle', docType), img: 'alignmiddle', uno: '.uno:AlignMiddle'
						},
						{
							id: 'aligndown', text: _UNO('.uno:AlignDown', docType), img: 'aligndown', uno: '.uno:AlignDown',
							stateChange: true
						},
					]
				},
				{	// 編排選單
					type: 'menu', id: 'arrangemenu', img: 'arrangemenu', hint: _UNO('.uno:ArrangeMenu'), context: ['Graphic', 'Draw'],
					items: [
						{
							id: 'bringtofront', text: _UNO('.uno:BringToFront', docType), img: 'bringtofront', uno: '.uno:BringToFront',
							stateChange: true
						},
						{type: 'break'},
						{
							id: 'objectforwardone', text: _UNO('.uno:ObjectForwardOne', docType), img: 'objectforwardone', uno: '.uno:ObjectForwardOne',
							stateChange: true
						},
						{
							id: 'objectbackone', text: _UNO('.uno:ObjectBackOne', docType), img: 'objectbackone', uno: '.uno:ObjectBackOne',
							stateChange: true
						},
						{type: 'break'},
						{
							id: 'sendtoback', text: _UNO('.uno:SendToBack', docType), img: 'sendtoback', uno: '.uno:SendToBack',
							stateChange: true
						},
					]
				},
				{	// 垂直翻轉
					type: 'button',  id: 'flipvertical',  img: 'flipvertical', hint: _UNO('.uno:FlipVertical', docType, true), uno: '.uno:FlipVertical', context: ['Graphic', 'Draw'],
					stateChange: true
				},
				{	// 水平翻轉
					type: 'button',  id: 'fliphorizontal',  img: 'fliphorizontal', hint: _UNO('.uno:FlipHorizontal', docType, true), uno: '.uno:FlipHorizontal', context: ['Graphic', 'Draw'],
					stateChange: true
				},
			],

			spreadsheet: [
				{	// 對齊選單
					type: 'menu', id: 'textalign', img: 'alignblock', hint: _UNO('.uno:TextAlign', docType, true),
					items: [
						{	// 對齊左側
							id: 'alignleft', text: _UNO('.uno:CommonAlignLeft', docType), img: 'alignleft',
							uno: '.uno:CommonAlignLeft', stateChange: true
						},
						{	// 置中
							id: 'alignhorizontalcenter', text: _UNO('.uno:CommonAlignHorizontalCenter', docType), img: 'alignhorizontal',
							uno: '.uno:CommonAlignHorizontalCenter', stateChange: true
						},
						{	// 對齊右側
							id: 'alignright', text: _UNO('.uno:CommonAlignRight', docType), img: 'alignright',
							uno: '.uno:CommonAlignRight', stateChange: true
						},
						{	// 分散對齊
							id: 'alignblock', text: _UNO('.uno:CommonAlignJustified', docType), img: 'alignblock',
							uno: '.uno:CommonAlignJustified', stateChange: true
						},
						{type: 'break'},
						{	// 對齊上方
							id: 'aligntop', text: _UNO('.uno:CommonAlignTop', docType), img: 'aligntop',
							uno: '.uno:CommonAlignTop', stateChange: true
						},
						{	// 垂直中間
							id: 'alignvcenter', text: _UNO('.uno:CommonAlignVerticalCenter', docType), img: 'alignvcenter',
							uno: '.uno:CommonAlignVerticalCenter', stateChange: true
						},
						{	// 對齊底部
							id: 'alignbottom', text: _UNO('.uno:CommonAlignBottom', docType), img: 'alignbottom',
							uno: '.uno:CommonAlignBottom', stateChange: true
						},
					]
				},
				{	// 文字折行
					type: 'button',  id: 'wraptext',  img: 'wraptext', hint: _UNO('.uno:WrapText', docType), uno: '.uno:WrapText',
					stateChange: true
				},
				{type: 'break'},
				{	// 列選單
					type: 'menu', id: 'insertrowsbefore', img: 'insertrowsbefore', hint: _UNO('.uno:InsertRowsBefore'),
					items: [
						{	// 上方插列
							id: 'insertrowsbefore', text: _UNO('.uno:InsertRowsBefore', docType), img: 'insertrowsbefore', uno: '.uno:InsertRowsBefore',
							stateChange: true
						},
						{	// 下方插列
							id: 'insertrowsafter', text: _UNO('.uno:InsertRowsAfter', docType), img: 'insertrowsafter', uno: '.uno:InsertRowsAfter',
							stateChange: true
						},
						{	// 刪除列
							id: 'deleterows', text: _UNO('.uno:DeleteRows', docType), img: 'deleterows', uno: '.uno:DeleteRows',
							stateChange: true
						},
						{type: 'break'},
						{	// 隱藏列
							id: 'hiderow', text: _UNO('.uno:HideRow', docType), img: 'hiderow', uno: '.uno:HideRow',
							stateChange: true
						},
						{	// 顯示列
							id: 'showrow', text: _UNO('.uno:ShowRow', docType), img: 'showrow', uno: '.uno:ShowRow',
							stateChange: true
						},
					]
				},
				{	// 欄選單
					type: 'menu', id: 'insertcolumnsbefore', img: 'insertcolumnsbefore', hint: _UNO('.uno:InsertColumnsBefore'),
					items: [
						{	// 前方插欄
							id: 'insertcolumnsbefore', text: _UNO('.uno:InsertColumnsBefore', docType), img: 'insertcolumnsbefore', uno: '.uno:InsertColumnsBefore',
							stateChange: true
						},
						{	// 後方插欄
							id: 'insertcolumnsafter', text: _UNO('.uno:InsertColumnsAfter', docType), img: 'insertcolumnsafter', uno: '.uno:InsertColumnsAfter',
							stateChange: true
						},
						{	// 刪除欄
							id: 'deletecolumns', text: _UNO('.uno:DeleteColumns', docType), img: 'deletecolumns', uno: '.uno:DeleteColumns',
							stateChange: true
						},
						{type: 'break'},
						{	// 隱藏欄
							id: 'hidecolumn', text: _UNO('.uno:HideColumn', docType), img: 'hidecolumn', uno: '.uno:HideColumn',
							stateChange: true
						},
						{	// 顯示欄
							id: 'showcolumn', text: _UNO('.uno:ShowColumn', docType), img: 'showcolumn', uno: '.uno:ShowColumn',
							stateChange: true
						},
					]
				},
				{	// 合併與置儲存格中
					type: 'button',  id: 'togglemergecells',  img: 'togglemergecells', hint: _UNO('.uno:ToggleMergeCells', docType), uno: '.uno:ToggleMergeCells',
					stateChange: true
				},
				{type: 'break'},
				{	// 條件式
					type: 'drop', id: 'conditionalformaticonset',  img: 'conditionalformatdialog', hint: _UNO('.uno:ConditionalFormatMenu', docType), html: window.getConditionalFormatMenuHtml(), uno: '.uno:ConditionalFormatMenu',
					stateChange: true
				},
				{	// 按升序排序(由小到大)
					type: 'button',  id: 'sortascending',  img: 'sortascending', hint: _UNO('.uno:SortAscending', docType), uno: '.uno:SortAscending',
					stateChange: true
				},
				{	// 按降序排序(由小到大)
					type: 'button',  id: 'sortdescending',  img: 'sortdescending', hint: _UNO('.uno:SortDescending', docType), uno: '.uno:SortDescending',
					stateChange: true
				},
				{type: 'break'},
				{	// 數字格式
					type: 'menu', id: 'numberformatstandard', img: 'numberformatstandard', hint: _UNO('.uno:NumberFormatStandard'),
					items: [
						{	// 一般
							id: 'numberformatstandard', text: _UNO('.uno:NumberFormatStandard', docType), img: 'numberformatstandard', uno: '.uno:NumberFormatStandard',
							stateChange: true
						},
						{	// 數字
							id: 'numberformatdecimal', text: _UNO('.uno:NumberFormatDecimal', docType), img: 'numberformatdecimal', uno: '.uno:NumberFormatDecimal',
							stateChange: true
						},
						{	// 百分比
							id: 'numberformatpercent', text: _UNO('.uno:NumberFormatPercent', docType), img: 'numberformatpercent', uno: '.uno:NumberFormatPercent',
							stateChange: true
						},
						{	// 貨幣
							id: 'numberformatcurrency', text: _UNO('.uno:NumberFormatCurrency', docType), img: 'numberformatcurrency', uno: '.uno:NumberFormatCurrency',
							stateChange: true
						},
						{	// 	日期
							id: 'numberformatdate', text: _UNO('.uno:NumberFormatDate', docType), img: 'numberformatdate', uno: '.uno:NumberFormatDate',
							stateChange: true
						},
						{	// 時間
							id: 'numberformattime', text: _UNO('.uno:NumberFormatTime', docType), img: 'numberformattime', uno: '.uno:NumberFormatTime',
							stateChange: true
						},
						{	// 科學
							id: 'numberformatscientific', text: _UNO('.uno:NumberFormatScientific', docType), img: 'numberformatscientific', uno: '.uno:NumberFormatScientific',
							stateChange: true
						},
						{type: 'break'},
						{	// 千位分隔符
							id: 'numberformatthousands', text: _UNO('.uno:NumberFormatThousands', docType), img: 'numberformatthousands', uno: '.uno:NumberFormatThousands',
							stateChange: true
						},
					]
				},
				{	// 增加小數位
					type: 'button',  id: 'numberformatincdecimals',  img: 'numberformatincdecimals', hint: _UNO('.uno:NumberFormatIncDecimals', docType), uno: '.uno:NumberFormatIncDecimals',
					stateChange: true
				},
				{	// 減少小數位
					type: 'button',  id: 'numberformatdecdecimals',  img: 'numberformatdecdecimals', hint: _UNO('.uno:NumberFormatDecDecimals', docType), uno: '.uno:NumberFormatDecDecimals',
					stateChange: true
				},
			],

			presentation: [
				// context: ['DrawPage']
				{	// 插入投影片
					type: 'button',  id: 'insertpage',  img: 'insertpage', hint: _UNO('.uno:InsertPage', 'presentation', true), uno: '.uno:InsertPage', context: ['DrawPage'],
					stateChange: true
				},
				{	// 再製投影片
					type: 'button',  id: 'duplicatepage',  img: 'duplicatepage', hint: _UNO('.uno:DuplicatePage', 'presentation', true), uno: '.uno:DuplicatePage', context: ['DrawPage'],
					stateChange: true
				},
				{	// 刪除投影片
					type: 'button',  id: 'deletepage',  img: 'deletepage', hint: _UNO('.uno:DeletePage', 'presentation', true), uno: '.uno:DeletePage', context: ['DrawPage'],
					stateChange: true
				},
				{	// 文字對齊選單
					type: 'menu', id: 'textalign', img: 'alignblock',
					items: [
						{	// 靠左
							id: 'leftpara', text: _UNO('.uno:LeftPara', docType), img: 'alignleft', uno: '.uno:LeftPara',
							stateChange: true
						},
						{	// 置中
							id: 'centerpara', text: _UNO('.uno:CenterPara', docType), img: 'alignhorizontal', uno: '.uno:CenterPara',
							stateChange: true
						},
						{	// 靠右
							id: 'rightpara', text: _UNO('.uno:RightPara', docType), img: 'alignright', uno: '.uno:RightPara',
							stateChange: true
						},
						{	// 分散對齊
							id: 'justifypara', text: _UNO('.uno:JustifyPara', docType), img: 'alignblock', uno: '.uno:JustifyPara',
							stateChange: true
						},
						{type: 'break'},
						{	// 上方
							id: 'cellverttop', text: _UNO('.uno:CellVertTop', docType), img: 'cellverttop', uno: '.uno:CellVertTop',
							stateChange: true
						},
						{	// 中央
							id: 'cellvertcenter', text: _UNO('.uno:CellVertCenter', docType), img: 'cellvertcenter', uno: '.uno:CellVertCenter',
							stateChange: true
						},
						{	// 下方
							id: 'cellvertbottom', text: _UNO('.uno:CellVertBottom', docType), img: 'cellvertbottom', uno: '.uno:CellVertBottom',
							stateChange: true
						},
					]
				},
				{type: 'break'},
				{	// 數字清單
					type: 'button',  id: 'defaultnumbering',  img: 'numbering', hint: _UNO('.uno:DefaultNumbering', docType),uno: '.uno:DefaultNumbering',
					stateChange: true
				},
				{	// 項目符號
					type: 'button',  id: 'defaultbullet',  img: 'bullet', hint: _UNO('.uno:DefaultBullet', docType), uno: '.uno:DefaultBullet',
					stateChange: true
				},
				{	// 物件對齊選單
					type: 'menu', id: 'objectalign', img: 'objectalignleft',
					items: [
						{	// 靠左
							id: 'objectalignleft', text: _UNO('.uno:ObjectAlignLeft', docType), img: 'objectalignleft', uno: '.uno:ObjectAlignLeft',
							stateChange: true
						},
						{	// 置中
							id: 'objectaligncenter', text: _UNO('.uno:AlignCenter', docType), img: 'aligncenter', uno: '.uno:AlignCenter',
							stateChange: true
						},
						{	// 靠右
							id: 'objectalignright', text: _UNO('.uno:ObjectAlignRight', docType), img: 'objectalignright', uno: '.uno:ObjectAlignRight',
							stateChange: true
						},
						{type: 'break'},
						{	// 上方
							id: 'alignup', text: _UNO('.uno:AlignUp', docType), img: 'alignup', uno: '.uno:AlignUp',
							stateChange: true
						},
						{	// 中央
							id: 'alignmiddle', text: _UNO('.uno:AlignMiddle', docType), img: 'alignmiddle', uno: '.uno:AlignMiddle',
							stateChange: true
						},
						{	// 下方
							id: 'aligndown', text: _UNO('.uno:AlignDown', docType), img: 'aligndown', uno: '.uno:AlignDown',
							stateChange: true
						},
					]
				},
				{type: 'break', context: ['Table']},
				{	// 表格(列)選單
					type: 'menu', id: 'insertrowsbefore', img: 'insertrowsbefore', hint: _UNO('.uno:InsertRowsBefore'), context: ['Table'],
					items: [
						{	// 前方插列
							id: 'insertrowsbefore', text: _UNO('.uno:InsertRowsBefore', docType), img: 'insertrowsbefore', uno: '.uno:InsertRowsBefore',
							stateChange: true
						},
						{	// 後方插列
							id: 'insertrowsafter', text: _UNO('.uno:InsertRowsAfter', docType), img: 'insertrowsafter', uno: '.uno:InsertRowsAfter',
							stateChange: true
						},
						{	// 刪除列
							id: 'deleterows', text: _UNO('.uno:DeleteRows', docType), img: 'deleterows', uno: '.uno:DeleteRows',
							stateChange: true
						},
						{type: 'break'},
						{	// 選取整列
							id: 'entirerow', text: _UNO('.uno:EntireRow', docType), img: 'entirerow', uno: '.uno:EntireRow',
							stateChange: true
						},
						{
							id: 'selecttable', text: _UNO('.uno:SelectTable', docType), img: 'selecttable', uno: '.uno:SelectTable',
							stateChange: true
						},
						{type: 'break'},
						{	// 最佳列高
							id: 'setoptimalrowheight', text: _UNO('.uno:SetOptimalRowHeight', docType), img: 'setoptimalrowheight', uno: '.uno:SetOptimalRowHeight',
							stateChange: true
						},
					]
				},
				{	// 表格(欄)功能表
					type: 'menu', id: 'insertcolumnsbefore', img: 'insertcolumnsbefore', hint: _UNO('.uno:InsertColumnsBefore'), context: ['Table'],
					items: [
						{	// 前方插欄
							id: 'insertcolumnsbefore', text: _UNO('.uno:InsertColumnsBefore', docType), img: 'insertcolumnsbefore', uno: '.uno:InsertColumnsBefore',
							stateChange: true
						},
						{	// 後方插欄
							id: 'insertcolumnsafter', text: _UNO('.uno:InsertColumnsAfter', docType), img: 'insertcolumnsafter', uno: '.uno:InsertColumnsAfter'
						},
						{	// 刪除欄
							id: 'deletecolumns', text: _UNO('.uno:DeleteColumns', docType), img: 'deletecolumns', uno: '.uno:DeleteColumns',
							stateChange: true
						},
						{type: 'break'},
						{	// 選取整欄
							id: 'entirecolumn', text: _UNO('.uno:EntireColumn', docType), img: 'entirecolumn', uno: '.uno:EntireColumn',
							stateChange: true
						},
						{	// 選取表格
							id: 'selecttable', text: _UNO('.uno:SelectTable', docType), img: 'selecttable', uno: '.uno:SelectTable',
							stateChange: true
						},
						{type: 'break'},
						{	// 最佳欄寬
							id: 'setoptimalcolumnwidth', text: _UNO('.uno:SetOptimalColumnWidth', docType), img: 'setoptimalcolumnwidth', uno: '.uno:SetOptimalColumnWidth',
							stateChange: true
						},
					]
				},
				{	// 合併儲存格
					type: 'button',  id: 'togglemergecells',  img: 'togglemergecells', hint: _UNO('.uno:ToggleMergeCells', docType), uno: '.uno:MergeCells', context: ['Table'],
					stateChange: true
				},
				// context: ['Draw', 'DrawLine', '3DObject', 'MultiObject', 'Graphic', 'DrawFontwork']
				{	// 編排選單
					type: 'menu', id: 'arrangemenu', img: 'arrangemenu', context: ['Draw', 'DrawLine', '3DObject', 'MultiObject', 'Graphic', 'DrawFontwork'],
					items: [
						{
							id: 'bringtofront', text: _UNO('.uno:BringToFront', docType), img: 'bringtofront', uno: '.uno:BringToFront',
							stateChange: true
						},
						{type: 'break'},
						{
							id: 'objectforwardone', text: _UNO('.uno:Forward', docType), img: 'objectforwardone', uno: '.uno:Forward',
							stateChange: true
						},
						{
							id: 'objectbackone', text: _UNO('.uno:Backward', docType), img: 'objectbackone', uno: '.uno:Backward',
							stateChange: true
						},
						{type: 'break'},
						{
							id: 'sendtoback', text: _UNO('.uno:SendToBack', docType), img: 'sendtoback', uno: '.uno:SendToBack',
							stateChange: true
						},
					]
				},
				{
					type: 'button',  id: 'flipvertical',  img: 'flipvertical', uno: '.uno:MirrorVert', context: ['Draw', 'DrawLine', '3DObject', 'MultiObject', 'Graphic', 'DrawFontwork'],
					stateChange: true
				},
				{
					type: 'button',  id: 'fliphorizontal',  img: 'fliphorizontal', uno: '.uno:MirrorHorz', context: ['Draw', 'DrawLine', '3DObject', 'MultiObject', 'Graphic', 'DrawFontwork'],
					stateChange: true
				},
			],
		};

		return toolbarItems[docType] ?
			toolbarItems.common.concat(toolbarItems[docType])
			: toolbarItems.common;
	},

	create: function() {
		// 不重複建立工具列
		if (this._bar !== null) {
			return;
		}

		var map = this.map;

		var toolbar = $('#toolbar-down');
		this._bar = toolbar.w2toolbar({
			name: 'editbar',
			items: this.getToolItems(this.options.docType),
			onClick: function (e) {
				// In the iOS app we don't want clicking on the toolbar to pop up the keyboard.
				if (!window.ThisIsTheiOSApp) {
					map.focus(map.canAcceptKeyboardInput()); // Maintain same keyboard state.
				}
				// 檢查是否點擊到次選單選項
				var clickedItem = (e.subItem ? e.subItem : e.item);
				// item 沒有自己的 onClick 事件，才執行系統的 onClick 事件
				if (typeof(clickedItem.onClick) !== 'function') {
					if (clickedItem.uno) {
						map.executeAllowedCommand(clickedItem.uno);
					} else {
						window.onClick(e, e.target);
					}
				}
				window.hideTooltip(this, e.target);
			},
		});
		this.map.uiManager.enableTooltip(toolbar);

		toolbar.bind('touchstart', function(e) {
			w2ui['editbar'].touchStarted = true;
			var touchEvent = e.originalEvent;
			if (touchEvent && touchEvent.touches.length > 1) {
				L.DomEvent.preventDefault(e);
			}
		});

		this.map.setupStateChangesForToolbar({toolbar: this._bar});
	},

	onContextChange: function(/*event*/) {
		// do nothing.
	},
});

L.control.mobileBottomBar = function (docType) {
	return new L.Control.MobileBottomBar(docType);
};
