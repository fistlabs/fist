'use strict';

var Loader = /** @type Loader */ require('./Loader');
var QueryString = /** @type QueryString */ require('querystring');
var R_URLENCODED = /^application\/x-www-form-urlencoded(?:;|$)/i;

/**
 * @class Urlencoded
 * @extends Loader
 * */
var Urlencoded = Loader.extend(/** @lends Urlencoded.prototype*/ {

    /**
     * @protected
     * @memberOf {Urlencoded}
     * @method
     *
     * @param {Function} done
     * */
    _parse: function (done) {
        Urlencoded.parent._parse.call(this, function (err, res) {

            if ( 2 > arguments.length ) {

                return done(err);
            }

            res = QueryString.parse(String(res));

            return done(null, res);
        });
    }
}, {

    /**
     * @public
     * @static
     * @memberOf Urlencoded
     *
     * @param {Object} req
     *
     * @returns {Boolean}
     * */
    isUrlencoded: function (req) {

        return R_URLENCODED.test(req.headers['content-type']);
    }
});

module.exports = Urlencoded;
