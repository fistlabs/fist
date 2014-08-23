'use strict';

var Control = /** @type Control */ require('./control');

var inherit = require('inherit');

/**
 * @class Respond
 * @extends Control
 * */
var Respond = inherit(Control, /** @lends Respond.prototype */ {

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
         * @memberOf {Control}
         * @property
         * @type {Object}
         * */
        this.header = header;

        /**
         * @public
         * @memberOf {Control}
         * @property
         * @type {*}
         * */
        this.body = body;
    }

});

module.exports = Respond;
