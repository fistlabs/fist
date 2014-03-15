'use strict';

var S_REPLACER = '\\$&';
var R_SPECIALS = /[-$()*+.\/?[\\\]^{|}]/g;

/**
 * @param {String} s
 *
 * @returns {String}
 * */
module.exports = function (s) {

    return String.prototype.replace.call(s, R_SPECIALS, S_REPLACER);
};
