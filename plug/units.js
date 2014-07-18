'use strict';

var _ = require('lodash-node');
var globs = require('../util/globs');

module.exports = function (done) {
    globs(this.params.units, this.params).then(function (units) {

        return _.map(units, require);
    }).done(function (units) {
        _.forEach(units, function (exports) {
            //  TODO deprecate this behavior
            if ( _.isArray(exports) ) {
                this.unit(exports[0], exports[1]);

            } else {
                this.unit(exports);
            }

        }, this);
        done();
    }, done, this);
};
