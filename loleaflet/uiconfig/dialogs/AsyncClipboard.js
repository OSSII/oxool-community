/* -*- js-indent-level: 8 -*- */
/*
 * L.dialog.AsyncClipboard
 *
 * Author: Firefly <firefly@ossii.com.tw>
 */
/* global app */
L.dialog.AsyncClipboard = {
	PERMISSIONS : [
		{ name: "clipboard-read" },
		{ name: "clipboard-write" }
		//{ name: "clipboard-read",  allowWithoutGesture: false },
	  	//{ name: "clipboard-read",  allowWithoutGesture: true  },
	  	//{ name: "clipboard-write", allowWithoutGesture: false },
	  	//{ name: "clipboard-write", allowWithoutGesture: true  }
	],

	/// 可貼上權限
	_pasteState: '',

	toBlob: function(text, mimeType) {
		let content = [];
		let data = new Blob([text]);
		content.push(mimeType + '\n');
		content.push(data.size.toString(16) + '\n');
		content.push(data);
		content.push('\n');
		return new Blob(content);
	},

	/**
	 * 查詢是否可讀取剪貼簿貼上
	 * @returns
	 */
	canBePaste: function() {
		// prompt - 詢問使用者是否允許
		// granted - 已由使用者授權
		// denied - 被使用者封鎖
		return this._pasteState !== 'denied';
	},

	paste: async function(specialPasteCmd) {
		let that = this;
		try {
			const clipboardItems = await navigator.clipboard.read();
			console.debug('clipboardItems', clipboardItems);
			const clipboardItem = clipboardItems[0];
			const clipboardTypes = clipboardItem.types;
			console.debug('clipboardItems.types', clipboardTypes);

			let content = [];
			for (let i = 0 ; i < clipboardTypes.length ; ++i) {
				let type = clipboardTypes[i];
				let dataStr = await clipboardItem.getType(type);
				// 不要空的剪貼內容
				if (dataStr.length === 0)
					continue;

				let data = new Blob([dataStr]);
				console.debug('type ' + type + ' length ' + data.size +
				    ' -> 0x' + data.size.toString(16) + '\n');
				content.push(type + '\n');
				content.push(data.size.toString(16) + '\n');
				content.push(data);
				content.push('\n');
			}

			// 有讀到剪貼簿內容
			if (content.length > 0) {
				let clip = this._map._clip;
				let contentBlob = new Blob(content, {type : 'application/octet-stream', endings: 'transparent'});
				let formData = new FormData();
				formData.append('file', contentBlob);

				clip._doAsyncDownload('POST', clip.getMetaURL(), formData, false,
					function() {
						console.debug('Posted ' + contentBlob.size + ' bytes successfully');
						if (that._map.isUnoCommand(specialPasteCmd)) {
							app.socket.sendMessage('uno ' + specialPasteCmd);
						} else {
							app.socket.sendMessage('uno .uno:Paste');
						}
					},

					function(progress) {
						console.debug('progress : ', progress);
						return progress;
					}
				);
			} else {
				console.debug('Clipboard does not have required data type.("text/html" or "text/plain")');
			}
		} catch(e) {
			console.debug('Failed to read clipboard :', e);
		}
	},

	initialize: function() {
		let that = this;
		Promise.all(
			that.PERMISSIONS.map( descriptor => navigator.permissions.query(descriptor) )
		).then( permissions => {
			permissions.forEach( (status, index) => {
				// 監視讀取剪貼簿權限
				if (status.name === 'clipboard_read') {
					status.onchange = () => {
						that._pasteState = status.state;
						console.debug('clipboard_read status = ' + status.state);
					};
					status.onchange();
				}
			});
		});
	},

	run: function(/*parameter*/) {

	},
};
