'use strict';

var Raw = /** @type Raw */ require('./Raw');

var inherit = require('inherit');

/**
 * @class Json
 * @extends Raw
 * */
var Json = inherit(Raw, /** @lends Json.prototype*/ {

    /**
     * @public
     * @memberOf {Json}
     * @method
     *
     * @param {Object} stream
     *
     * @returns {vow.Promise}
     * */
    parse: function (stream) {

        return this.__base(stream).then(JSON.parse);
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
               ('json' === media.subtype || 'json' === media.suffix);
    }

});

module.exports = Json;
