/* -*- js-indent-level: 8 -*- */
/*
 * L.Control.TopToolbar
 */

/* global $ w2ui _ _UNO */
L.Control.TopToolbar = L.Control.extend({
	options: {
		stylesSelectValue: null,
		fontsSelectValue: null
	},

	_bar: null, // 紀錄自己的 toolbar

	onAdd: function (map) {
		var that = this;
		this.map = map;
		this.create();

		map.on('doclayerinit', this.onDocLayerInit, this);
		map.on('updatepermission', this.onUpdatePermission, this);
		map.on('wopiprops', this.onWopiProps, this);
		map.on('contextchange', this.onContextChange, this);

		if (!window.mode.isMobile()) {
			map.on('updatetoolbarcommandvalues', this.updateCommandValues, this);
		}

		$(window).resize(function() {
			if ($(window).width() !== map.getSize().x) {
				if (that._bar)
					that._bar.resize();
			}
		});
	},

	onRemove: function() {
		// 移除 toolbar item state change 註冊
		this.map.setupStateChangesForToolbar({toolbar: this._bar, remove: true});

		$().w2destroy('editbar');
		L.DomUtil.get('toolbar-up').remove();

		this.map.off('doclayerinit', this.onDocLayerInit, this);
		this.map.off('updatepermission', this.onUpdatePermission, this);
		this.map.off('wopiprops', this.onWopiProps, this);

		if (!window.mode.isMobile()) {
			this.map.off('updatetoolbarcommandvalues', this.updateCommandValues, this);
		}
	},

	onStyleSelect: function(e) {
		var style = e.target.value;
		if (style.startsWith('.uno:')) {
			this.map.sendUnoCommand(style);
		}
		else if (this.map.getDocType() === 'text') {
			this.map.applyStyle(style, 'ParagraphStyles');
		}
		else if (this.map.getDocType() === 'spreadsheet') {
			this.map.applyStyle(style, 'CellStyles');
		}
		else if (this.map.getDocType() === 'presentation' || this.map.getDocType() === 'drawing') {
			this.map.applyLayout(style);
		}
		this.map.focus();
	},

	// 編輯對象有異動都會呼叫這裡
	onContextChange: function(/*event*/) {
		// TODO: 未來需要增加依據對象不同，出現適用於對象的其他工具列
	},

	// mobile:false means hide it both for normal Online used from a mobile phone browser, and in a mobile app on a mobile phone
	// mobilebrowser:false means hide it for normal Online used from a mobile browser, but don't hide it in a mobile app
	// tablet:true means show it in normal Online from a tablet browser, and in a mobile app on a tablet
	// tablet:false means hide it in normal Online used from a tablet browser, and in a mobile app on a tablet

	getToolItems: function() {
		var that = this;
		var docType = this.map.getDocType();
		if (docType) {
			if (docType === 'drawing') docType = 'presentation'; // 繪圖和簡報相同
		} else {
			docType = 'text';
		}

		return [
			{	// 平板模式從編輯模式回到唯獨模式的按鈕
				type: 'button', id: 'closemobile', img: 'closemobile', desktop: false, mobile: false, tablet: true, hidden: true,
				onClick: function() {
					that.map.uiManager.enterReadonlyOrClose();
				}
			},
			{	// 存檔
				type: 'button', id: 'save', img: 'save', hint: _UNO('.uno:Save', docType, true), uno:
				'.uno:Save',
				stateChange: {
					commandName: '.uno:Save .uno:ModifiedStatus', // 監督兩個狀態
					callback: function(e) {
						switch (e.commandName) {
						case '.uno:Save': // 存檔
							this.disabled = e.disabled(); // 紀錄禁用狀態
							break;
						case '.uno:ModifiedStatus': // 檔案修改狀態
							// 已修改
							if (e.state === 'true') {
								this.disabled = false; // 按鈕不禁用
								this.img = 'savemodified'; // 改變圖示
							} else { // 未修改
								this.img = 'save';
							}
							break;
						}
						w2ui['editbar'].refresh(this.id); // 重新顯示按鈕
					}
				}
			},
			{	// 列印
				type: 'button', id: 'print', img: 'print', hint: _UNO('.uno:Print', docType, true), mobile: false, tablet: false,
				uno: '.uno:Print', stateChange: true // 簡單處理 check/uncheck, enable/disable
			},
			{type: 'break', id: 'savebreak', mobile: false},
			{	// 復原
				type: 'button', id: 'undo', img: 'undo', hint: _UNO('.uno:Undo', docType, true),
				uno: '.uno:Undo', disabled: true, mobile: false, stateChange: true
			},
			{	// 重做
				type: 'button', id: 'redo', img: 'redo', hint: _UNO('.uno:Redo', docType, true),
				uno: '.uno:Redo', disabled: true, mobile: false, stateChange: true
			},
			{type: 'break', id: 'redobreak', mobile: false, tablet: false,},
			{	// 複製格式
				type: 'button', id: 'formatpaintbrush', img: 'copyformat', hint: _('Clone Formatting (double click and Ctrl or Cmd to alter behavior)'),
				uno: '.uno:FormatPaintbrush', mobile: false,
				onClick: function(id, e) {
					var item = e.item;
					// 模擬雙擊
					if (item._clickCount !== undefined) {
						item._clickCount ++; // 有點擊次數的話， +1
					} else {
						item._clickCount = 1; // 從 1 開始
					}
					// 已經有間隔檢測的話，就結束
					if (item._timeoutID !== undefined) return;
					// 間隔檢測為 1/4 秒
					item._timeoutID = setTimeout(function() {
						that.map.sendUnoCommand(item.uno, {
							PersistentCopy: {
								type: 'boolean',
								value: item._clickCount > 1 // true:連續刷格式, false: 只刷一次
							}
						});
						delete item._timeoutID; // 刪除間隔檢測 ID
						delete item._clickCount; // 刪除點擊次數
					}, 250);
				},
				stateChange: true
			},
			{	// writer, calc: 清除直接格式設定
				type: 'button', id: 'reset', img: 'deleteformat', hint: _UNO('.uno:ResetAttributes', docType, true), hidden: true,
				uno: '.uno:ResetAttributes', mobile: false, stateChange: true
			},
			{	// impress: 清除直接格式設定
				type: 'button', id: 'resetimpress', img: 'deleteformat', hint: _UNO('.uno:SetDefault', docType, true), hidden: true,
				uno: '.uno:SetDefault', mobile: false, stateChange: true
			},
			{type: 'break', id: 'assignlayoutbreak', hidden:true},
			{
				type: 'drop', id: 'assignlayout', img: 'assignlayout', hint: _UNO('.uno:AssignLayout', docType, true),
				overlay: {
					onShow: that.assignLayout.bind(that),
				},
				html: window.getShapesPopupHtml(),
				hidden:true,
				stateChange: '.uno:AssignLayout' // 直接監控該命令，作簡單的 check / disable 檢查
			},
			{	// 式樣
				type: 'html', id: 'styles', disabled: true, mobile: false, tablet: false,
				html: '<select id="styles-select" class="styles-select"><option>' + _('Default Style') + '</option></select>',
				onRefresh: function (edata) {
					if (!edata.item.html) {
						edata.isCancelled = true;
					} else {
						$.extend(edata, { onComplete: function (e) {
							$('#styles-select').select2();
							e.item.html = undefined;
						}});
					}
				},
				stateChange: {
					commandName: '.uno:StyleApply',
					callback: function(e) {
						that.map.simpleStateChecker(e, this);
						$('#styles-select').prop('disabled', this.disabled);
						var container = L.DomUtil.get('tb_' + that._bar.name + '_item_' + this.id);
						if (this.disabled) {
							$(container).addClass('disabled');
						} else {
							$(container).removeClass('disabled');
						}

						if (that.map.getDocType() !== 'text' || !e.hasValue()) {
							return;
						}

						var state = e.state;
						var found = false;

						$('#styles-select option').each(function () {
							var value = this.value;
							// For writer we get UI names; ideally we should be getting only programmatic ones
							// For eg: 'Text body' vs 'Text Body'
							// (likely to be fixed in core to make the pattern consistent)
							if (state && value.toLowerCase() === state.toLowerCase()) {
								state = value;
								found = true;
								return;
							}
						});
						if (!found) {
							// we need to add the size
							$('#styles-select')
								.append($('<option></option>')
									.text(state));
						}

						that.options.stylesSelectValue = state;
						$('#styles-select').val(state).trigger('change');
					}
				}
			},
			{	// 字型名稱
				type: 'html', id: 'fonts', disabled: true, mobile: false,
				html: '<select id="fonts-select" class="fonts-select"><option>Carlito</option></select>',
				onRefresh: function (edata) {
					if (!edata.item.html) {
						edata.isCancelled = true;
					} else {
						$.extend(edata, { onComplete: function (e) {
							e.item.html = undefined;
						}});
					}
				},
				stateChange: {
					commandName: '.uno:CharFontName',
					callback: function(e) {
						var fontcombobox = $('#fonts-select');
						that.map.simpleStateChecker(e, this); // 簡單的 check / disable 檢查
						fontcombobox.prop('disabled', this.disabled);
						var container = L.DomUtil.get('tb_' + that._bar.name + '_item_' + this.id);
						if (this.disabled) {
							$(container).addClass('disabled');
						} else {
							$(container).removeClass('disabled');
						}

						// 有值
						if (e.hasValue()) {
							var state = e.value();
							var found = false;
							fontcombobox.children('option').each(function () {
								var value = this.value;
								if (value.toLowerCase() === state.toLowerCase()) {
									found = true;
									return;
								}
							});

							if (!found && state) {
								fontcombobox
									.append($('<option></option>')
										.text(state));
							}

							fontcombobox.val(state).trigger('change');
						}
					}
				}
			},
			{	// 字型 Size
				type: 'html', id: 'fontsizes', disabled: true, mobile: false,
				html: '<select id="fontsizes-select" class="fontsizes-select">',
				onRefresh: function (edata) {
					if (!edata.item.html) {
						edata.isCancelled = true;
					} else {
						$.extend(edata, { onComplete: function (e) {
							e.item.html = undefined;
						}});
					}
				},
				stateChange: {
					commandName: '.uno:FontHeight',
					callback: function(e) {
						var fontsizecombobox = $('#fontsizes-select');
						that.map.simpleStateChecker(e, this); // 簡單的 check / disable 檢查
						fontsizecombobox.prop('disabled', this.disabled);
						var container = L.DomUtil.get('tb_' + that._bar.name + '_item_' + this.id);
						if (this.disabled) {
							$(container).addClass('disabled');
						} else {
							$(container).removeClass('disabled');
						}
						// 有值
						if (e.hasValue()) {
							var state = e.value();
							var found = false;

							if (state === '0') {
								state = '';
							}

							fontsizecombobox.children('option').each(function (i, e) {
								if ($(e).text() === state) {
									found = true;
								}
							});

							if (!found) {
								// we need to add the size
								fontsizecombobox
									.append($('<option>')
										.text(state).val(state));
							}

							fontsizecombobox.val(state).trigger('change');
						}
					}
				}
			},
			{type: 'break', id: 'breakfontsizes', mobile: false, tablet: false,},
			{	// 粗體
				type: 'button', id: 'bold', img: 'bold', hint: _UNO('.uno:Bold', docType, true),
				uno: '.uno:Bold', stateChange: true
			},
			{	// 斜體
				type: 'button', id: 'italic', img: 'italic', hint: _UNO('.uno:Italic', docType, true),
				uno: '.uno:Italic', stateChange: true
			},
			{	// 底線
				type: 'button', id: 'underline', img: 'underline', hint: _UNO('.uno:Underline', docType, true),
				uno: '.uno:Underline', stateChange: true
			},
			{	// 刪除線
				type: 'button', id: 'strikeout', img: 'strikeout', hint: _UNO('.uno:Strikeout', docType, true),
				uno: '.uno:Strikeout', stateChange: true
			},
			{type: 'break', id: 'breakformatting'},
			{	// 字元顏色
				type: 'drop', id: 'fontcolor', img: 'textcolor', hint: _UNO('.uno:FontColor', docType, true),
				color: 'CC0814', // 暗紅色
				transparent: true,
				onRefresh: function(e) {
					var myContainer = L.DomUtil.get('tb_' + this.name + '_item_' + e.item.id);
					// 設定分隔下拉按鈕功能
					window.setupSplitDropdownButton({
						toolbar: this,
						item: e.item,
						// 主按鈕被點擊
						onMainButtonClick: function(e) {
							window.onColorPick('fontcolor', e.item.color);
						},
						// 箭頭按鈕被點擊
						onArrowButtonClick: function(e) {
							var toolbar = w2ui['editbar'];
							$(myContainer).w2color({color: e.item.color, transparent: e.item.transparent }, function (color) {
								if (color != null) {
									e.item.color = color;
									window.onColorPick('fontcolor', e.item.color);

								}
								toolbar.uncheck(e.item.id);
							});
						}
					});
					// 由於 w2ui 的 refresh 會重新把 html 塞進 myContainer，
					// 所以要稍微延遲一下，待 reflow 完成
					setTimeout(function() {
						that._setColorIndicator(w2ui['editbar'], e.item);
					}, 1);
				},
				stateChange: '.uno:Color',
			},
			{	// 背景顏色
				type: 'drop', id: 'backcolor', img: 'backcolor', hint: _UNO('.uno:BackColor', docType, true), hidden: true,
				color: 'FFFD59', // 黃色
				transparent: true,
				onRefresh: function(e) {
					var myContainer = L.DomUtil.get('tb_' + this.name + '_item_' + e.item.id);
					// 設定分隔下拉按鈕功能
					window.setupSplitDropdownButton({
						toolbar: this,
						item: e.item,
						// 主按鈕被點擊
						onMainButtonClick: function(e) {
							window.onColorPick('charbackcolor', e.item.color);
						},
						// 箭頭按鈕被點擊
						onArrowButtonClick: function(e) {
							var toolbar = w2ui['editbar'];
							$(myContainer).w2color({color: e.item.color, transparent: e.item.transparent }, function (color) {
								if (color != null) {
									e.item.color = color;
									window.onColorPick('charbackcolor', e.item.color);
								}
								toolbar.uncheck(e.item.id);
							});
						}
					});
					// 由於 w2ui 的 refresh 會重新把 html 塞進 myContainer，
					// 所以要稍微延遲一下，待 reflow 完成
					setTimeout(function() {
						that._setColorIndicator(w2ui['editbar'], e.item);
					}, 1);
				},
				stateChange: {
					// Calc, Impress 設定字元背景顏色都是 .uno:CharBackColor，但 Writer 是 .uno:BackColor
					// 而 '.uno:CharBackColor' 在 Writer 中，指的是圖案中文字的背景色
					commandName: '.uno:CharBackColor .uno:BackColor',
					callback: function(e) {
						var docType = that.map.getDocType();
						if (docType === 'text') {
							this.disabled = (that.map.stateChangeHandler.getItemProperty('.uno:CharBackColor').disabled() &&
								that.map.stateChangeHandler.getItemProperty('.uno:BackColor').disabled());
						} else {
							this.disabled = e.disabled();
						}
						w2ui['editbar'].refresh(this.id);
					}
				},
			},
			{	// 儲存格背景
				type: 'drop', id: 'backgroundcolor', img: 'backgroundcolor', hint: _UNO('.uno:BackgroundColor', docType, true), hidden: true,
				color: 'FFFD59', // 黃色
				transparent: true,
				onRefresh: function(e) {
					var myContainer = L.DomUtil.get('tb_' + this.name + '_item_' + e.item.id);
					// 設定分隔下拉按鈕功能
					window.setupSplitDropdownButton({
						toolbar: this,
						item: e.item,
						// 主按鈕被點擊
						onMainButtonClick: function(e) {
							window.onColorPick('backgroundcolor', e.item.color);
						},
						// 箭頭按鈕被點擊
						onArrowButtonClick: function(e) {
							var toolbar = w2ui['editbar'];
							$(myContainer).w2color({color: e.item.color, transparent: e.item.transparent }, function (color) {
								if (color != null) {
									e.item.color = color;
									window.onColorPick('backgroundcolor', e.item.color);
								}
								toolbar.uncheck(e.item.id);
							});
						}
					});
					// 由於 w2ui 的 refresh 會重新把 html 塞進 myContainer，
					// 所以要稍微延遲一下，待 reflow 完成
					setTimeout(function() {
						that._setColorIndicator(w2ui['editbar'], e.item);
					}, 1);
				},
				stateChange: '.uno:BackgroundColor'
			},
			{type: 'break' , id: 'breakcolor', mobile:false},
			{	// 文字或物件靠左
				type: 'button', id: 'leftpara', img: 'alignleft', hint: _UNO('.uno:LeftPara', docType, true),
				uno: '.uno:LeftPara', hidden: true, disabled: true, stateChange: true
			},
			{	// 文字或物件置中
				type: 'button', id: 'centerpara', img: 'alignhorizontal', hint: _UNO('.uno:CenterPara', docType, true),
				uno: '.uno:CenterPara', hidden: true, disabled: true, stateChange: true
			},
			{	// 文字或物件靠右
				type: 'button', id: 'rightpara', img: 'alignright', hint: _UNO('.uno:RightPara', docType, true),
				uno: '.uno:RightPara', hidden: true, disabled: true, stateChange: true
			},
			{	// 分散對齊
				type: 'button', id: 'justifypara', img: 'alignblock', hint: _UNO('.uno:JustifyPara', docType, true),
				uno: '.uno:JustifyPara', hidden: true, disabled: true, stateChange: true
			},
			{type: 'break', id: 'breakpara', hidden: true},
			{	// calc 儲存格邊框
				type: 'drop', id: 'setborderstyle', img: 'setborderstyle', hint: _('Borders'), hidden: true, html: window.getBorderStyleMenuHtml()
			},
			{	// 合併與置中儲存格
				type: 'button', id: 'togglemergecells', img: 'togglemergecells', hint: _UNO('.uno:ToggleMergeCells', docType, true), hidden: true,
				uno: '.uno:ToggleMergeCells', disabled: true, stateChange: true
			},
			{type: 'break', id: 'breakmergecells', hidden: true},
			{type: 'menu', id: 'textalign', img: 'alignblock', hint: _UNO('.uno:TextAlign', docType, true), hidden: true,
				items: [
					{	// 對齊左側
						id: 'alignleft', text: _UNO('.uno:CommonAlignLeft', docType, true), img: 'alignleft',
						uno: '.uno:CommonAlignLeft', stateChange: true
					},
					{	// 置中
						id: 'alignhorizontalcenter', text: _UNO('.uno:CommonAlignHorizontalCenter', docType, true), img: 'alignhorizontal',
						uno: '.uno:CommonAlignHorizontalCenter', stateChange: true
					},
					{	// 對齊右側
						id: 'alignright', text: _UNO('.uno:CommonAlignRight', docType, true), img: 'alignright',
						uno: '.uno:CommonAlignRight', stateChange: true
					},
					{	// 分散對齊
						id: 'alignblock', text: _UNO('.uno:CommonAlignJustified', docType, true), img: 'alignblock',
						uno: '.uno:CommonAlignJustified', stateChange: true
					},
					{type: 'break'},
					{	// 對齊上方
						id: 'aligntop', text: _UNO('.uno:CommonAlignTop', docType, true), img: 'aligntop',
						uno: '.uno:CommonAlignTop', stateChange: true
					},
					{	// 垂直中間
						id: 'alignvcenter', text: _UNO('.uno:CommonAlignVerticalCenter', docType, true), img: 'alignvcenter',
						uno: '.uno:CommonAlignVerticalCenter', stateChange: true
					},
					{	// 對齊底部
						id: 'alignbottom', text: _UNO('.uno:CommonAlignBottom', docType, true), img: 'alignbottom',
						uno: '.uno:CommonAlignBottom', stateChange: true
					},
				]},
			{	// 列間距
				type: 'menu', id: 'linespacing', img: 'linespacing', hint: _UNO('.uno:FormatSpacingMenu', docType, true), hidden: true,
				items: [
					{	// 行距 1
						id: 'spacepara1', img: 'spacepara1', text: _UNO('.uno:SpacePara1', docType, true),
						uno: '.uno:SpacePara1', stateChange: true
					},
					{	// 行距 1.5
						id: 'spacepara15', img: 'spacepara15', text: _UNO('.uno:SpacePara15', docType, true),
						uno: '.uno:SpacePara15', stateChange: true
					},
					{	// 行距 2
						id: 'spacepara2', img: 'spacepara2', text: _UNO('.uno:SpacePara2', docType, true),
						uno: '.uno:SpacePara2', stateChange: true
					},
					{type: 'break'},
					{	// 增加段落間距
						id: 'paraspaceincrease', img: 'paraspaceincrease', text: _UNO('.uno:ParaspaceIncrease', docType, true),
						uno: '.uno:ParaspaceIncrease', stateChange: true
					},
					{	// 減少段落間距
						id: 'paraspacedecrease', img: 'paraspacedecrease', text: _UNO('.uno:ParaspaceDecrease', docType, true), uno: '.uno:ParaspaceDecrease',
						stateChange: true
					}
				],
				stateChange: '.uno:LineSpacing'
			},
			{	// 文字折行
				type: 'button', id: 'wraptext', img: 'wraptext', hint: _UNO('.uno:WrapText', docType, true), hidden: true,
				uno: '.uno:WrapText', disabled: true, stateChange: true
			},
			{type: 'break', id: 'breakspacing', hidden: true},
			{	// 編號清單
				type: 'button', id: 'defaultnumbering', img: 'numbering', hint: _UNO('.uno:DefaultNumbering', docType, true), hidden: true,
				uno: '.uno:DefaultNumbering', disabled: true, stateChange: true
			},
			{	// 項目符號清單
				type: 'button', id: 'defaultbullet', img: 'bullet', hint: _UNO('.uno:DefaultBullet', docType, true), hidden: true,
				uno: '.uno:DefaultBullet', disabled: true, stateChange: true
			},
			{type: 'break', id: 'breakbullet', hidden: true},
			{	// 擴大縮排
				type: 'button', id: 'incrementindent', img: 'incrementindent', hint: _UNO('.uno:IncrementIndent', docType, true),
				uno: '.uno:IncrementIndent', disabled: true, stateChange: true
			},
			{	// 減少縮排
				type: 'button', id: 'decrementindent', img: 'decrementindent', hint: _UNO('.uno:DecrementIndent', docType, true),
				uno: '.uno:DecrementIndent', disabled: true, stateChange: true
			},
			{type: 'break', id: 'breakindent', hidden: true},
			{	// calc 條件式
				type: 'drop', id: 'conditionalformaticonset', img: 'conditionalformatdialog', hint: _UNO('.uno:ConditionalFormatMenu', docType, true), hidden: true, html: window.getConditionalFormatMenuHtml(),
			},
			{	// calc 按升冪排序
				type: 'button', id: 'sortascending', img: 'sortascending', hint: _UNO('.uno:SortAscending', docType, true),
				uno: '.uno:SortAscending', disabled: true, hidden: true, stateChange: true
			},
			{	// calc 按降冪排序
				type: 'button', id: 'sortdescending', img: 'sortdescending', hint: _UNO('.uno:SortDescending', docType, true),
				uno: '.uno:SortDescending', disabled: true, hidden: true, stateChange: true
			},
			{type: 'break', id: 'breaksorting', hidden: true},
			{	// calc 貨幣
				type: 'button', id: 'numberformatcurrency', img: 'numberformatcurrency', hint: _UNO('.uno:NumberFormatCurrency', docType, true), hidden: true,
				uno: '.uno:NumberFormatCurrency', disabled: true, stateChange: true
			},
			{	// calc 百分比
				type: 'button', id: 'numberformatpercent', img: 'numberformatpercent', hint: _UNO('.uno:NumberFormatPercent', docType, true), hidden: true,
				uno: '.uno:NumberFormatPercent', disabled: true, stateChange: true
			},
			{	// calc 數字
				type: 'button', id: 'numberformatdecimal', img: 'numberformatdecimal', hint: _UNO('.uno:NumberFormatDecimal', docType, true),
				uno: '.uno:NumberFormatDecimal', hidden: true, disabled: true, stateChange: true
			},
			{	// calc 日期
				type: 'button', id: 'numberformatdate', img: 'numberformatdate', hint: _UNO('.uno:NumberFormatDate', docType, true),
				uno: '.uno:NumberFormatDate', hidden: true, disabled: true, stateChange: true
			},
			{	// calc 刪除小數點
				type: 'button', id: 'numberformatdecdecimals', img: 'numberformatdecdecimals', hint: _UNO('.uno:NumberFormatDecDecimals', docType, true), hidden: true,
				uno: '.uno:NumberFormatDecDecimals', disabled: true, stateChange: true
			},
			{	// calc 增加小數點
				type: 'button', id: 'numberformatincdecimals', img: 'numberformatincdecimals', hint: _UNO('.uno:NumberFormatIncDecimals', docType, true), hidden: true,
				uno: '.uno:NumberFormatIncDecimals', disabled: true, stateChange: true
			},
			{type: 'break',   id: 'break-number', hidden: true},
			{	// 插入表格
				type: 'drop', id: 'inserttable', img: 'inserttable', hint: _UNO('.uno:InsertTable', docType, true), hidden: true, overlay: {onShow: window.insertTable}, html: window.getInsertTablePopupHtml(),
				stateChange: '.uno:InsertTable'
			},
			{	// 插入圖片
				type: 'button', id: 'insertgraphic', img: 'insertgraphic', hint: _UNO('.uno:InsertGraphic', docType, true),
				uno: '.uno:InsertGraphic', stateChange: true
			},
			{	// 插入圖片選單
				type: 'menu', id: 'menugraphic', img: 'insertgraphic', hint: _UNO('.uno:InsertGraphic', docType, true), hidden: true,
				items: [
					{id: 'localgraphic', img: 'insertgraphic', text: _UNO('.uno:InsertGraphic', docType, true), uno: '.uno:InsertGraphic'},
					{id: 'remotegraphic', text: _('Remote image')},
				],
				stateChange: '.uno:InsertGraphic'
			},
			{	// 插入圖表
				type: 'button', id: 'insertobjectchart', img: 'insertobjectchart', hint: _UNO('.uno:InsertObjectChart', docType, true),
				uno: '.uno:InsertObjectChart', stateChange: true
			},
			{	// 插入圖案
				type: 'drop', id: 'insertshapes', img: 'basicshapes_ellipse', hint: _('Insert shapes'), overlay: {onShow: function() {window.insertShapes('insertshapes'); }}, html: window.getShapesPopupHtml(),
				stateChange: '.uno:BasicShapes'
			},
			{	// impress 轉場動畫
				type: 'drop', id: 'animationeffects', img: 'animationeffects', hint: _UNO('.uno:SlideChangeWindow', docType, true), overlay: {onShow: that.animationEffects.bind(that)}, html: window.getShapesPopupHtml(), hidden: true, disable: true,
				stateChange: '.uno:AnimationEffects'
			},
			{	// 插入連接點
				type: 'drop', id: 'insertconnectors', img: 'connectors_connector', hint: _('Insert connectors'), overlay: {onShow: function() {window.insertShapes('insertconnectors'); }}, html: window.getShapesPopupHtml(), hidden: true
			},
			{type: 'break',   id: 'breakinsert', desktop: true},
			{	// 插入註解
				type: 'button', id: 'insertannotation', img: 'annotation', hint: _UNO('.uno:InsertAnnotation', docType, true), hidden: true,
				uno: '.uno:InsertAnnotation', stateChange: true
			},
			{	// 超連結
				type: 'button', id: 'link', img: 'link', hint: _UNO('.uno:HyperlinkDialog', docType, true),
				uno: '.uno:HyperlinkDialog', disabled: true, stateChange: true
			},
			{	// 插入特殊字元
				type: 'button', id: 'insertsymbol', img: 'insertsymbol', hint: _UNO('.uno:InsertSymbol', docType, true),
				uno: '.uno:InsertSymbol', stateChange: true
			},
			{	// 文字由左至右
				type: 'button', id: 'textdirectionlefttoright', img: 'textdirectionlefttoright', hint: _UNO('.uno:TextdirectionLeftToRight', docType, true),
				uno: '.uno:TextdirectionLeftToRight', hidden:true, disabled:true, stateChange: true
			},
			{	// 文字從上到下（直書）
				type: 'button', id: 'textdirectiontoptobottom', img: 'textdirectiontoptobottom', hint: _UNO('.uno:TextdirectionTopToBottom', docType, true),
				uno: '.uno:TextdirectionTopToBottom', hidden:true, disabled:true, stateChange: true
			},
			{	// 插入文字方塊
				type: 'button', id: 'horizontaltext', img: 'horizontaltext', hint: _UNO('.uno:Text', docType, true),
				uno: '.uno:Text', hidden:true, disabled:true, mobile: false, stateChange: true
			},
			{	// 插入垂直文字方塊
				type: 'button', id: 'verticaltext', img: 'verticaltext', hint: _UNO('.uno:VerticalText', docType, true),
				uno: '.uno:VerticalText', hidden:true, disabled:true, mobile: false, stateChange: true
			},
			{type: 'spacer'},
			{type: 'break', id: 'breaksidebar', hidden: true},
			{type: 'button', id: 'edit', img: 'edit'},
			{	// 側邊攔
				type: 'button', id: 'sidebar', img: 'sidebar', hint: _UNO('.uno:Sidebar', docType, true),
				uno: '.uno:Sidebar', hidden: true, stateChange: true
			},
			{type: 'button', id: 'modifypage', img: 'sidebar_modify_page', hint: _UNO('.uno:ModifyPage', docType, true), uno: '.uno:ModifyPage', hidden: true},
			{type: 'button', id: 'slidechangewindow', img: 'sidebar_slide_change', hint: _UNO('.uno:SlideChangeWindow', docType, true), uno: '.uno:SlideChangeWindow', hidden: true},
			{type: 'button', id: 'customanimation', img: 'sidebar_custom_animation', hint: _UNO('.uno:CustomAnimation', docType, true), uno: '.uno:CustomAnimation', hidden: true},
			{type: 'button', id: 'masterslidespanel', img: 'sidebar_master_slides', hint: _UNO('.uno:MasterSlidesPanel', docType, true), uno: '.uno:MasterSlidesPanel', hidden: true},
			{	// 顯示或折疊 menubar
				type: 'button', id: 'fold', img: 'fold', desktop: true, mobile: false, hidden: true,
				onClick: function() {
					that.map.uiManager.toggleMenubar();
				}
			},
			{	// 平板模式切換選單切換與否的按鈕
				type: 'button', id: 'hamburger-tablet', img: 'hamburger', desktop: false, mobile: false, tablet: true, iosapptablet: false, hidden: true,
				onClick: function() {
					that.map.uiManager.toggleMenubar();
				}
			},
		];
	},

	// 在切換傳統界面或 notebook 界面才會執行
	updateControlsState: function() {
		if (this.map.stateChangeHandler) {
			this.map.stateChangeHandler.refreshAllCallbacks();
		}
	},

	create: function() {
		$().w2destroy('editbar');
		var that = this;
		var toolbar = L.DomUtil.get('toolbar-up');
		// In case it contains garbage
		if (toolbar)
			toolbar.remove();
		// Use original template as provided by server
		$('#toolbar-logo').after(this.map.toolbarUpTemplate.cloneNode(true));
		toolbar = $('#toolbar-up');
		this._bar = toolbar.w2toolbar({
			name: 'editbar',
			items: this.getToolItems(),
			onClick: function(e) {
				// 被點擊的選項
				var clickedItem = (e.subItem ? e.subItem : e.item);
				// item 沒有自己的 onClick 事件，才執行系統的 onClick 事件
				if (typeof(clickedItem.onClick) !== 'function') {
					// 該選項有指定 uno 指令
					if (clickedItem.uno) {
						that.map.executeAllowedCommand(clickedItem.uno);
					// 該選項是單一選項
					} else if (clickedItem.items === undefined) {
						switch (clickedItem.id) {
						case 'remotegraphic':
							that.map.fire('postMessage', {msgId: 'UI_InsertGraphic'});
							break;
						default:
							window.app.console.debug('Warning! item id "%s" not implemented.', clickedItem.id);
						}
					}
				}
				window.hideTooltip(this, e.target);
			}
		});
		this.map.uiManager.enableTooltip(toolbar);

		toolbar.bind('touchstart', function() {
			this._bar.touchStarted = true;
		});

		this.map.setupStateChangesForToolbar({toolbar: this._bar});
		this.map.createFontSelector('#fonts-select');
		this._bar.resize();
	},

	onDocLayerInit: function() {
		var docType = this.map.getDocType();

		if (!window.app.dontUseSidebar) {
			this._bar.show('breaksidebar', 'sidebar');
			if (docType === 'presentation') {
				this._bar.show('modifypage', 'slidechangewindow', 'customanimation', 'masterslidespanel');
			}
		}

		switch (docType) {
		case 'spreadsheet':
			if (this._bar) {
				this._bar.show('reset', 'textalign', 'wraptext', 'breakspacing', 'insertannotation', 'conditionalformaticonset',
					'numberformatcurrency', 'numberformatpercent', 'numberformatdecimal', 'numberformatdate',
					'numberformatincdecimals', 'numberformatdecdecimals', 'break-number', 'togglemergecells', 'breakmergecells',
					'textdirectionlefttoright', 'textdirectiontoptobottom',
					'setborderstyle', 'sortascending', 'sortdescending', 'breaksorting', 'backgroundcolor');
				this._bar.remove('styles');
			}

			$('#toolbar-wrapper').addClass('spreadsheet');
			if (window.mode.isTablet()) {
				$(this.map.options.documentContainer).addClass('tablet');
				$('#toolbar-wrapper').addClass('tablet');
			}

			break;
		case 'text':
			if (this._bar)
				this._bar.show('reset', 'leftpara', 'centerpara', 'rightpara', 'justifypara', 'breakpara', 'linespacing',
					'breakspacing', 'defaultbullet', 'defaultnumbering', 'breakbullet',/*  'incrementindent', 'decrementindent',
					'breakindent', */ 'inserttable', 'insertannotation', 'backcolor');

			break;
		case 'presentation':
			if (this._bar) {
				this._bar.show('resetimpress',
					'leftpara', 'centerpara', 'rightpara', 'justifypara', 'breakpara', 'linespacing',
					'animationeffects', 'insertconnectors', 'horizontaltext', 'verticaltext', 'assignlayoutbreak', 'assignlayout',
					'breakspacing', 'defaultbullet', 'defaultnumbering', 'breakbullet', 'inserttable',  'insertannotation', 'backcolor');
				this._bar.remove('styles');
			}
			break;
		case 'drawing':
			if (this._bar) {
				this._bar.show('leftpara', 'centerpara', 'rightpara', 'justifypara', 'breakpara', 'linespacing',
					'breakspacing', 'defaultbullet', 'defaultnumbering', 'breakbullet', 'inserttable', 'backcolor',
					'horizontaltext', 'verticaltext', 'insertconnectors');
				this._bar.remove('styles');
			}
			break;
		}

		window.updateVisibilityForToolbar(this._bar);

		if (this._bar)
			this._bar.refresh();

		this.map.createFontSizeSelector('#fontsizes-select');
	},

	onUpdatePermission: function(e) {
		if (e.perm === 'edit') {
			L.DomUtil.removeClass(L.DomUtil.get('toolbar-wrapper'), 'readonly');
		} else {
			L.DomUtil.addClass(L.DomUtil.get('toolbar-wrapper'), 'readonly');
		}
	},

	onWopiProps: function(e) {
		if (e.HideSaveOption) {
			this._bar.hide('save');
		}
		if (e.HidePrintOption) {
			this._bar.hide('print');
		}

		// On desktop we only have Save and Print buttons before the first
		// splitter/break. Hide the splitter if we hid both save and print.
		// TODO: Apply the same logic to mobile/tablet to avoid beginning with a splitter.
		if (window.mode.isDesktop() && e.HideSaveOption && e.HidePrintOption) {
			this._bar.hide('savebreak');
		}

		if (e.EnableInsertRemoteImage === true && this._bar) {
			this._bar.hide('insertgraphic');
			this._bar.show('menugraphic');
		}
	},

	updateCommandValues: function(e) {
		var data = [];
		var commandValues;
		// 1) For .uno:StyleApply
		// we need an empty option for the place holder to work
		if (e.commandName === '.uno:StyleApply') {
			var styles = [];
			var topStyles = [];
			commandValues = this.map.getToolbarCommandValues(e.commandName);
			if (typeof commandValues === 'undefined')
				return;
			var commands = commandValues.Commands;
			if (commands && commands.length > 0) {

				commands.forEach(function (command) {
					var translated = command.text;
					if (L.Styles.styleMappings[command.text]) {
						// if it's in English, translate it
						translated = L.Styles.styleMappings[command.text].toLocaleString();
					}
					data = data.concat({id: command.id, text: translated });
				}, this);
			}

			if (this.map.getDocType() === 'text') {
				styles = commandValues.ParagraphStyles.slice(7);
				topStyles = commandValues.ParagraphStyles.slice(0, 7);
			}
			else if (this.map.getDocType() === 'spreadsheet') {
				styles = commandValues.CellStyles;
			}
			else if (this.map.getDocType() === 'presentation') {
				// styles are not applied for presentation
				return;
			}

			if (topStyles.length > 0) {
				// Inserts a separator element
				data = data.concat({text: '\u2500\u2500\u2500\u2500\u2500\u2500', disabled: true});

				topStyles.forEach(function (style) {
					data = data.concat({id: style, text: L.Styles.styleMappings[style].toLocaleString()});
				}, this);
			}

			if (styles !== undefined && styles.length > 0) {
				// Inserts a separator element
				data = data.concat({text: '\u2500\u2500\u2500\u2500\u2500\u2500', disabled: true});

				styles.forEach(function (style) {
					var localeStyle;
					if (style.startsWith('outline')) {
						var outlineLevel = style.split('outline')[1];
						localeStyle = 'Outline'.toLocaleString() + ' ' + outlineLevel;
					} else {
						localeStyle = L.Styles.styleMappings[style];
						localeStyle = localeStyle === undefined ? style : localeStyle.toLocaleString();
					}

					data = data.concat({id: style, text: localeStyle});
				}, this);
			}

			$('#styles-select').select2({
				data: data,
				placeholder: _('Style')
			});
			$('#styles-select').val(this.options.stylesSelectValue).trigger('change');
			$('#styles-select').on('select2:select', this.onStyleSelect.bind(this));
		}

		if (this._bar)
			this._bar.resize();
	},

	/**
	 * 設定顏色指示器
	 * @param {string} id - toolbar item id
	 * @param {string} color -
	 */
	_setColorIndicator: function(toolbar, item) {
		var itemImg = document.querySelector('#tb_' + toolbar.name + '_item_' + item.id + ' .w2ui-tb-image');
		if (itemImg) {
			var color = (item.color !== '' ? '#' + item.color : '');
			//$(itemImg).css('box-shadow', 'inset 0 -2px #ffffff, inset 0px -6px ' + color);

			// 有沒有顏色指示器
			var indicator = itemImg.querySelector('.colorIndicator');
			if (indicator === null) { // 沒有就建立一個
				indicator = L.DomUtil.create('div', 'colorIndicator', itemImg);
			}
			// 設定高度為5的方塊，對齊圖片底端
			$(indicator).css({
				'pointer-events': 'none', // 不反應滑鼠事件
				'height': '5px',
				'position': 'relative',
				'width': itemImg.offsetWidth + 'px',
				'top': (itemImg.offsetHeight - 5) + 'px',
				'left': '0px',
				'border': (color === '' ? '1px solid #000' : '0px'),
				'background-color': (color === '' ? '#fff' : color)
			});
		}
	},

	animationEffects: function() {
		var width = 5;
		var $grid = $('.insertshape-grid');

		if ($grid.children().length > 0)
			return;

		$grid.css('min-width', '0px');

		var collection = {
			'Slide Transition': [
				{img: 'transition-none', label: _('None'), action: {type:0, subtype: 0}}, // 無
				{img: 'transition-wipe', label: _('Wipe'), action: {type:1, subtype: 2}}, // 擦去
				{img: 'transition-wheel', label: _('Wheel'), action: {type:23, subtype: 107}}, // 滾輪
				{img: 'transition-uncover', label: _('Uncover'), action: {type:36, subtype: 98}}, // 抽出
				{img: 'transition-random-bars', label: _('Bars'), action: {type:38, subtype: 13}}, // 條碼
				{img: 'transition-checkerboard', label: _('Checkers'), action: {type:39, subtype: 19}}, // 棋盤
				{img: 'transition-shape', label: _('Shape'), action: {type:3, subtype: 12}}, // 形狀
				{img: 'transition-box', label: _('Box'), action: {type:12, subtype: 25}}, // 方塊
				{img: 'transition-wedge', label: _('Wedge'), action: {type:25, subtype: 48}}, // 楔入
				//{img: 'transition-venetian-blinds', label: _('Venetian Blinds'), action: {type:41, subtype: 13}}, // 百葉窗
				{img: 'transition-fade', label: _('Fade'), action: {type:37, subtype: 104}}, // 淡化
				//{img: 'transition-cut', label: _('Cut'), action: {type:1, subtype: 104}}, // 剪下
				{img: 'transition-cover', label: _('Cover'), action: {type:36, subtype: 98}}, // 覆蓋
				{img: 'transition-dissolve', label: _('Dissolve'), action: {type:40, subtype: 0}}, // 溶解
				//{img: 'transition-random', label: _('Random'), action: {type:42, subtype: 0}}, // 隨機
				//{img: 'transition-comb', label: _('Comb'), action: {type:35, subtype: 110}}, // 梳紋
				{img: 'transition-push', label: _('Push'), action: {type:35, subtype: 98}}, // 推展
				{img: 'transition-split', label: _('Split'), action: {type:4, subtype: 14}}, // 分割
				{img: 'transition-diagonal-squares', label: _('Diagonal'), action: {type:34, subtype: 96}}, // 對角
				//{img: 'transition-tile-flip', label: _('Tiles'), action: {type:21, subtype: 108}}, // 拼貼
				// {img: 'transition-cube-turning', label: _('Cube'), action: {type:21, subtype:12}}, // 立方體
				// {img: 'transition-revolving-circles', label: _('Circles'), action: {type:21, subtype: 27}}, // 圓形
				// {img: 'transition-turning-helix', label: _('Helix'), action: {type:21, subtype: 55}}, // 螺旋
				// {img: 'transition-fall', label: _('Fall'), action: {type:21, subtype: 1}}, // 向下落
				// {img: 'transition-turn-around', label: _('Turn Around'), action: {type:21, subtype: 2}}, // 左右翻轉
				// {img: 'transition-iris', label: _('Iris'), action: {type:21, subtype: 3}}, // 光圈
				// {img: 'transition-turn-down', label: _('Turn Down'), action: {type:21, subtype: 4}}, // 向下轉
				// {img: 'transition-rochade', label: _('Rochade'), action: {type:21, subtype: 5}}, // 左右置換
				// {img: 'transition-venetian-blinds-3d', label: _('3D Denetian'), action: {type:21, subtype: 6}}, // 3D 百葉窗
				// {img: 'transition-static', label: _('Static'), action: {type:21, subtype: 8}}, // 靜態
				// {img: 'transition-finedissolve', label: _('Fine Dissolve'), action: {type:21, subtype: 9}}, // 細緻溶解
				// {img: 'transition-vortex', label: _('Vortex'), action: {type:21, subtype: 13}}, // 漩渦
				// {img: 'transition-ripple', label: _('Ripple'), action: {type:21, subtype: 14}}, // 漣漪
				// {img: 'transition-glitter', label: _('Glitter'), action: {type:21, subtype: 26}}, // 閃耀
				// {img: 'transition-honeycomb', label: _('Honeycomb'), action: {type:21, subtype: 31}}, // 蜂巢
				// {img: 'transition-newsflash', label: _('Newsflash'), action: {type:43, subtype: 114}} // 新聞快報
			]
		};

		for (var s in collection) {
			var $rowHeader = $('<div/>').addClass('row-header oxool-font').append(_(s));
			$grid.append($rowHeader);

			var rows = Math.ceil(collection[s].length / width);
			var idx = 0;
			for (var r = 0; r < rows; r++) {
				var $row = $('<div/>').addClass('row');
				$grid.append($row);
				for (var c = 0; c < width; c++) {
					if (idx >= collection[s].length) {
						break;
					}
					var shape = collection[s][idx++];
					var $col = $('<div/>').addClass('col w2ui-icon');
					var unocmd = 'res:' + shape.img;
					var iconURL = 'url("' + this._map.getIconURL(unocmd) + '")';
					$col.css('background', iconURL + ' no-repeat center')
						.attr('title', shape.label)
						.data('action', shape.action);
					$row.append($col);
				}

				if (idx >= collection[s].length)
					break;
			}
		}

		$grid.on({
			click: function(e) {
				var action = $(e.target).data().action;
				if (action) {
					var macro = 'macro:///OxOOL.Impress.SetTransition(' + action.type + ',' + action.subtype + ')';
					this._map.sendUnoCommand(macro);
					this._map.getDocumentStatus();
					if ($('#w2ui-overlay-editbar').length > 0) {
						$('#w2ui-overlay-editbar').removeData('keepOpen')[0].hide();
					}
					this._map.focus();
				}
			}.bind(this)
		});
	},

	/**
	 * 投影片版面配置
	 */
	 assignLayout: function() {
		var width = 4;
		var $grid = $('.insertshape-grid');

		if ($grid.children().length > 0)
			return;

		$grid.css('min-width', '0px');

		var collection = {
			'Horizontal': [
				{'uno': '.uno:AssignLayout?WhatLayout:long=20', id: '20'},
				{'uno': '.uno:AssignLayout?WhatLayout:long=19', id: '19'},
				{'uno': '.uno:AssignLayout?WhatLayout:long=0', id: '0'},
				{'uno': '.uno:AssignLayout?WhatLayout:long=1', id: '1'},
				{'uno': '.uno:AssignLayout?WhatLayout:long=32', id: '32'},
				{'uno': '.uno:AssignLayout?WhatLayout:long=3', id: '3'},
				{'uno': '.uno:AssignLayout?WhatLayout:long=12', id: '12'},
				{'uno': '.uno:AssignLayout?WhatLayout:long=15', id: '15'},
				{'uno': '.uno:AssignLayout?WhatLayout:long=14', id: '14'},
				{'uno': '.uno:AssignLayout?WhatLayout:long=16', id: '16'},
				{'uno': '.uno:AssignLayout?WhatLayout:long=18', id: '18'},
				{'uno': '.uno:AssignLayout?WhatLayout:long=34', id: '34'}
			],
			'Vertical': [
				{'uno': '.uno:AssignLayout?WhatLayout:long=28', id: '28'},
				{'uno': '.uno:AssignLayout?WhatLayout:long=27', id: '27'},
				{'uno': '.uno:AssignLayout?WhatLayout:long=29', id: '29'},
				{'uno': '.uno:AssignLayout?WhatLayout:long=30', id: '30'}
			]
		};

		// 取得目前的 layout ID
		var layoutId = this.map.stateChangeHandler.getItemProperty('.uno:AssignLayout').value();

		for (var s in collection) {
			var $rowHeader = $('<div/>').addClass('row-header oxool-font').append(_(s));
			$grid.append($rowHeader);

			var rows = Math.ceil(collection[s].length / width);
			var idx = 0;
			for (var r = 0; r < rows; r++) {
				var $row = $('<div/>').addClass('row');
				$grid.append($row);
				for (var c = 0; c < width; c++) {
					if (idx >= collection[s].length) {
						break;
					}
					var shape = collection[s][idx++];
					var $col = $('<div/>').addClass('col w2ui-icon');
					var iconURL = 'url("' + this._map.getIconURL(shape.uno) + '")';
					$col.css({
						'background': iconURL,
						'background-size': 'contain',
						'width': '44px',
						'height': '35px'
					}).attr('title', _UNO(shape.uno, 'presentation')).data('uno', shape.uno);
					if (shape.id === layoutId) {
						$col.css('border', '1px solid #ff0000');
					}
					$row.append($col);
				}

				if (idx >= collection[s].length)
					break;
			}
		}

		var $resetButton = $('<div/>').addClass('row-header oxool-font').append(_('Reset slide layout'));
		$resetButton.css({
			'font-size': '14px !important',
			'background': '#fff',
			'padding': '4px',
			'border': '1px solid #808080',
			'height': '32px',
			'cursor': 'pointer'
		}).data('uno', '.uno:AssignLayout');
		$grid.append($resetButton);

		$grid.on({
			click: function(e) {
				var uno = $(e.target).data().uno;
				if (uno) {
					this._map.sendUnoCommand(uno);
					if ($('#w2ui-overlay-editbar').length > 0) {
						$('#w2ui-overlay-editbar').removeData('keepOpen')[0].hide();
					}
					this._map.focus();
				}
			}.bind(this)
		});
	}
});

L.control.topToolbar = function () {
	return new L.Control.TopToolbar();
};
