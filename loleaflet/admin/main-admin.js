/* -*- js-indent-level: 8 -*- */
// CSS requires
require('vex-js/dist/css/vex.css');
require('vex-js/dist/css/vex-theme-default.css');
require('smartmenus/dist/css/sm-core-css.css');
require('smartmenus/dist/css/sm-simple/sm-simple.css');
require('jquery-ui-dist/jquery-ui.css');

var $ = require('jquery');
global.$ = global.jQuery = $;

require('json-js/json2');
require('l10n-for-node');

var vex = require('vex-js/dist/js/vex.combined.js');
vex.defaultOptions.className = 'vex-theme-default';
global.vex = vex;

global._ = function (string) {
	return string.toLocaleString();
};

global.L = {};

global.l10nstrings = require('./admin.strings.js');
require('smartmenus');
require('jquery-ui-dist/jquery-ui.js');
require('../src/unocommands.js');
require('../src/core/Util.js')
require('../src/dom/DomUtil.js')

global.d3 = require('d3');
global.Admin = require('admin-src.js');
