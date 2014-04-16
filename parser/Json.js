'use strict';

var Raw = /** @type Raw */ require('./Raw');
var QueryString = /** @type QueryString */ require('querystring');
var R_JSON = /^(?:(?:[-\w\.]+\+)?json|json\+[-\w\.]+)$/i;

/**
 * @class Json
 * @extends Raw
 * */
var Json = Raw.extend(/** @lends Json.prototype*/ {

    /**
     * @public
     * @memberOf {Json}
     * @method
     *
     * @param {Object} stream
     * @param {Function} done
     * */
    parse: function (stream, done) {
        Json.parent.parse.call(this, stream, function (err, res) {
            /*eslint no-catch-shadow: 0*/
            if ( 2 > arguments.length ) {
                done(err);

                return;
            }

            try {
                res = JSON.parse(res);

            } catch (err) {
                done(err);

                return;
            }

            done(null, res);
        });
    },

    /**
     * @public
     * @memberOf {Json}
     * @property
     * @type {String}
     * */
    type: 'json'

}, {

    /**
     * @public
     * @static
     * @memberOf Json
     * @method
     *
     * @param {Object} media
     *
     * @returns {Boolean}
     * */
    matchMedia: function (media) {

        return 'application' === media.type &&
            R_JSON.test(media.subtype);
    }

});

module.exports = Json;
