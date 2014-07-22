'use strict';

var Skip = /** @type Skip */ require('./skip');

var inherit = require('inherit');

/**
 * @class SkipResponse
 * @extends Skip
 * */
var SkipResponse = inherit(Skip, /** @lends SkipResponse.prototype */ {

    /**
     * @private
     * @memberOf {SkipResponse}
     * @method
     *
     * @constructs
     *
     * @param {Number} status
     * @param {Object} header
     * @param {*} body
     * */
    __constructor: function (status, header, body) {

        /**
         * @public
         * @memberOf {SkipResponse}
         * @property
         * @type {Number}
         * */
        this.status = status;

        /**
         * @public
         * @memberOf {Skip}
         * @property
         * @type {Object}
         * */
        this.header = header;

        /**
         * @public
         * @memberOf {Skip}
         * @property
         * @type {*}
         * */
        this.body = body;
    }

});

module.exports = SkipResponse;
