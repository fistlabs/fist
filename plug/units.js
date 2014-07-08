'use strict';

var globs = require('../util/globs');
var _ = require('lodash-node');

module.exports = function (done) {
    globs(this.params.units).then(function (units) {
        units = _.map(units, require);
        _.forEach(units, this.unit, this);
        done();
    }, done, this).done(null, done);
};
