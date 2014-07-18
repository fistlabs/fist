'use strict';

var Framework = /** @type Framework */ require('./Framework');

var _ = require('lodash-node');
var inherit = require('inherit');
var path = require('path');
var dirname = path.dirname(module.parent.filename);

/**
 * @param {Object} [params]
 * @param {Object} [members]
 * @param {Object} [statics]
 *
 * @returns {Framework}
 * */
function fist (params, members, statics) {
    var Fist = inherit(Framework, members, statics);

    //  очень высока вероятность что директория в которой находится
    // файл запуска сервера будет являться истинной cwd (by default)
    params = _.extend({cwd: dirname}, params);

    return new Fist(params);
}

module.exports = fist;
