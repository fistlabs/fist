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
     * @method
     *
     * @returns {Next}
     * */
    parse: function (stream) {

        return Urlencoded.parent.parse.call(this, stream).
            next(function (res, done) {

                return done(null, QueryString.parse(String(res)));
            });
    }

}, {

    /**
     * @public
     * @static
     * @memberOf Urlencoded
     * @property
     * @type {String}
     * */
    type: 'urlencoded',

    /**
     * @public
     * @static
     * @memberOf Urlencoded
     * @method
     *
     * @param {Object} media
     *
     * @returns {Boolean}
     * */
    matchMedia: function (media) {

        return 'application' === media.type &&
            'x-www-form-urlencoded' === media.subtype;
    }

});

module.exports = Urlencoded;
