'use strict';

var LRUCache = /** @type LRUCache */ require('lru-cache');

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
     * @param {Function} done
     * */
    set: function (k, v, cacheMaxAge, done) {
        var lastUpdated = +new Date();
        var base = this.__base;
        var self = this;

        cacheMaxAge = +cacheMaxAge;

        if ( _.isNaN(cacheMaxAge) ) {
            cacheMaxAge = 0;

        } else if (cacheMaxAge) {
            cacheMaxAge *= Math.random();
        }

        this.__checker[k] = function () {

            return new Date() - lastUpdated >= cacheMaxAge;
        };

        process.nextTick(function () {
            done(null, base.call(self, k, v));
        });
    },

    /**
     * @public
     * @memberOf {Cache}
     * @method
     *
     * @param {String} k
     * @param {Function} done
     *
     * @returns {*}
     * */
    get: function (k, done) {
        var base = this.__base;
        var self = this;

        if ( this.has(k) && this.__checker[k]() ) {

            delete this.__checker[k];
            this.del(k);
        }

        if ('function' === typeof done) {
            process.nextTick(function () {
                done(null, base.call(self, k));
            });
        } else {
            base.call(self, k);
        }
    }

});

module.exports = Cache;
