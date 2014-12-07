'use strict';

var Server = /** @type Server */ require('./core/server');

var _ = require('lodash-node');
var path = require('path');

var S_FIST_PLUGINS = path.join('fist_plugins', '**', '*.js');

function fist(params) {
    var app = new Server(_.extend({
        implicitBase: '_fist_contrib_unit'
    }, params));

    _.forEach([__dirname, app.params.root], function (dirname) {
        return app.install(path.join(dirname, S_FIST_PLUGINS));
    });

    return app;
}

fist.logging = require('./core/core').logging;

module.exports = fist;
