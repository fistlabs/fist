'use strict';

var Framework = /** @type Framework */ require('./Framework');
var inherit = require('inherit');

/**
 * @param {Object} [params]
 * @param {Object} [members]
 * @param {Object} [statics]
 *
 * @returns {Framework}
 * */
function fist (params, members, statics) {
    var Fist = inherit(Framework, members, statics);

    return new Fist(params);
}

module.exports = fist;
