/* -*- js-indent-level: 8 -*- */
/*
* Control.Menubar
*/

/* global $ _ _UNO vex revHistoryEnabled closebutton */
L.Control.Menubar = L.Control.extend({
	// TODO: Some mechanism to stop the need to copy duplicate menus (eg. Help)
	options: {
		text:  [
			{name: '.uno:PickList', id: 'file', type: 'menu', menu: [
				{name: '.uno:Save', id: 'save', hotkey: 'Ctrl+S', type: 'action'},
				{name: '.uno:SaveAs', id: 'saveas', type: 'action'},
				{name: _('Share...'), id:'shareas', type: 'action', icon: '.uno:ShareDocument'},
				{name: '.uno:Print', id: 'print', type: 'action', hotkey: 'Ctrl+P'},
				{name: _('See revision history'), id: 'rev-history', type: 'action'},
				{name: _('Download as'), id: 'downloadas', type: 'menu', menu: [
					{name: _('PDF Document (.pdf)'), id: 'downloadas-pdf', type: 'action'},
					{name: _('TEXT Document (.txt)'), id: 'downloadas-txt', type: 'action'},
					{name: _('HTML Document (.html)'), id: 'downloadas-html', type: 'action'},
					{name: _('ODF text document (.odt)'), id: 'downloadas-odt', type: 'action'},
					{name: _('Word 2003 Document (.doc)'), id: 'downloadas-doc', type: 'action'},
					{name: _('Word Document (.docx)'), id: 'downloadas-docx', type: 'action'},
					{name: _('Rich Text (.rtf)'), id: 'downloadas-rtf', type: 'action'}]},
				{name: _('Sign document'), id: 'signdocument', type: 'action'},
				{type: '--'},
				{name: '.uno:CloseDoc', id: 'closedocument', type: 'action'}
			]},
			{name: '.uno:EditMenu', id: 'Edit', type: 'menu', menu: [
				{uno: '.uno:Undo', hotkey: 'Ctrl+Z'},
				{uno: '.uno:Redo', hotkey: 'Ctrl+Y'},
				{name: _('Repair'), id: 'repair',  type: 'action'},
				{type: '--'},
				{uno: '.uno:Cut', hotkey: 'Ctrl+X'},
				{uno: '.uno:Copy', hotkey: 'Ctrl+C'},
				{uno: '.uno:Paste', hotkey: 'Ctrl+V'},
				{uno: '.uno:SelectAll', hotkey: 'Ctrl+A'},
				{type: '--'},
				{uno: '.uno:SearchDialog', hotkey: 'Ctrl+H'},
				{type: '--'},
				{name: '.uno:ChangesMenu', id: 'changesmenu', type: 'menu', menu: [
					{uno: '.uno:TrackChanges'},
					{uno: '.uno:ShowTrackedChanges'},
					{type: '--'},
					{uno: '.uno:AcceptTrackedChanges'},
					{uno: '.uno:AcceptAllTrackedChanges'},
					{uno: '.uno:RejectAllTrackedChanges'},
					{uno: '.uno:PreviousTrackedChange'},
					{uno: '.uno:NextTrackedChange'}
				]}
			]},
			{name: '.uno:ViewMenu', id: 'view', type: 'menu', menu: [
				{name: '.uno:FullScreen', id: 'fullscreen', type: 'action'},
				{type: '--'},
				{name: '.uno:ZoomPlus', id: 'zoomin', type: 'action'},
				{name: '.uno:ZoomMinus', id: 'zoomout', type: 'action'},
				{name: '.uno:Zoom100Percent', id: 'zoomreset', type: 'action'},
				{type: '--'},
				{uno: '.uno:ControlCodes', hotkey: 'Ctrl+F10'}
			]
			},
			{name: '.uno:InsertMenu', id: 'insert', type: 'menu', menu: [
				{name: _('Local Image...'), id: 'insertgraphic', type: 'action'},
				{name: '.uno:InsertGraphic', id: 'insertgraphicremote', type: 'action'},
				{name: '.uno:InsertAnnotation', id: 'insertcomment', type: 'action', hotkey: 'Ctrl+Alt+C'},
				{uno: '.uno:DrawText'},
				{uno: '.uno:InsertObjectChart'},
				{type: '--'},
				{name: '.uno:InsertField', type: 'menu', menu: [
					{uno: '.uno:InsertPageNumberField'},
					{uno: '.uno:InsertPageCountField'},
					{uno: '.uno:InsertDateField'},
					{uno: '.uno:InsertTimeField'},
					{uno: '.uno:InsertTitleField'},
					{uno: '.uno:InsertAuthorField'},
					{uno: '.uno:InsertTopicField'}
				]},
				{name: '.uno:InsertHeaderFooterMenu', type: 'menu', menu: [
					{name: '.uno:InsertPageHeader', type: 'menu', menu: [
						{name: _('All'), disabled: true, id: 'insertheader', tag: '_ALL_', uno: '.uno:InsertPageHeader?'}]},
					{name: '.uno:InsertPageFooter', type: 'menu', menu: [
						{name: _('All'), disabled: true, id: 'insertfooter', tag: '_ALL_', uno: '.uno:InsertPageFooter?'}]}
				]},
				{uno: '.uno:InsertFootnote', hotkey: 'Ctrl+Alt+F'},
				{uno: '.uno:InsertEndnote', hotkey: 'Ctrl+Alt+D'},
				{type: '--'},
				{uno: '.uno:InsertPagebreak', hotkey: 'Ctrl+Enter'},
				{uno: '.uno:InsertColumnBreak', hotkey: 'Ctrl+Shift+Enter'},
				{type: '--'},
				{uno: '.uno:HyperlinkDialog', hotkey: 'Ctrl+K'},
				{uno: '.uno:InsertBookmark'},
				{uno: '.uno:InsertSymbol'},
				{name: _('Horizontal Line'), uno: '.uno:HorizontalLine'},
				{name: '.uno:FormattingMarkMenu', type: 'menu', menu: [
					{uno: '.uno:InsertNonBreakingSpace'},
					{uno: '.uno:InsertHardHyphen'},
					{uno: '.uno:InsertSoftHyphen'},
					{uno: '.uno:InsertZWSP'},
					{uno: '.uno:InsertZWNBSP'},
					{uno: '.uno:InsertLRM'},
					{uno: '.uno:InsertRLM'}]},
				{name: '.uno:IndexesMenu', type: 'menu', menu: [
					{uno: '.uno:InsertIndexesEntry'},
					{uno: '.uno:InsertAuthoritiesEntry'},
					{uno: '.uno:InsertMultiIndex'}]},
			]},
			{name: '.uno:FormatMenu', type: 'menu', menu: [
				{name: '.uno:FormatTextMenu', type: 'menu', menu: [
					{uno: '.uno:Bold', hotkey: 'Ctrl+B'},
					{uno: '.uno:Italic', hotkey: 'Ctrl+I'},
					{uno: '.uno:Underline', hotkey: 'Ctrl+U'},
					{uno: '.uno:UnderlineDouble', hotkey: 'Ctrl+D'},
					{uno: '.uno:Strikeout', hotkey: 'Ctrl+Alt+5'},
					{uno: '.uno:Overline'},
					{type: '--'},
					{uno: '.uno:SuperScript', hotkey: 'Ctrl+Shift+P'},
					{uno: '.uno:SubScript', hotkey: 'Ctrl+Shift+B'},
					{uno: '.uno:SmallCaps'},
					{type: '--'},
					{uno: '.uno:Shadowed'},
					{uno: '.uno:OutlineFont'},
					{type: '--'},
					{uno: '.uno:Grow'},
					{uno: '.uno:Shrink'},
					{type: '--'},
					{uno: '.uno:ChangeCaseToUpper'},
					{uno: '.uno:ChangeCaseToLower'},
					{uno: '.uno:ChangeCaseRotateCase'},
					{type: '--'},
					{uno: '.uno:ChangeCaseToSentenceCase'},
					{uno: '.uno:ChangeCaseToTitleCase'},
					{uno: '.uno:ChangeCaseToToggleCase'}]},
				{name: '.uno:FormatSpacingMenu', type: 'menu', menu: [
					{uno: '.uno:SpacePara1'},
					{uno: '.uno:SpacePara15'},
					{uno: '.uno:SpacePara2'},
					{type: '--'},
					{uno: '.uno:ParaspaceIncrease'},
					{uno: '.uno:ParaspaceDecrease'},
					{type: '--'},
					{uno: '.uno:IncrementIndent'},
					{uno: '.uno:DecrementIndent'}]},
				{name: '.uno:TextAlign', type: 'menu', menu: [
					{uno: '.uno:CommonAlignLeft', hotkey: 'Ctrl+L'},
					{uno: '.uno:CommonAlignHorizontalCenter', hotkey: 'Ctrl+E'},
					{uno: '.uno:CommonAlignRight', hotkey: 'Ctrl+R'},
					{uno: '.uno:CommonAlignJustified', hotkey: 'Ctrl+J'},
					{type: '--'},
					{uno: '.uno:CommonAlignTop'},
					{uno: '.uno:CommonAlignVerticalCenter'},
					{uno: '.uno:CommonAlignBottom'}]},
				{name: '.uno:FormatBulletsMenu', type: 'menu', menu: [
					{uno: '.uno:DefaultBullet'},
					{uno: '.uno:DefaultNumbering'},
					{type: '--'},
					{uno: '.uno:DecrementLevel'},
					{uno: '.uno:IncrementLevel'},
					{uno: '.uno:DecrementSubLevels'},
					{uno: '.uno:IncrementSubLevels'},
					{type: '--'},
					{uno: '.uno:MoveDown'},
					{uno: '.uno:MoveUp'},
					{uno: '.uno:MoveDownSubItems'},
					{uno: '.uno:MoveUpSubItems'},
					{type: '--'},
					{uno: '.uno:InsertNeutralParagraph'},
					{uno: '.uno:NumberingStart'},
					{type: '--'},
					{uno: '.uno:JumpDownThisLevel'},
					{uno: '.uno:JumpUpThisLevel'},
					{uno: '.uno:ContinueNumbering'}]},
				{type: '--'},
				{uno: '.uno:FontDialog'},
				{uno: '.uno:ParagraphDialog'},
				{uno: '.uno:OutlineBullet'},
				{uno: '.uno:PageDialog'},
				{type: '--'},
				{uno: '.uno:TransformDialog'},
				{uno: '.uno:FormatLine'},
				{uno: '.uno:FormatArea'},
				{uno: '.uno:GroupMenu', type: 'menu', menu: [
					{uno: '.uno:FormatGroup', hotkey: 'Ctrl+Shift+G'},
					{uno: '.uno:FormatUngroup'},
					{uno: '.uno:EnterGroup'},
					{uno: '.uno:LeaveGroup'}
				]},
				{type: '--'},
				{uno: '.uno:FormatColumns'},
				{type: '--'},
				{uno: '.uno:FormatPaintbrush'},
				{uno: '.uno:ResetAttributes', hotkey: 'Ctrl+M'}
			]},
			{name: '.uno:TableMenu', type: 'menu', menu: [
				{name: '.uno:TableInsertMenu', type: 'menu', menu: [
					{uno: '.uno:InsertRowsBefore'},
					{uno: '.uno:InsertRowsAfter'},
					{type: '--'},
					{uno: '.uno:InsertColumnsBefore'},
					{uno: '.uno:InsertColumnsAfter'}]},
				{name: '.uno:TableDeleteMenu', type: 'menu', menu: [
					{uno: '.uno:DeleteRows'},
					{uno: '.uno:DeleteColumns'},
					{uno: '.uno:DeleteTable'}]},
				{name: '.uno:TableSelectMenu', type: 'menu', menu: [
					{uno: '.uno:SelectTable'},
					{uno: '.uno:EntireRow'},
					{uno: '.uno:EntireColumn'},
					{uno: '.uno:EntireCell'}]},
				{uno: '.uno:MergeCells'},
				{type: '--'},
				{uno: '.uno:TableDialog'}
			]},
			{name: '.uno:ToolsMenu', id: 'tools', type: 'menu', menu: [
				{uno: '.uno:SpellingAndGrammarDialog'},
				{uno: '.uno:SpellOnline'},
				{name: '.uno:LanguageMenu', type: 'menu', menu: [
					{name: '.uno:SetLanguageSelectionMenu', type: 'menu', menu: [
						{name: _('None (Do not check spelling)'), id: 'noneselection', uno: '.uno:LanguageStatus?Language:string=Current_LANGUAGE_NONE'}]},
					{name: '.uno:SetLanguageParagraphMenu', type: 'menu', menu: [
						{name: _('None (Do not check spelling)'), id: 'noneparagraph', uno: '.uno:LanguageStatus?Language:string=Paragraph_LANGUAGE_NONE'}]},
					{name: '.uno:SetLanguageAllTextMenu', type: 'menu', menu: [
						{name: _('None (Do not check spelling)'), id: 'nonelanguage', uno: '.uno:LanguageStatus?Language:string=Default_LANGUAGE_NONE'}]}
				]},
				{uno: '.uno:WordCountDialog'},
				{type: '--'},
				{name: '.uno:AutoFormatMenu', type: 'menu', menu: [
					{uno: '.uno:OnlineAutoFormat'}]},
			]},
			{name: '.uno:HelpMenu', id: 'help', type: 'menu', menu: [
				{name: _('Keyboard shortcuts'), id: 'keyboard-shortcuts', type: 'action', icon: '.uno:HelpIndex', hotkey: 'Ctel+Shift+?'},
				{name: _('About'), id: 'about', type: 'action', icon: '.uno:About'}]
			}
		],

		presentation: [
			{name: '.uno:PickList', id: 'file', type: 'menu', menu: [
				{name: '.uno:Save', id: 'save', type: 'action', hotkey: 'Ctrl+S'},
				{name: '.uno:SaveAs', id: 'saveas', type: 'action'},
				{name: _('Share...'), id:'shareas', type: 'action', icon: '.uno:ShareDocument'},
				{name: '.uno:Print', id: 'print', type: 'action', hotkey: 'Ctrl+P'},
				{name: _('See revision history'), id: 'rev-history', type: 'action'},
				{name: _('Download as'), id: 'downloadas', type: 'menu', menu: [
					{name: _('PDF Document (.pdf)'), id: 'downloadas-pdf', type: 'action'},
					{name: _('HTML Document (.html)'), id: 'downloadas-html', type: 'action'},
					{name: _('ODF presentation (.odp)'), id: 'downloadas-odp', type: 'action'},
					{name: _('PowerPoint 2003 Presentation (.ppt)'), id: 'downloadas-ppt', type: 'action'},
					{name: _('PowerPoint Presentation (.pptx)'), id: 'downloadas-pptx', type: 'action'}]},
				{type: '--'},
				{name: '.uno:CloseDoc', id: 'closedocument', type: 'action'}
			]},
			{name: '.uno:EditMenu', type: 'menu', menu: [
				{uno: '.uno:Undo', hotkey: 'Ctrl+Z'},
				{uno: '.uno:Redo', hotkey: 'Ctrl+Y'},
				{name: _('Repair'), id: 'repair',  type: 'action'},
				{type: '--'},
				{uno: '.uno:Cut', hotkey: 'Ctrl+X'},
				{uno: '.uno:Copy', hotkey: 'Ctrl+C'},
				{uno: '.uno:Paste', hotkey: 'Ctrl+V'},
				{uno: '.uno:SelectAll', hotkey: 'Ctrl+A'},
				{type: '--'},
				{uno: '.uno:SearchDialog', hotkey: 'Ctrl+H'}
			]},
			{name: '.uno:ViewMenu', id: 'view', type: 'menu', menu: [
				{name: '.uno:FullScreen', id: 'fullscreen', type: 'action'},
				{type: '--'},
				{name: '.uno:ZoomPlus', id: 'zoomin', type: 'action'},
				{name: '.uno:ZoomMinus', id: 'zoomout', type: 'action'},
				{name: '.uno:Zoom100Percent', id: 'zoomreset', type: 'action'}]
			},
			{name: '.uno:InsertMenu', type: 'menu', menu: [
				{name: _('Local Image...'), id: 'insertgraphic', type: 'action'},
				{name: '.uno:InsertGraphic', id: 'insertgraphicremote', type: 'action'},
				{name: '.uno:InsertAnnotation', id: 'insertcomment', type: 'action', hotkey: 'Ctrl+Alt+C'},
				{uno: '.uno:Text'},
				{uno: '.uno:InsertObjectChart'},
				{type: '--'},
				{uno: '.uno:HyperlinkDialog', hotkey: 'Ctrl+K'},
				{type: '--'},
				{uno: '.uno:InsertSymbol'},
				{type: '--'},
				{uno: '.uno:HeaderAndFooter'}]
			},
			{name: '.uno:FormatMenu', type: 'menu', menu: [
				{uno: '.uno:FontDialog'},
				{uno: '.uno:ParagraphDialog'},
				{uno: '.uno:PageSetup'},
				{type: '--'},
				{uno: '.uno:TransformDialog'},
				{uno: '.uno:FormatLine'},
				{uno: '.uno:FormatArea'},
				{type: '--'},
				{uno: '.uno:OutlineBullet'},
				{type: '--'},
				{uno: '.uno:GroupMenu', type: 'menu', menu: [
					{uno: '.uno:FormatGroup', hotkey: 'Ctrl+Shift+G'},
					{uno: '.uno:FormatUngroup'},
					{uno: '.uno:EnterGroup'},
					{uno: '.uno:LeaveGroup'}
				]}]
			},
			{uno: '.uno:TableMenu', type: 'menu', menu: [
				{uno: '.uno:TableInsertMenu', type: 'menu', menu: [
					{uno: '.uno:InsertRowsBefore'},
					{uno: '.uno:InsertRowsAfter'},
					{type: '--'},
					{uno: '.uno:InsertColumnsBefore'},
					{uno: '.uno:InsertColumnsAfter'}]},
				{uno: '.uno:TableDeleteMenu', type: 'menu', menu: [
					{uno: '.uno:DeleteRows'},
					{uno: '.uno:DeleteColumns'}]},
				{uno: '.uno:MergeCells'}]
			},
			{name: '.uno:SlideMenu', type: 'menu', menu: [
				{name: '.uno:InsertSlide', id: 'insertpage',type: 'action'},
				{name: '.uno:DuplicateSlide', id: 'duplicatepage', type: 'action'},
				{name: '.uno:DeleteSlide', id: 'deletepage', type: 'action'},
				{type: '--', id: 'fullscreen-presentation-separator'},
				{name: _('Fullscreen presentation'), id: 'fullscreen-presentation', type: 'action', icon: '.uno:Dia'},
			]},
			{name: '.uno:ToolsMenu', id: 'tools', type: 'menu', menu: [
				{uno: '.uno:SpellOnline'},
				{name: '.uno:LanguageMenu', type: 'menu', menu: [
					{name: _('None (Do not check spelling)'), id: 'nonelanguage', uno: '.uno:LanguageStatus?Language:string=Default_LANGUAGE_NONE'}]}
			]},
			{name: '.uno:HelpMenu', id: 'help', type: 'menu', menu: [
				{name: _('Keyboard shortcuts'), id: 'keyboard-shortcuts', type: 'action', icon: '.uno:HelpIndex', hotkey: 'Ctrl+Shift+?'},
				{name: _('About'), id: 'about', type: 'action', icon: '.uno:About'}]
			}
		],

		spreadsheet: [
			{name: '.uno:PickList', id: 'file', type: 'menu', menu: [
				{name: '.uno:Save', id: 'save', type: 'action', hotkey: 'Ctrl+S'},
				{name: '.uno:SaveAs', id: 'saveas', type: 'action'},
				{name: _('Share...'), id:'shareas', type: 'action'},
				{name: '.uno:Print', id: 'print', type: 'action', hotkey: 'Ctrl+P'},
				{name: _('See revision history'), id: 'rev-history', type: 'action'},
				{name: _('Download as'), id:'downloadas', type: 'menu', menu: [
					{name: _('HTML Document (.html)'), id: 'downloadas-html', type: 'action'},
					{name: _('PDF Document (.pdf)'), id: 'downloadas-pdf', type: 'action'},
					{name: _('ODF spreadsheet (.ods)'), id: 'downloadas-ods', type: 'action'},
					{name: _('Excel 2003 Spreadsheet (.xls)'), id: 'downloadas-xls', type: 'action'},
					{name: _('Excel Spreadsheet (.xlsx)'), id: 'downloadas-xlsx', type: 'action'},
					{name: _('CSV (.csv)'), id: 'downloadas-csv', type: 'action'}]},
				{type: '--'},
				{name: '.uno:CloseDoc', id: 'closedocument', type: 'action'}
			]},
			{name: '.uno:EditMenu', type: 'menu', menu: [
				{uno: '.uno:Undo', hotkey: 'Ctrl+Z'},
				{uno: '.uno:Redo', hotkey: 'Ctrl+Y'},
				{name: _('Repair'), id: 'repair',  type: 'action'},
				{type: '--'},
				{uno: '.uno:Cut', hotkey: 'Ctrl+X'},
				{uno: '.uno:Copy', hotkey: 'Ctrl+C'},
				{uno: '.uno:Paste', hotkey: 'Ctrl+V'},
				{uno: '.uno:SelectAll'},
				{type: '--'},
				{uno: '.uno:SearchDialog', hotkey: 'Ctrl+H'}
			]},
			{name: '.uno:ViewMenu', id: 'view', type: 'menu', menu: [
				{name: '.uno:FullScreen', id: 'fullscreen', type: 'action'},
				{type: '--'},
				{name: '.uno:ZoomPlus', id: 'zoomin', type: 'action'},
				{name: '.uno:ZoomMinus', id: 'zoomout', type: 'action'},
				{name: '.uno:Zoom100Percent', id: 'zoomreset', type: 'action'}
			]},
			{name: '.uno:InsertMenu', type: 'menu', menu: [
				{name: _('Local Image...'), id: 'insertgraphic', type: 'action'},
				{name: '.uno:InsertGraphic', id: 'insertgraphicremote', type: 'action'},
				{uno: '.uno:InsertObjectChart'},
				{name: '.uno:InsertAnnotation', id: 'insertcomment', type: 'action', hotkey: 'Ctrl+Alt+C'},
				{uno: '.uno:DrawText'},
				{type: '--'},
				{uno: '.uno:HyperlinkDialog', hotkey: 'Ctrl+K'},
				{uno: '.uno:InsertSymbol'},
				{uno: '.uno:EditHeaderAndFooter'}
			]},
			{name: '.uno:FormatMenu', type: 'menu', menu: [
				{uno: '.uno:FormatPaintbrush'},
				{uno: '.uno:ResetAttributes', hotkey: 'Ctrl+M'},
				{uno: '.uno:FormatCellDialog'},
				{uno: '.uno:PageFormatDialog'},
				{type: '--'},
				{uno: '.uno:TransformDialog'},
				{uno: '.uno:FormatLine'},
				{uno: '.uno:FormatArea'},
				{uno: '.uno:GroupMenu', type: 'menu', menu: [
					{uno: '.uno:FormatGroup', hotkey: 'Ctrl+Shift+G'},
					{uno: '.uno:FormatUngroup'},
					{uno: '.uno:EnterGroup'},
					{uno: '.uno:LeaveGroup'}
				]}
			]},
			{name: '.uno:SheetMenu', type: 'menu', menu: [
				{name: '.uno:InsertRowsMenu', type: 'menu', menu: [
					{uno: '.uno:InsertRowsBefore'},
					{uno: '.uno:InsertRowsAfter'}]},
				{name: '.uno:InsertColumnsMenu', type: 'menu', menu: [
					{uno: '.uno:InsertColumnsBefore'},
					{uno: '.uno:InsertColumnsAfter'}]},
				{name: '.uno:InsertBreakMenu', type: 'menu', menu: [
					{uno: '.uno:InsertRowBreak'},
					{uno: '.uno:InsertColumnBreak'}]},
				{type: '--'},
				{uno: '.uno:DeleteRows'},
				{uno: '.uno:DeleteColumns'},
				{name: '.uno:DelBreakMenu', type: 'menu', menu: [
					{uno: '.uno:DeleteRowbreak'},
					{uno: '.uno:DeleteColumnbreak'}]}
			]},
			{name: '.uno:DataMenu', type: 'menu', menu: [
				{uno: '.uno:DataSort'},
				{uno: '.uno:SortAscending'},
				{uno: '.uno:SortDescending'},
				{uno: '.uno:Validation'},
				{type: '--'},
				{uno: '.uno:DataFilterAutoFilter'},
				{name: '.uno:FilterMenu', type: 'menu', menu: [
					{uno: '.uno:DataFilterStandardFilter'},
					{uno: '.uno:DataFilterSpecialFilter'},
					{type: '--'},
					{uno: '.uno:DataFilterRemoveFilter'},
					{uno: '.uno:DataFilterHideAutoFilter'}]},
				{type: '--'},
				{name: '.uno:GroupOutlineMenu', type: 'menu', menu: [
					{uno: '.uno:Group'},
					{uno: '.uno:Ungroup'},
					{type: '--'},
					{uno: '.uno:ClearOutline'},
					{type: '--'},
					{uno: '.uno:HideDetail'},
					{uno: '.uno:ShowDetail'}]},
				{type: '--'},
				{uno: '.uno:DataDataPilotRun'}
			]},
			{name: '.uno:ToolsMenu', id: 'tools', type: 'menu', menu: [
				{uno: '.uno:SpellOnline'},
				{name: '.uno:LanguageMenu', type: 'menu', menu: [
					{name: _('None (Do not check spelling)'), id: 'nonelanguage', uno: '.uno:LanguageStatus?Language:string=Default_LANGUAGE_NONE'}]}
			]},
			{name: '.uno:HelpMenu', id: 'help', type: 'menu', menu: [
				{name: _('Keyboard shortcuts'), id: 'keyboard-shortcuts', type: 'action', icon: '.uno:HelpIndex', hotkey: 'Ctrl+Shift+?'},
				{name: _('About'), id: 'about', type: 'action', icon: '.uno:About'}]
			}
		],

		commandStates: {},

		// Only these menu options will be visible in view mode
		allowedViewMenus: ['file', 'downloadas', 'view', 'help'],

		// Only these menu options will be visible in readonly mode
		allowedReadonlyMenus: ['help'],

		allowedViewModeActions: [
			'downloadas-pdf', 'downloadas-odt', 'downloadas-doc', 'downloadas-docx', 'downloadas-rtf', // file menu
			'downloadas-odp', 'downloadas-ppt', 'downloadas-pptx', 'print', // file menu
			'downloadas-ods', 'downloadas-xls', 'downloadas-xlsx', 'closedocument', // file menu
			'downloadas-csv', 'downloadas-html', 'downloadas-txt',  // file menu
			'fullscreen', 'zoomin', 'zoomout', 'zoomreset', // view menu
			'about', 'keyboard-shortcuts' // help menu
		]
	},

	onAdd: function (map) {
		this._initialized = false;
		this._menubarCont = L.DomUtil.get('main-menu');

		map.on('doclayerinit', this._onDocLayerInit, this);
		map.on('updatepermission', this._onRefresh, this);
		map.on('addmenu', this._addMenu, this);
		map.on('commandvalues', this._onInitMenu, this);
		map.on('updatetoolbarcommandvalues', this._onStyleMenu, this);
	},

	_addMenu: function (e) {
		var alreadyExists = L.DomUtil.get('menu-' + e.id);
		if (alreadyExists)
			return;

		var liItem = L.DomUtil.create('li', '');
		liItem.id = 'menu-' + e.id;
		if (this._map._permission === 'readonly') {
			L.DomUtil.addClass(liItem, 'readonly');
		}
		var aItem = L.DomUtil.create('a', '', liItem);
		$(aItem).text(e.label);
		$(aItem).data('id', e.id);
		$(aItem).data('type', 'action');
		$(aItem).data('postmessage', 'true');
		this._menubarCont.insertBefore(liItem, this._menubarCont.firstChild);
	},

	_createUnoMenuItem: function (caption, commandOrId, tagOrFunction) {
		var liItem = L.DomUtil.create('li', '');
		var aItem = L.DomUtil.create('a', '', liItem);
		var obj = {name: commandOrId};
		$(aItem).text(caption);
		if (this._map.isUnoCommand(commandOrId)) {
			$(aItem).data('type', 'unocommand');
			$(aItem).data('uno', commandOrId);
			$(aItem).data('tag', tagOrFunction);
		} else {
			liItem.id = commandOrId;
			$(aItem).data('type', 'action');
			$(aItem).data('id', commandOrId);
			obj.callback = tagOrFunction;
		}
		this._map.addAllowedCommand(obj);
		return liItem;
	},

	_onInitMenu: function (e) {
		console.debug('commandvalues : ', e);
		if (e.commandName === '.uno:LanguageStatus' && L.Util.isArray(e.commandValues)) {
			var translated, neutral;
			var constDefa = 'Default_RESET_LANGUAGES';
			var constCurr = 'Current_RESET_LANGUAGES';
			var constPara = 'Paragraph_RESET_LANGUAGES';
			var constLang = '.uno:LanguageStatus?Language:string=';
			var resetLang = _('Reset to Default Language');
			var languages  = [];

			e.commandValues.forEach(function(language) {
				languages.push({translated: _(language), neutral: language});
			});
			languages.sort(function(a, b) {
				return a.translated < b.translated ? -1 : a.translated > b.translated ? 1 : 0;
			});

			var $menuSelection = $('#menu-noneselection').parent();
			var $menuParagraph = $('#menu-noneparagraph').parent();
			var $menuDefault = $('#menu-nonelanguage').parent();
			for (var lang in languages) {
				translated = languages[lang].translated;
				neutral = languages[lang].neutral;
				$menuSelection.append(this._createUnoMenuItem(translated, constLang + encodeURIComponent('Current_' + neutral)));
				$menuParagraph.append(this._createUnoMenuItem(translated, constLang + encodeURIComponent('Paragraph_' + neutral)));
				$menuDefault.append(this._createUnoMenuItem(translated, constLang + encodeURIComponent('Default_' + neutral)));
			}
			$menuSelection.append(this._createMenu([{type: '--'}]));
			$menuParagraph.append(this._createMenu([{type: '--'}]));
			$menuDefault.append(this._createMenu([{type: '--'}]));
			$menuSelection.append(this._createUnoMenuItem(resetLang, constLang + constCurr));
			$menuParagraph.append(this._createUnoMenuItem(resetLang, constLang + constPara));
			$menuDefault.append(this._createUnoMenuItem(resetLang, constLang + constDefa));
		}
	},

	_onRefresh: function() {
		// 非編輯模式，不顯示選單，所以也沒必要載入選單
		if (this._map._permission !== 'edit') {
			$('.main-nav').hide();
			return;
		}
		// clear initial menu
		while (this._menubarCont.hasChildNodes()) {
			this._menubarCont.removeChild(this._menubarCont.firstChild);
		}

		// Add document specific menu
		this._loadMenubar(this._map.getDocType());
		this._createFileIcon();
	},

	_onStyleMenu: function (e) {
		console.debug('toolbarcommandvalues : ', e);
		if (e.commandName === '.uno:StyleApply') {
			var $header = $('#menu-insertheader');
			var $footer = $('#menu-insertfooter');
			var $menuHeader = $header.parent();
			var $menuFooter = $footer.parent();
			var pageStyles = e.commandValues['HeaderFooter'];
			var style;
			for (var iterator in pageStyles) {
				style = pageStyles[iterator];
				$menuHeader.append(this._createUnoMenuItem(_(style), '.uno:InsertPageHeader', style));
				$menuFooter.append(this._createUnoMenuItem(_(style), '.uno:InsertPageFooter', style));
			}
		}
	},

	_createDocument: function(e) {
		var self = e.data.self;
		var docType = self._map.getDocType();
		self._map.fire('postMessage', {msgId: 'UI_CreateFile', args: {DocumentType: docType}});
	},

	_onDocLayerInit: function() {
		$('#main-menu').bind('select.smapi', {self: this}, this._onItemSelected);
		$('#main-menu').bind('mouseenter.smapi', {self: this}, this._onMouseEnter);
		$('#main-menu').bind('mouseleave.smapi', {self: this}, this._onMouseLeave);

		$('#main-menu').bind('beforeshow.smapi', {self: this}, this._beforeShow);
		$('#main-menu').bind('click.smapi', {self: this}, this._onClicked);

		$('#main-menu').bind('keydown', {self: this}, this._onKeyDown);
		/*
		// SmartMenus mobile menu toggle button
		$(function() {
			var $mainMenuState = $('#main-menu-state');
			if ($mainMenuState.length) {
				// animate mobile menu
				$mainMenuState.change(function() {
					var $menu = $('#main-menu');
					var $nav = $menu.parent();
					if (this.checked) {
						$nav.css({height: 'initial', bottom: '38px'});
						$menu.hide().slideDown(250, function() { $menu.css('display', ''); });
					} else {
						$menu.show().slideUp(250, function() { $menu.css('display', ''); });
						$nav.css({height:'', bottom: ''});
					}
				});
				// hide mobile menu beforeunload
				$(window).bind('beforeunload unload', function() {
					if ($mainMenuState[0].checked) {
						$mainMenuState[0].click();
					}
				});
			}
		});
*/
		this._initialized = true;
	},

	_onClicked: function(e, menu) {
		// 只要被 click 就關掉 menu
		/*if ($(menu).hasClass('highlighted')) {
			$('#main-menu').smartmenus('menuHideAll');
		}*/
		$('#main-menu').smartmenus('menuHideAll');
		var $mainMenuState = $('#main-menu-state');
		if (!$(menu).hasClass('has-submenu') && $mainMenuState[0].checked) {
			$mainMenuState[0].click();
		}
	},

	_checkedMenu: function(uno, item) {
		var constChecked = 'lo-menu-item-checked';
		var state = this._map['stateChangeHandler'].getItemValue(uno);
		var data = $(item).data('tag');
		state = state[data] || false;
		if (state) {
			$(item).addClass(constChecked);
		} else {
			$(item).removeClass(constChecked);
		}
	},

	_beforeShow: function(e, menu) {
		var self = e.data.self;
		var items = $(menu).children().children('a').not('.has-submenu');
		L.hideAllToolbarPopup();
		$(items).each(function() {
			var constUno = 'uno';
			var aItem = this;
			var type = $(aItem).data('type');
			var id = $(aItem).data('id');
			var stateUno = $(aItem).data('state');
			var unoCommand = stateUno || $(aItem).data(constUno) || id;
			if (self._map._permission === 'edit') {
				if (unoCommand !== undefined) { // enable all depending on stored commandStates
					var data, lang;
					var constState = 'stateChangeHandler';
					var constChecked = 'lo-menu-item-checked';
					var constLanguage = '.uno:LanguageStatus';
					var constPageHeader = '.uno:InsertPageHeader';
					var constPageFooter = '.uno:InsertPageFooter';
					var itemState = self._map[constState].getItemValue(unoCommand);
					if (itemState === 'disabled') {
						$(aItem).addClass('disabled');
					} else {
						$(aItem).removeClass('disabled');
					}
					if (unoCommand.startsWith(constLanguage)) {
						unoCommand = constLanguage;
						lang = self._map[constState].getItemValue(unoCommand);
						data = decodeURIComponent($(aItem).data(constUno));
						if (data.indexOf(lang) !== -1) {
							$(aItem).addClass(constChecked);
						} else if (data.indexOf('LANGUAGE_NONE') !== -1 && lang === '[None]') {
							$(aItem).addClass(constChecked);
						} else {
							$(aItem).removeClass(constChecked);
						}
					}
					else if (unoCommand.startsWith(constPageHeader)) {
						unoCommand = constPageHeader;
						self._checkedMenu(unoCommand, this);
					}
					else if (unoCommand.startsWith(constPageFooter)) {
						unoCommand = constPageFooter;
						self._checkedMenu(unoCommand, this);
					}
					else if (itemState === 'true') {
						$(aItem).addClass(constChecked);
					} else {
						$(aItem).removeClass(constChecked);
					}
				} else if (type === 'action') { // enable all except fullscreen on windows
					if (id === 'fullscreen' && (L.Browser.ie || L.Browser.edge)) { // Full screen works weirdly on IE 11 and on Edge
						$(aItem).addClass('disabled');
						var index = self.options.allowedViewModeActions.indexOf('fullscreen');
						if (index > 0) {
							self.options.allowedViewModeActions.splice(index, 1);
						}
					} else {
						$(aItem).removeClass('disabled');
					}
				}
			} else { // eslint-disable-next-line no-lonely-if
				if (type === 'unocommand') { // disable all uno commands
					$(aItem).addClass('disabled');
				} else if (type === 'action') { // disable all except allowedViewModeActions
					var found = false;
					for (var i in self.options.allowedViewModeActions) {
						if (self.options.allowedViewModeActions[i] === id) {
							found = true;
							break;
						}
					}
					if (!found) {
						$(aItem).addClass('disabled');
					} else {
						$(aItem).removeClass('disabled');
					}
				}
			}
		});
	},

	_executeAction: function(item) {
		var id = $(item).data('id');
		if (!this._map.executeAllowedCommand(id)) {
			console.debug('未執行的 id :' + id)
		}
		// Inform the host if asked
		if ($(item).data('postmessage') === 'true') {
			this._map.fire('postMessage', {msgId: 'Clicked_Button', args: {Id: id} });
		}
	},

	_sendCommand: function (item) {
		var unoCommand = $(item).data('uno') || $(item).data('id');
		if (unoCommand === '.uno:InsertPageHeader' || unoCommand ==='.uno:InsertPageFooter') {
			var tag = $(item).data('tag');
			var state = $(item).hasClass('lo-menu-item-checked');
			var args = '?PageStyle:string='+ tag + '&On:bool=' + !state;
			if (state) {
				var warningMsg;
				if (unoCommand === '.uno:InsertPageHeader')
					warningMsg = _('All contents of the header will be deleted and can not be restored.');
				else
					warningMsg = _('All contents of the footer will be deleted and can not be restored.');

				var map = this._map;
				vex.dialog.confirm({
					message: warningMsg,
					callback: function(e) {
						if (e) {
							map.sendUnoCommand(unoCommand + args);
						}
					}
				});
			} else {
				this._map.sendUnoCommand(unoCommand + args);
			}
			return;
		}
		this._map.executeAllowedCommand(unoCommand);
	},

	_onItemSelected: function(e, item) {
		var self = e.data.self;
		var type = $(item).data('type');
		if (type === 'unocommand') {
			self._sendCommand(item);
		} else if (type === 'action') {
			self._executeAction(item);
		}

		if (!L.Browser.mobile && $(item).data('id') !== 'insertcomment')
			self._map.focus();
	},

	_onMouseEnter: function(e, item) {
		var self = e.data.self;
		var type = $(item).data('type');
		if (type === 'unocommand') {
			var unoCommand = $(item).data('uno');
			self._map.setHelpTarget(unoCommand);
		} else if (type === 'action') {
			var id = $(item).data('id');
			self._map.setHelpTarget('modules/online/menu/' + id);
		}
	},

	_onMouseLeave: function(e) {
		var self = e.data.self;
		self._map.setHelpTarget(null);
	},

	_onKeyDown: function(e) {
		var self = e.data.self;

		// handle help - F1
		if (e.type === 'keydown' && !e.shiftKey && !e.ctrlKey && !e.altKey && e.keyCode == 112) {
			self._map.showHelp();
		}
	},

	_createFileIcon: function() {
		var iconClass = 'document-logo';
		var docType = this._map.getDocType();
		if (docType === 'text') {
			iconClass += ' writer-icon-img';
		} else if (docType === 'spreadsheet') {
			iconClass += ' calc-icon-img';
		} else if (docType === 'presentation' || docType === 'drawing') {
			iconClass += ' impress-icon-img';
		}

		var liItem = L.DomUtil.create('li', '');
		liItem.id = 'document-header';
		var aItem = L.DomUtil.create('div', iconClass, liItem);
		$(aItem).data('id', 'document-logo');
		$(aItem).data('type', 'action');

		this._menubarCont.insertBefore(liItem, this._menubarCont.firstChild);

		var $docLogo = $(aItem);
		$docLogo.bind('click', {self: this}, this._createDocument);
	},

	_createMenu: function(menu) {
		var map = this._map;
		var itemList = [];
		var docType = map.getDocType();
		// Add by Firefly <firefly@ossii.com.tw>
		var lastItem = null; // 最近新增的 Item;
		this._level ++;
		// -------------------------------------
		for (var i in menu) {
			if (menu[i].id === 'about' && (L.DomUtil.get('about-dialog') === null)) {
				continue;
			}
			if (menu[i].id === 'signdocument' && (L.DomUtil.get('document-signing-bar') === null)) {
				continue;
			}

			var found = false, j;
			if (this._map._permission === 'readonly' && menu[i].menu !== undefined) {

				for (j in this.options.allowedReadonlyMenus) {
					if (this.options.allowedReadonlyMenus[j] === menu[i].id) {
						found = true;
						break;
					}
				}
				if (!found)
					continue;
			}

			if (this._map._permission === 'view' && menu[i].menu !== undefined) {
				for (j in this.options.allowedViewMenus) {
					if (this.options.allowedViewMenus[j] === menu[i].id) {
						found = true;
						break;
					}
				}
				if (!found)
					continue;
			}

			if ((menu[i].id === 'rev-history' && !revHistoryEnabled) ||
				(menu[i].id === 'closedocument' && !closebutton)) {
				continue;
			}

			if (menu[i].id === 'print' && this._map['wopi'].HidePrintOption)
				continue;

			if (menu[i].id === 'save' && this._map['wopi'].HideSaveOption)
				continue;

			if (menu[i].id === 'saveas' && this._map['wopi'].UserCanNotWriteRelative)
				continue;

			if (menu[i].id === 'shareas' && !this._map['wopi'].EnableShare)
				continue;

			if (menu[i].id === 'insertgraphicremote' && !this._map['wopi'].EnableInsertRemoteImage)
				continue;

			if (menu[i].id && menu[i].id.startsWith('fullscreen-presentation') && this._map['wopi'].HideExportOption)
				continue;

			if (menu[i].id === 'changesmenu' && this._map['wopi'].HideChangeTrackingControls)
				continue;

			// Keep track of all 'dialog:DownloadAs?ext=' options and register them as
			// export formats with docLayer which can then be publicly accessed unlike
			// this Menubar control for which there doesn't seem to be any easy way
			// to get access to.
			if (menu[i].id && menu[i].id.startsWith('dialog:DownloadAs?ext=')) {
				var format = menu[i].id.substring('dialog:DownloadAs?ext='.length);
				this._map._docLayer.registerExportFormat(menu[i].name, format);

				if (this._map['wopi'].HideExportOption)
					continue;
			}

			// 處理分隔線原則：
			// 1. 第一行不能是分隔線
			// 2. 不能重複出現分隔線
			// 3. 最後一行不能是分隔線
			if (menu[i].type !== undefined && menu[i].type === '--') {
				// 1. 第一行不能是分隔線
				if (itemList.length === 0)
					continue;
				// 2. 不能重複出現分隔線
				if (lastItem && lastItem.type !== undefined && lastItem.type === '--')
					continue;
			}

			// 紀錄最近的 Item
			if (menu[i].hide !== true) {
				lastItem = menu[i];
			}

			var liItem = L.DomUtil.create('li', '');
			if (menu[i].id) {
				liItem.id = 'menu-' + menu[i].id;
				if (menu[i].id === 'closedocument' && this._map._permission === 'readonly') {
					// see corresponding css rule for readonly class usage
					L.DomUtil.addClass(liItem, 'readonly');
				}
			}
			var aItem = L.DomUtil.create('a', menu[i].disabled ? 'disabled' : '', liItem);
			var iconItem = L.DomUtil.create('i', 'menuicon', aItem);
			var unoIcon = '';
			var itemName = '';
			if (menu[i].name !== undefined) {
				// 若 menu[i].name 是 UNO 指令
				if (this._map.isUnoCommand(menu[i].name)) {
					itemName = _UNO(menu[i].name, docType, true); // 翻譯選項
					// 不是 menubar 選項，把這個 uno command 當作選項圖示
					if (this._level > 1) {
						unoIcon = menu[i].name;
					}
				} else {
					itemName = _(menu[i].name);
				}
			} else if (menu[i].uno !== undefined) {
				unoIcon = menu[i].uno; // 把這個 uno command 當作選項圖示
				itemName = _UNO(menu[i].uno, docType, true); // 翻譯選項
			} else if (menu[i].id !== undefined && this._map.isUnoCommand(menu[i].id)) {
				unoIcon = menu[i].id; // 把這個 uno command 當作選項圖示
				itemName = _UNO(menu[i].id, docType, true); // 翻譯選項
			} else {
				itemName = '';
			}
			aItem.appendChild(document.createTextNode(itemName));
			// 增加 icon 元件
			if (menu[i].icon !== undefined) { // 有指定 icon
				// icon 開頭是 UNO 指令，改用這個 uno icon
				if (this._map.isUnoCommand(menu[i].icon)) {
					unoIcon = menu[i].icon; // 如果 icon 指定某個 uno 指令，優先使用這個圖示
				} else if (unoIcon === '') { // 只有沒有 uno icon 時，才會把 icon 內容當作 class
					L.DomUtil.addClass(iconItem, menu[i].icon);
				}
			}

			// 使用 uno 對應圖示
			if (unoIcon !== '') {
				var iconURL = 'url("' + this._map.getUnoCommandIcon(unoIcon) + '")';
				L.DomUtil.addClass(iconItem, 'img-icon');
				$(iconItem).css('background-image', iconURL);
			}
			if (menu[i].hotkey !== undefined) {
				var spanItem = L.DomUtil.create('span', 'hotkey', aItem);
				spanItem.innerHTML = menu[i].hotkey;
			}

			if (menu[i].type === undefined) {
				if ($.isArray(menu[i].menu)) {
					menu[i].type = 'menu';
				} else if (menu[i].uno === undefined) {
					menu[i].type = 'action';
				}
			}
			switch (menu[i].type) {
			case 'menu': // 選單
				var ulItem = L.DomUtil.create('ul', '', liItem);
				var subitemList = this._createMenu(menu[i].menu);
				if (!subitemList.length) {
					continue;
				}
				for (var idx in subitemList) {
					ulItem.appendChild(subitemList[idx]);
				}
				break;

			case '--': // 也可以當作分隔線類別，比較直觀
			case 'separator': // 分隔線
				$(aItem).addClass('separator');
				break;

			case 'action': // 自行處理的功能，需實作功能
				var obj = {
					name: menu[i].id,
					hotkey: menu[i].hotkey,
					hide: menu[i].hide
				};
				// 如果 name 是 UNO 指令
				if (map.isUnoCommand(menu[i].name)) {
					// 該指令放進白名單，該指令不會被執行，但可以取得狀態回報
					map.addAllowedCommand({name: menu[i].name});
					$(aItem).data('state', menu[i].name);
				}
				if (map.isUnoCommand(menu[i].id)) {
					$(aItem).data('type', 'unocommand');
				} else {
					$(aItem).data('type', 'action');
				}
				$(aItem).data('id', menu[i].id);

				if (menu[i].hotkey !== undefined) {
					$(aItem).addClass('item-has-hotkey');
				}

				// 最後將該 Action ID 加入白名單中
				map.addAllowedCommand(obj);
				break;

			default:
				// uno 指令
				if (menu[i].uno !== undefined) {
					$(aItem).data('type', 'unocommand');
					$(aItem).data('uno', menu[i].uno);
					$(aItem).data('tag', menu[i].tag);
					if (menu[i].hotkey !== undefined) {
						$(aItem).addClass('item-has-hotkey');
					}
					// 將該指令加入白名單中
					map.addAllowedCommand({name: menu[i].uno, hotkey: menu[i].hotkey, hide: menu[i].hide});
				}
				break;
			}

			// 被 hide(有可能是功能尚未完成，故不顯示)
			if (menu[i].hide === true) {
				$(aItem).css('display', 'none');
			}

			itemList.push(liItem);
		}

		// 3. 最後一行不能是分隔線
		if (itemList.length > 0) {
			aItem = itemList[itemList.length - 1].firstChild;
			if ($(aItem).hasClass('separator')) {
				itemList.pop();
			}
		}
		this._level --;
		return itemList;
	},

	_getItems: function() {
		return $(this._menubarCont).children().children('ul').children('li').add($(this._menubarCont).children('li'));
	},

	_getItem: function(targetId) {
		var items = this._getItems();
		var found = $(items).filter(function() {
			var item = this;
			var id = $(item).attr('id');
			if (id && id == 'menu-' + targetId) {
				return true;
			}
			return false;
		});
		return found.length ? found : null;
	},

	hasItem: function(targetId) {
		return this._getItem(targetId) != null;
	},

	hideItem: function(targetId) {
		var item = this._getItem(targetId);
		if (item) {
			$(item).css('display', 'none');
		}
	},

	showItem: function(targetId) {
		var item = this._getItem(targetId);
		if (item)
			$(item).css('display', '');
	},

	_loadMenubar: function(docType) {
		if (docType === 'text') {
			this._initializeMenu(this.options.text);
		} else if (docType === 'spreadsheet') {
			this._initializeMenu(this.options.spreadsheet);
		} else if (docType === 'presentation' || docType === 'drawing') {
			this._initializeMenu(this.options.presentation);
		}
	},

	_initializeMenu: function(menu) {
		this._level = 0;
		var menuHtml = this._createMenu(menu);
		for (var i in menuHtml) {
			this._menubarCont.appendChild(menuHtml[i]);
		}
		// initialize menubar plugin
		$('#main-menu').smartmenus({
			hideOnClick: true,
			showOnClick: true,
			hideTimeout: 0,
			hideDuration: 0,
			showDuration: 0,
			showTimeout: 0,
			collapsibleHideDuration: 0,
			subIndicatorsPos: 'append'
		});
		$('#main-menu').attr('tabindex', 0);
	}
});

L.control.menubar = function (options) {
	return new L.Control.Menubar(options);
};
