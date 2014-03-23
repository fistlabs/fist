'use strict';

var R34 = /\x22/g;
var R38 = /\x26/g;
var R39 = /\x27/g;
var R60 = /\x3C/g;
var R62 = /\x3E/g;

var M34 = '&#34;';
var M38 = '&#38;';
var M39 = '&#39;';
var M60 = '&#60;';
var M62 = '&#62;';

module.exports = function (html) {

    return String(html)
        .replace(R34, M34)
        .replace(R38, M38)
        .replace(R39, M39)
        .replace(R60, M60)
        .replace(R62, M62);
};
