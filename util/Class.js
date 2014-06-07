'use strict';

var inherit = require('inherit');
var _ = require('lodash-node');

/**
 * @class Class
 * @extends Object
 * */
var Class = inherit(/** @lends Class.prototype */ {

    /**
     * @private
     * @memberOf {Class}
     * @method
     *
     * @constructs
     *
     * @param {Object} [params]
     * */
    __constructor: function (params) {

        /**
         * @public
         * @memberOf {Class}
         * @property
         * @type {Object}
         * */
        this.params = _.extend({}, this.params, params);
    }

});

module.exports = Class;
