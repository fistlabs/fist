'use strict';

var StreamLoader = /** @type StreamLoader */ require('../StreamLoader');

/**
 * @class Raw
 * @extends StreamLoader
 * */
var Raw = StreamLoader.extend(/** @lends Raw.prototype*/ {

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

            return done(null, {input: res, files: Object.create(null)});
        });
    }
});

module.exports = Raw;
