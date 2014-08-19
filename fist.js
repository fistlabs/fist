'use strict';

var Server = /** @type Server */ require('./core/server');

var _ = require('lodash-node');
var inherit = require('inherit');
var path = require('path');
var dirname = path.dirname(module.parent.filename);

var S_FIST_PLUGINS = path.join('fist_plugins', '**', '*.js');

/**
 * @param {Object} [params]
 * @param {Object} [members]
 * @param {Object} [statics]
 *
 * @returns {Server}
 * */
function fist (params, members, statics) {
    var app = fist.create(params, members, statics);
    var patterns = [__dirname, app.params.cwd];

    patterns = _.map(patterns, function (dirname) {

        return path.join(dirname, S_FIST_PLUGINS);
    });

    return app.include(patterns);
}

fist.inherit = function (members, statics) {

    return inherit(Server, members, statics);
};

fist.create = function (params, members, statics) {
    var Fist = fist.inherit(members, statics);

    params = _.extend({cwd: dirname}, params);

    return new Fist(params);
};

module.exports = fist;
