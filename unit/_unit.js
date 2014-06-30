'use strict';

var S_SEPARATOR = '\u0000';
var EventEmitter = require('events').EventEmitter;

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
     * @param {Ctx} deps
     *
     * @returns {*}
     * */
    data: function (track, deps) {
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
     * @param {Track} track
     * @param {Ctx} deps
     *
     * @returns {*}
     * */
    getValue: function (track, deps) {

        if ( 0 >= this._maxAge ) {

            return this.__call(track, deps);
        }

        return this.__getFromCache(this.
            __getCacheKey(track, deps), track, deps);
    },

    /**
     * @protected
     * @memberOf {Unit}
     * @method
     *
     * @param {Track} track
     * @param {Ctx} deps
     *
     * @returns {Array<String>}
     * */
    _getCacheKeyParts: function (track, deps) {
        /*eslint no-unused-vars: 0*/
        return [];
    },

    /**
     * @private
     * @memberOf {Unit}
     * @method
     *
     * @param {Track} track
     * @param {Ctx} deps
     *
     * @returns {*}
     * */
    __call: function (track, deps) {

        var self = this;

        if ( _.isFunction(self.data) ) {

            return vow.invoke(function () {

                return self.data(track, deps);
            });
        }

        return vow.resolve(self.data);
    },

    /**
     * @private
     * @memberOf {Unit}
     * @method
     *
     * @param {Track} track
     * @param {Ctx} deps
     *
     * @returns {String}
     * */
    __getCacheKey: function (track, deps) {

        return this._getCacheKeyParts(track, deps).join(S_SEPARATOR);
    },

    /**
     * @private
     * @memberOf {Unit}
     * @method
     *
     * @param {String} cacheKey
     * @param {Track} track
     * @param {Ctx} deps
     *
     * @returns {vow.Promise}
     * */
    __getFromCache: function (cacheKey, track, deps) {

        var defer = vow.defer();
        var self = this;

        //  пробуем взять значение из кэша...
        track.agent.cache.get(cacheKey, function (err, res) {

            if ( 2 > arguments.length ) {
                //  ошибка доступа к кэшу
                deps.notify(err);

                //  обновим
                return defer.resolve(self.
                    __callAndCache(cacheKey, track, deps));
            }

            //  Нет в кэше такого
            if ( _.isObject(res) ) {

                //  все хорошо, ради этой строчки все было задумано
                return defer.resolve(res.data);
            }

            return defer.resolve(self.__callAndCache(cacheKey, track, deps));
        });

        return defer.promise();
    },

    /**
     * @private
     * @memberOf {Unit}
     * @method
     *
     * @param {String} cacheKey
     * @param {Track} track
     * @param {Ctx} deps
     *
     * @returns {vow.Promise}
     * */
    __callAndCache: function (cacheKey, track, deps) {

        //  или чего-то нет в кэше или ошибка...
        var promise = this.__call(track, deps);

        promise.then(function (data) {
            //  если запрос выполнен успешно то сохраняем в кэш
            track.agent.cache.set(cacheKey, {
                //  Вкладываю в свойтво объекта чтобы понимать есть ключ
                //  в кэше или нет, потому что можно закэшировать undefined
                data: data
            }, this._maxAge, function (err) {
                //  ошибка сохоанения
                if ( 2 > arguments.length ) {
                    deps.notify(err);
                }
            });
        }, this);

        return promise;
    }

});

module.exports = Unit;
