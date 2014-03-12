'use strict';

var toArray = require('fist.lang.toarray');

module.exports = function (done) {

    var routes = /** @type {Array} */ toArray(this.params.routes);

    routes.forEach(function (desc) {
        this.route(desc.verb, desc.expr, desc.name, desc.data, desc.opts);
    }, this);

    done(null, null);
};
