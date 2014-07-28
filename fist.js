'use strict';

var Server = /** @type Server */ require('./core/server');

var _ = require('lodash-node');
var inherit = require('inherit');
var path = require('path');
var dirname = path.dirname(module.parent.filename);

/**
 * @param {Object} [params]
 * @param {Object} [members]
 * @param {Object} [statics]
 *
 * @returns {Server}
 * */
function fist (params, members, statics) {
    var app = fist.create(params, members, statics);

    return app.
        plug(path.join(__dirname, 'plugins', '**', '*.js')

    //  TODO add user default directories (2.0.0)
//       , path.join(app.params.cwd, 'units', '**', '*.js'),
//        path.join(app.params.cwd, 'plugins', '**', '*.js')
    );
}

fist.inherit = function (members, statics) {

    return inherit(Server, members, statics);
};

fist.create = function (params, members, statics) {
    var Fist = fist.inherit(members, statics);

    return new Fist(_.extend({cwd: dirname}, params));
};

module.exports = fist;
