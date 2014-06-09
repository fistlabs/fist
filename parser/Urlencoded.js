'use strict';

var Raw = /** @type Raw */ require('./Raw');
var QueryString = /** @type QueryString */ require('querystring');

var inherit = require('inherit');

/**
 * @class Urlencoded
 * @extends Raw
 * */
var Urlencoded = inherit(Raw, /** @lends Urlencoded.prototype*/ {

    /**
     * @public
     * @memberOf {Urlencoded}
     * @method
     *
     * @param {Object} stream
     *
     * @returns {vow.Promise}
     * */
    parse: function (stream) {

        return this.__base(stream).then(parseQuery);
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

/**
 * @private
 * @static
 * @memberOf Urlencoded
 * @method
 *
 * @param {String|Buffer} res
 *
 * @returns {Object}
 * */
function parseQuery (res) {

    return QueryString.parse(String(res));
}

module.exports = Urlencoded;
