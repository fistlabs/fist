'use strict';

var Skip = /** @type Skip */ require('./skip');

var inherit = require('inherit');

/**
 * @class Response
 * @extends Skip
 * */
var Response = inherit(Skip, /** @lends Response.prototype */ {

    /**
     * @private
     * @memberOf {Response}
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
         * @memberOf {Response}
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

module.exports = Response;
