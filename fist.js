'use strict';

var Server = /** @type Server */ require('./core/server');

var _ = require('lodash-node');
var inherit = require('inherit');
var path = require('path');

var S_FIST_PLUGINS = path.join('fist_plugins', '**', '*.js');

function fist(params, members, statics) {
    var app = fist.create(_.extend({
        implicitBase: '_fist_contrib_unit'
    }, params), members, statics);

    _.forEach([__dirname, app.params.root], function (dirname) {
        return app.install(path.join(dirname, S_FIST_PLUGINS));
    });

    return app;
}

fist.create = function (params, members, statics) {
    var Fist = fist.inherit(members, statics);

    return new Fist(params);
};

fist.inherit = function (members, statics) {

    return inherit(Server, members, statics);
};

fist.logging = require('./core/core').logging;

module.exports = fist;
