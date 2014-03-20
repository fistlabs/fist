'use strict';

var Raw = /** @type Raw */ require('./Raw');
var QueryString = /** @type QueryString */ require('querystring');

/**
 * @class Urlencoded
 * @extends Raw
 * */
var Urlencoded = Raw.extend(/** @lends Urlencoded.prototype*/ {

    /**
     * @protected
     * @memberOf {Urlencoded}
     * @method
     * */
    _parse: function (stream) {

        return Urlencoded.parent._parse.call(this, stream).
            next(function (res, done) {

                return done(null, QueryString.parse(String(res)));
            });
    }

});

module.exports = Urlencoded;
