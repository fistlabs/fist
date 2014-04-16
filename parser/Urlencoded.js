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
     * @param {Object} stream
     * @param {Function} done
     * */
    parse: function (stream, done) {

        return Urlencoded.parent.parse.call(this, stream, function (err, res) {

            if ( 2 > arguments.length ) {
                done(err);

                return;
            }

            done(null, QueryString.parse(String(res)));
        });
    },

    /**
     * @public
     * @memberOf {Urlencoded}
     * @property
     * @type {String}
     * */
    type: 'urlencoded'

}, {

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
