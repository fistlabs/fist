'use strict';

var LRUCache = require('lru-cache');

var _ = require('lodash-node');
var inherit = require('inherit');

/**
 * @class Cache
 * @extends LRUCache
 * */
var Cache = inherit(LRUCache, /** @lends Cache.prototype */ {

    /**
     * @private
     * @memberOf {Cache}
     * @method
     *
     * @param {Object} [params]
     * */
    __constructor: function (params) {

        params = _.extend({}, this.params, params, {
            maxAge: Infinity
        });

        /**
         * @private
         * @memberOf {Cache}
         * @property
         * @type {Object}
         * */
        this.__checker = {};

        this.__base(params);
    },

    /**
     * @public
     * @memberOf {Cache}
     * @property
     * @type {Boolean}
     * */
    local: true,

    /**
     * @public
     * @memberOf {Cache}
     * @property
     * @type {Object}
     * */
    params: {
        max: 500
    },

    /**
     * @public
     * @memberOf {Cache}
     * @method
     *
     * @param {String} k
     * @param {*} v
     * @param {Number} cacheMaxAge
     * */
    set: function (k, v, cacheMaxAge) {

        var lastUpdated = +new Date();

        cacheMaxAge = +cacheMaxAge;

        if ( _.isNaN(cacheMaxAge) ) {
            cacheMaxAge = 0;

        } else if (cacheMaxAge) {
            cacheMaxAge *= Math.random();
        }

        this.__checker[k] = function () {

            return new Date() - lastUpdated >= cacheMaxAge;
        };

        return this.__base(k, v);
    },

    /**
     * @public
     * @memberOf {Cache}
     * @method
     *
     * @param {String} k
     *
     * @returns {*}
     * */
    get: function (k) {

        if ( this.has(k) && this.__checker[k]() ) {
            this.del(k);
        }

        return this.__base(k);
    }

});

module.exports = Cache;
