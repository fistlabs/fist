'use strict';

var SkipResolver = /** @type SkipResolver */ require('./skip-resolver');

var inherit = require('inherit');

/**
 * @class RespResolver
 * @extends SkipResolver
 * */
var RespResolver = inherit(SkipResolver, {

    /**
     * @private
     * @memberOf {RespResolver}
     * @method
     *
     * @constructs
     *
     * @param {Object} header
     * @param {*} body
     * */
    __constructor: function (header, body) {

        /**
         * @public
         * @memberOf {SkipResolver}
         * @property
         * @type {Object}
         * */
        this.header = header;

        /**
         * @public
         * @memberOf {SkipResolver}
         * @property
         * @type {*}
         * */
        this.body = body;
    }

});

module.exports = RespResolver;
