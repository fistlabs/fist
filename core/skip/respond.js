'use strict';

var Skip = /** @type Skip */ require('./skip');

var inherit = require('inherit');

/**
 * @class Respond
 * @extends Skip
 * */
var Respond = inherit(Skip, /** @lends Respond.prototype */ {

    /**
     * @private
     * @memberOf {Respond}
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
         * @memberOf {Respond}
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

module.exports = Respond;
