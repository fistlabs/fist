'use strict';

var _ = require('lodash-node');

module.exports = function (done) {

    var routes = this.params.routes;

    if ( _.isUndefined(routes) || _.isNull(routes) ) {
        routes = [];

    } else if ( !_.isArray(routes) ) {
        routes = [routes];
    }

    _.forEach(routes, function (desc) {
        this.route(desc.pattern, desc);
    }, this);

    done();
};
