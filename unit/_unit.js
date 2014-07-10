'use strict';

var S_SEPARATOR = '\u0000';
var EventEmitter = /** @type EventEmitter */ require('events').EventEmitter;
var SkipResolver = /** @type SkipResolver */ require('../util/skip-resolver');

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

        var maxAge = +this._maxAge;

        if ( _.isNaN(maxAge) ) {
            maxAge = 0;
        }

        /**
         * @protected
         * @memberOf {Unit}
         * @property
         * @type {Number}
         * */
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
     * @public
     * @memberOf {Unit}
     * @method
     * */
    addDeps: function () {
        this.deps = _.union(this.deps, _.flatten(arguments));
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
     * */
    delDeps: function () {

        var args = _.flatten(arguments);

        this.deps = _.reject(this.deps, function (path) {

            return _.contains(args, path);
        });
    },

    /**
     * @public
     * @memberOf {Unit}
     * @method
     *
     * @param {Ctx} ctx
     *
     * @returns {*}
     * */
    getValue: function (ctx) {

        var key;

        if ( 0 >= this._maxAge ) {

            return this.__call(ctx);
        }

        key = this.__getCacheKey(ctx);

        return this.__callThroughCache(key, ctx).then(function (value) {

            var data = value.data;

            //  из кэша или резолвер
            if ( !value.fresh || data instanceof SkipResolver ) {

                return data;
            }

            //  только что загружено
            delete value.fresh;

            this.__setCache(key, value, ctx).fail(ctx.notify, ctx);

            return data;
        }, this);
    },

    /**
     * @private
     * @memberOf {Unit}
     * @method
     *
     * @param {String} key
     * @param {*} value
     * @param {Ctx} ctx
     *
     * @returns {*}
     * */
    __setCache: function (key, value, ctx) {

        var defer = vow.defer();

        //  если запрос выполнен успешно то сохраняем в кэш
        ctx.track.agent.cache.set(key, value, this._maxAge, function (err) {

            if ( err ) {
                defer.reject(err);

                return;
            }

            defer.resolve(err);
        });

        return defer.promise();
    },

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
     * @param {Ctx} ctx
     *
     * @returns {*}
     * */
    __call: function (ctx) {

        var self = this;

        if ( _.isFunction(self.data) ) {

            return vow.invoke(function () {

                return self._callData(ctx);
            });
        }

        return vow.resolve(self.data);
    },

    /**
     * @private
     * @memberOf {Unit}
     * @method
     *
     * @param {Ctx} ctx
     *
     * @returns {vow.Promise}
     * */
    __callAndWrap: function (ctx) {

        return this.__call(ctx).then(function (data) {

            return {
                data: data,
                fresh: true
            };
        });
    },

    /**
     * @protected
     * @memberOf {Unit}
     * @method
     *
     * @param {Ctx} ctx
     *
     * @returns {*}
     *
     * @throws {*}
     * */
    _callData: function (ctx) {

        return this.data(ctx.track, ctx);
    },

    /**
     * @private
     * @memberOf {Unit}
     * @method
     *
     * @param {Ctx} ctx
     *
     * @returns {String}
     * */
    __getCacheKey: function (ctx) {

        return this._getCacheKeyParts(ctx.track, ctx).join(S_SEPARATOR);
    },

    /**
     * @private
     * @memberOf {Unit}
     * @method
     *
     * @param {String} key
     * @param {Ctx} ctx
     *
     * @returns {vow.Promise}
     * */
    __callThroughCache: function (key, ctx) {

        return this.__getCache(key, ctx).then(function (res) {

            if ( _.isObject(res) ) {

                return res;
            }

            return this.__callAndWrap(ctx);

        }, function (err) {
            //  ошибка забора из кэша
            ctx.notify(err);

            return this.__callAndWrap(ctx);
        }, this);
    },

    /**
     * @private
     * @memberOf {Unit}
     * @method
     *
     * @param {String} cacheKey
     * @param {Ctx} ctx
     *
     * @returns {vow.Promise}
     * */
    __getCache: function (cacheKey, ctx) {

        var defer = vow.defer();

        ctx.track.agent.cache.get(cacheKey, function (err, res) {

            if ( err ) {
                defer.reject(err);

                return;
            }

            defer.resolve(res);
        });

        return defer.promise();
    }

});

module.exports = Unit;
