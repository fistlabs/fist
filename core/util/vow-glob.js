'use strict';

var vowFs = require('vow-fs');

//  TODO remove this module
function vowGlob(pattern, options) {
    return vowFs.glob(pattern, options);
}

module.exports = vowGlob;
