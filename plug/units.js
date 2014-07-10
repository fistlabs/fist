'use strict';

var _ = require('lodash-node');
var globs = require('../util/globs');

module.exports = function (done) {
    globs(this.params.units).then(function (units) {
        units = _.map(units, require);
        _.forEach(units, this.unit, this);
        done();
    }, this).done(null, done);
};
