'use strict';

var Raw = /** @type Raw */ require('./Raw');
var QueryString = /** @type QueryString */ require('querystring');

/**
 * @class Urlencoded
 * @extends Raw
 * */
var Urlencoded = Raw.extend(/** @lends Urlencoded.prototype*/ {

    /**
     * @public
     * @memberOf {Urlencoded}
     * @property
     * @type {String}
     * */
    type: 'urlencoded',

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

});

module.exports = Urlencoded;
