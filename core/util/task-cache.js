'use strict';

var EqualMap = /** @type EqualMap */ require('./equal-map');

var _ = require('lodash-node');
var inherit = require('inherit');

/**
 * @class TaskCache
 * @extends EqualMap
 * */
var TaskCache = inherit(EqualMap, /** @lends TaskCache */ {

    /**
     * @private
     * @memberOf {TaskCache}
     * @method
     *
     * @constructs
     * */
    __constructor: function () {
        this.__base();

        /**
         * @private
         * @memberOf {TaskCache}
         * @property
         * @type {Object}
         * */
        this.__scalar = {};
    },

    /**
     * @public
     * @memberOf {TaskCache}
     * @method
     *
     * @param {*} locals
     * @param {vow.Promise} promise
     *
     * @returns {TaskCache}
     * */
    set: function (locals, promise) {

        if (_.isObject(locals)) {

            return this.__base(locals, promise);
        }

        this.__scalar[locals] = promise;

        return this;
    },

    /**
     * @public
     * @memberOf {TaskCache}
     * @method
     *
     * @param {*} locals
     *
     * @returns {*}
     * */
    get: function (locals) {

        if (_.isObject(locals)) {

            return this.__base(locals);
        }

        return this.__scalar[locals];
    }

});

module.exports = TaskCache;
