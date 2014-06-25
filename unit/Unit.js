'use strict';

var S_SEPARATOR = '\u0000';
var LRUCache = require('lru-cache');

var _ = require('lodash-node');
var inherit = require('inherit');
var vow = require('vow');

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

        /**
         * @public
         * @memberOf {Unit}
         * @property
         * @type {Object}
         * */
        this.params = _.extend({}, this.params, params);

        /**
         * @private
         * @memberOf {Unit}
         * @property
         * @type {LRUCache}
         * */
        this.__cache = new LRUCache(_.extend({
            maxAge: this._maxAge
        }, this.params.cache));

        //  make proto-deps own and unique
        this.addDeps(this.deps);
    },

    /**
     * @public
     * @memberOf {Unit}
     * @property
     * @type {String}
     * */
    path: 'unit',

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
     * @param {Ctx} ctx
     *
     * @returns {*}
     * */
    getValue: function (track, ctx) {

        var cacheKey = this.__getCacheKey(track, ctx);
        var data = this.__cache.get(cacheKey);

        if ( vow.isPromise(data) ) {

            return data;
        }

        data = this.__call(track, ctx);

        data.fail(function () {
            //  Если узел зареджектился то не кэшируем
            this.__cache.del(cacheKey);
        }, this).done();

        this.__cache.set(cacheKey, data);

        return data;
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
     * @property
     * @type {Number}
     * */
    _maxAge: -Infinity,

    /**
     * @protected
     * @memberOf {Unit}
     * @method
     *
     * @param {Track} track
     * @param {Ctx} ctx
     *
     * @returns {Array<String>}
     * */
    _getCacheKeyParts: function (track, ctx) {
        /*eslint no-unused-vars: 0*/
        return [];
    },

    /**
     * @private
     * @memberOf {Unit}
     * @method
     *
     * @param {Track} track
     * @param {Ctx} ctx
     *
     * @returns {String}
     * */
    __getCacheKey: function (track, ctx) {

        return this._getCacheKeyParts(track, ctx).join(S_SEPARATOR);
    },

    /**
     * @private
     * @memberOf {Unit}
     * @method
     *
     * @param {Track} track
     * @param {Ctx} ctx
     *
     * @returns {*}
     * */
    __call: function (track, ctx) {

        var self = this;

        if ( _.isFunction(this.data) ) {

            return vow.invoke(function () {

                return self.data(track, ctx);
            });
        }

        return vow.resolve(this.data);
    }

});

module.exports = Unit;
