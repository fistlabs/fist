'use strict';

var _ = require('lodash-node');
var globs = require('../util/globs');

module.exports = function (done) {
    globs(this.params.units).then(function (units) {
        units = _.map(units, require);
        _.forEach(units, function (exports) {

            if ( !_.isArray(exports) ) {
                exports = [exports];
            }

            return this.unit(exports[0], exports[1]);
        }, this);
        done();
    }, this).done(null, done);
};
