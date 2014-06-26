'use strict';

var S_SEPARATOR = '\u0000';

var _ = require('lodash-node');
var inherit = require('inherit');
var vow = require('vow');

function random () {
    return Math.pow(Math.random() * Math.random(), 0.5);
}

/**
 * @class Unit
 * */
var Unit = inherit(/** @lends Unit.prototype */ {

    /**
     * @private
     * @memberOf {Unit}
     * @method
     *
     * @constructs
     * */
    __constructor: function (params) {

        var maxAge = +this._maxAge;

        if ( _.isNaN(maxAge) ) {
            maxAge = 0;
        }

        this._maxAge = maxAge;

        /**
         * @public
         * @memberOf {Unit}
         * @property
         * @type {Object}
         * */
        this.params = _.extend({}, this.params, params);

        //  make proto-deps own and unique
        this.addDeps(this.deps);
    },

    /**
     * @public
     * @memberOf {Unit}
     * @property
     * @type {String}
     * */
    path: '_unit',

    /**
     * @public
     * @memberOf {Unit}
     * @method
     * */
    addDeps: function () {
        this.deps = _.union(this.deps, _.flatten(arguments));
    },

    /**
     * @public
     * @memberOf {Unit}
     * @method
     * */
    delDeps: function () {

        var args = _.flatten(arguments);

        this.deps = _.reject(this.deps, function (path) {

            return _.contains(args, path);
        });
    },

    /**
     * @public
     * @abstract
     * @memberOf {Unit}
     * @method
     *
     * @param {Track} track
     * @param {Ctx} ctx
     *
     * @returns {*}
     * */
    data: function (track, ctx) {
        /*eslint no-unused-vars: 0*/
    },

    /**
     * @public
     * @memberOf {Unit}
     * @method
     *
     * @param {Track} track
     * @param {Ctx} defer
     *
     * @returns {*}
     * */
    getValue: function (track, defer) {

        var cache;
        var cacheKey;
        var lastUpdated;
        var promise;
        var randomFactor;
        var ageChecker;

        if ( 0 >= this._maxAge ) {

            return this.__call(track, defer);
        }

        ageChecker = track.agent.ageChecker;
        cache = track.agent.cache;
        cacheKey = this.__getCacheKey(track, defer);

        if ( cache.has(cacheKey) && !ageChecker[cacheKey]() ) {

            return cache.get(cacheKey);
        }

        lastUpdated = +new Date();
        randomFactor = random() * this._maxAge;

        ageChecker[cacheKey] = function () {

            return new Date() - lastUpdated > randomFactor;
        };

        promise = this.__call(track, defer);

        cache.set(cacheKey, promise);
        promise.done(null, function () {
            cache.del(cacheKey);
        });

        return promise;
    },

    /**
     * @public
     * @memberOf {Unit}
     * @property
     * @type {Array<String>}
     * */
    deps: [],

    /**
     * @public
     * @memberOf {Unit}
     * @property
     * @type {Object}
     * */
    params: {},

    /**
     * @protected
     * @memberOf {Unit}
     * @method
     *
     * @param {Track} track
     * @param {Ctx} defer
     *
     * @returns {Array<String>}
     * */
    _getCacheKeyParts: function (track, defer) {
        /*eslint no-unused-vars: 0*/
        return [];
    },

    /**
     * @private
     * @memberOf {Unit}
     * @method
     *
     * @param {Track} track
     * @param {Ctx} defer
     *
     * @returns {String}
     * */
    __getCacheKey: function (track, defer) {

        return this._getCacheKeyParts(track, defer).join(S_SEPARATOR);
    },

    /**
     * @private
     * @memberOf {Unit}
     * @method
     *
     * @param {Track} track
     * @param {Ctx} defer
     *
     * @returns {*}
     * */
    __call: function (track, defer) {

        var self = this;

        if ( _.isFunction(self.data) ) {

            return vow.invoke(function () {

                return self.data(track, defer);
            });
        }

        return vow.resolve(self.data);
    }

});

module.exports = Unit;
