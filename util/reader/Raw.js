'use strict';

var Loader = /** @type Loader */ require('./Loader');

/**
 * @class Raw
 * @extends Loader
 * */
var Raw = Loader.extend(/** @lends Raw.prototype*/ {

    /**
     * @protected
     * @memberOf {Raw}
     * @method
     *
     * @param {*} opts
     * @param {Function} done
     * */
    _parse: function (opts, done) {
        Raw.parent._parse.call(this, opts, function (err, res) {

            if ( 2 > arguments.length ) {

                return done(err);
            }

            return done(null, {
                input: res,
                files: Object.create(null),
                type: 'raw'
            });
        });
    }
});

module.exports = Raw;
