'use strict';

Object.defineProperty(exports, "__esModule", {
		value: true
});

exports.default = function (_ref) {
		var identifier = _ref.identifier,
		    name = _ref.name,
		    platformFamily = _ref.platformFamily,
		    index = _ref.index,
		    _ref$enableJavascript = _ref.enableJavascript,
		    enableJavascript = _ref$enableJavascript === undefined ? false : _ref$enableJavascript;

		return '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n\t<key>CFBundleIdentifier</key>\n\t<string>' + identifier + '</string>\n\t<key>CFBundleName</key>\n\t<string>' + name + '</string>\n\t<key>DocSetPlatformFamily</key>\n\t<string>' + platformFamily + '</string>\n\t<key>dashIndexFilePath</key>\n\t<string>' + index + '</string>\n\t<key>DashDocSetFamily</key>\n\t<string>dashtoc</string>\n\t<key>isDashDocset</key>\n\t<true/>\n  <key>isJavaScriptEnabled</key>\n  <' + (enableJavascript ? 'true' : false) + '/>\n</dict>\n</plist>\n';
};

;