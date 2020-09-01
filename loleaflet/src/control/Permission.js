/* -*- js-indent-level: 8 -*- */
/*
 * Document permission handler
 */
/* global $ _ */

L.Map.include({
	setPermission: function (perm) {
		if (perm === 'edit') {
			var editInOdf = this.isEditInOdfFormat(); // 是否需以 ODF 格式編輯?
			if (L.Browser.mobile || editInOdf) {
				// 以 ODF 格式編輯的功能，只能由檔案 Owner 執行，其他人只能唯讀開啟
				if (editInOdf && this.wopi.DocumentOwner !== true) {
					this._enterReadOnlyMode('readonly');
					return;
				}
				var button = $('#mobile-edit-button');
				var buttonText = $('#mobile-edit-button-text');
				// 非手機模式，變更滑鼠指標為 '手指'
				if (!L.Browser.mobile) {
					button.css({'cursor': 'pointer'});
				}

				if (editInOdf) {
					button.css({
						'padding-left': '16px',
						'padding-right': '16px',
						'border-radius': '16px',
						'width': 'auto',
						'background-color': 'rgba(0, 0, 255, 0.5)'
					});
					buttonText.text(' ' + _('Edit in ODF format'));
				} else {
					button.css({
						'padding-left': '0',
						'padding-right': '0',
						'border-radius': '50%',
						'width': '56px',
						'background-color': 'rgba(255, 128, 0, 0.5)'
					});
					buttonText.text('');
				}
				button.show();
				button.off('click');

				var that = this;
				button.on('click', function () {
					button.hide();
					that._enterEditMode('edit');
					that.fire('editorgotfocus');
					// In the iOS/android app, just clicking the mobile-edit-button is
					// not reason enough to pop up the on-screen keyboard.
					if (!(window.ThisIsTheiOSApp || window.ThisIsTheAndroidApp))
						that.focus();
					// 以 ODF 格式編輯的話，要轉檔
					if (editInOdf) {
						var newName = that.getDocName() + '.' + that.wopi.UserExtraInfo.SaveToOdf;
						that.saveAs(newName);
					}
				});

				// temporarily, before the user touches the floating action button
				this._enterReadOnlyMode('readonly');
			} else {
				this._enterEditMode(perm);
			}
		}
		else if (perm === 'view' || perm === 'readonly') {
			if (L.Browser.mobile) {
				$('#mobile-edit-button').hide();
			}

			this._enterReadOnlyMode(perm);
		}
	},

	_enterEditMode: function (perm) {
		if (this._permission == 'readonly' && (L.Browser.mobile || this.isEditInOdfFormat())) {
			this.sendInitUNOCommands();
		}
		this._permission = perm;

		this._socket.sendMessage('requestloksession');
		if (!L.Browser.touch) {
			this.dragging.disable();
		}

		this.fire('updatepermission', {perm : perm});
	},

	_enterReadOnlyMode: function (perm) {
		this._permission = perm;

		this.dragging.enable();
		// disable all user interaction, will need to add keyboard too
		this._docLayer._onUpdateCursor();
		this._docLayer._clearSelections();
		this._docLayer._onUpdateTextSelection();

		this.fire('updatepermission', {perm : perm});
	},

	enableSelection: function () {
		if (this._permission === 'edit') {
			return;
		}
		this._socket.sendMessage('requestloksession');
		this.dragging.disable();
	},

	disableSelection: function () {
		if (this._permission === 'edit') {
			return;
		}
		this.dragging.enable();
	},

	isSelectionEnabled: function () {
		return !this.dragging.enabled();
	},

	getPermission: function () {
		return this._permission;
	},

	isEditInOdfFormat: function () {
		var editInOdfFormat = this.wopi.UserExtraInfo.SaveToOdf;
		return (['odt', 'ods', 'odp'].indexOf(editInOdfFormat) >= 0);
	}
});
