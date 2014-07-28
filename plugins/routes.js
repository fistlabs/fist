'use strict';

var _ = require('lodash-node');
var path = require('path');

/*istanbul ignore next */
function exists (module) {

    try {
        require.resolve(module);

        return true;

    } catch (err) {

        return false;
    }
}

/*istanbul ignore next */
function plugRoutes () {
    var routes = this.params.routes;

    if ( _.isUndefined(routes) || _.isNull(routes) ) {

        return;
    }

    this.channel('sys.migration').emit('deprecated', [
        'params.routes',
        'plugin features as app.plug(\'/path/to/router.js\')'
    ]);

    if ( !_.isObject(routes) ) {
        routes = path.resolve(this.params.cwd, routes);

        if ( exists(routes) ) {
            routes = require(routes);

        } else {
            routes = [];
        }
    }

    if ( !_.isArray(routes) ) {
        routes = [routes];
    }

    _.forEach(routes, function (desc) {
        this.route(desc.pattern, desc);
    }, this);
}

module.exports = plugRoutes;
