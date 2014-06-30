'use strict';

var globs = require('../util/globs');
var _ = require('lodash-node');

module.exports = function (done) {
    globs(this.params.units).then(function (units) {

        try {
            units = _.map(units, function (filename) {

                return require(filename);
            });
        } catch (err) {
            done(err);

            return;
        }

        try {
            _.forEach(units, function (unit) {
                this.unit(unit);
            }, this);

        } catch (err) {
            done(err);

            return;
        }

        done();

    }, done, this);
};
