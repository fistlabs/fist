'use strict';

var _ = require('lodash-node');
var globs = require('../core/util/globs');

/*istanbul ignore next */
function plugUnits (done) {

    var units = this.params.units;

    if ( _.isUndefined(units) || _.isNull(units) ) {
        done();

        return;
    }

    this.channel('sys.migration').emit('deprecated', [
        'params.units',
        'plugin features as app.plug(\./units/**/*.js\')'
    ]);

    units = plugUnits.unshiftPatterns.concat(units);

    globs(units, this.params).then(function (units) {

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
}

plugUnits.unshiftPatterns = [];

module.exports = plugUnits;
