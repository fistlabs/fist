'use strict';

var Context = /** @type Context */ require('./context');
var LRUDictTtlAsync = /** @type LRUDictTtlAsync */ require('./cache/lru-dict-ttl-async');

var _ = require('lodash-node');
var inherit = require('inherit');
var vow = require('vow');

function init(agent) {
    /*eslint max-params: 0*/

    /**
     * @public
     * @memberOf agent
     * @property
     * @type {Object}
     * */
    var caches = agent.caches = {

        /**
         * default cache interface "local"
         *
         * @public
         * @memberOf agent.caches
         * @property
         * @type {LRUDictTtlAsync}
         * */
        local: new LRUDictTtlAsync(0xffff)
    };

    function setCache(cache, k, v, ttl, done) {
        return caches[cache].set(k, v, ttl, done);
    }

    function getCache(cache, k, done) {
        return caches[cache].get(k, done);
    }

    /**
     * Common Fist Unit interface
     *
     * @class Unit
     * */
    function Unit() {

        /**
         * @public
         * @memberOf {Unit}
         * @property
         * @type {Object}
         * */
        this.params = _.extend({}, this.params);
    }

    Unit.prototype = {

        /**
         * @public
         * @memberOf {Unit}
         * @method
         *
         * @constructs
         * */
        constructor: Unit,

        /**
         * @public
         * @memberOf {Unit}
         * @property
         * */
        name: 0,

        /**
         * @public
         * @memberOf {Unit}
         * @property
         * @type {String}
         * */
        cache: 'local',

        /**
         * @public
         * @memberOf {Unit}
         * @property
         * @type {Number}
         * */
        maxAge: 0,

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
         *
         * @param {Track} track
         * @param {Context} context
         *
         * @returns {*}
         * */
        call: function (track, context) {
            var dStartExec = new Date();
            var result;
            var logger = context.logger;

            logger.debug('Pending...');
            result = this._fetch(track, context);

            result.done(function () {
                var execTime = new Date() - dStartExec;

                if (track.isFlushed()) {
                    logger.debug('Skip result in %dms', execTime);
                } else {
                    logger.debug('Accepted in %dms', execTime);
                }
            }, function (err) {
                var execTime = new Date() - dStartExec;

                if (track.isFlushed()) {
                    logger.warn('Skip error in %dms', execTime, err);
                } else {
                    logger.error('Rejected in %dms', execTime, err);
                }
            });

            return result;
        },

        /**
         * @public
         * @memberOf {Unit}
         * @method
         *
         * @param {Track} track
         * @param {Context} context
         *
         * @returns {*}
         * */
        hashArgs: function (track, context) {
            /*eslint no-unused-vars: 0*/
            return '';
        },

        /**
         * @public
         * @memberOf {Unit}
         * @method
         *
         * @param {Logger} logger
         *
         * @returns {Context}
         * */
        createContext: function (logger) {
            return new Context(logger);
        },

        /**
         * @public
         * @memberOf {Unit}
         * @method
         *
         * @param {Track} track
         * @param {Context} context
         *
         * @returns {*}
         * */
        main: /* istanbul ignore next */ function (track, context) {
            /*eslint no-unused-vars: 0*/
        },

        /**
         * @protected
         * @memberOf {Unit}
         * @method
         *
         * @param {Track} track
         * @param {Context} context
         *
         * @returns {*}
         * */
        _buildTag: function (track, context) {
            return this.name + '-' + this.hashArgs(track, context);
        },

        /**
         * @protected
         * @memberOf {Unit}
         * @method
         *
         * @param {Track} track
         * @param {Context} context
         *
         * @returns {vow.Promise}
         * */
        _fetch: function (track, context) {
            var defer;
            var self = this;
            var memKey = self._buildTag(track, context);
            var logger = context.logger;

            if (!memKey || !(self.maxAge > 0)) {
                return main(self, track, context).then(function (result) {
                    if (track.isFlushed()) {
                        logger.debug('The track was flushed during execution');
                        return null;
                    }

                    return {
                        result: result,
                        memKey: memKey
                    };
                });
            }

            defer = vow.defer();

            getCache(self.cache, memKey, function (err, res) {
                //  has value in cache
                if (res) {
                    logger.debug('Found in cache');

                    defer.resolve({
                        result: res.data,
                        memKey: memKey
                    });

                    return;
                }

                //  error while getting value from cache
                if (err) {
                    logger.warn('Failed to load cache', err);
                } else {
                    logger.note('Outdated');
                }

                //  calling unit
                main(self, track, context).then(function (result) {
                    if (track.isFlushed()) {
                        logger.debug('The track was flushed during execution');
                        defer.resolve(null);
                        return;
                    }

                    //  Use returned value
                    defer.resolve({
                        result: result,
                        memKey: memKey
                    });

                    result = {data: result};

                    //  Try to set cache
                    setCache(self.cache, memKey, result, self.maxAge, function (err) {
                        if (err) {
                            logger.warn('Failed to set cache', err);
                        } else {
                            logger.note('Updated');
                        }
                    });
                }, function (err) {
                    //  Error while calling unit
                    defer.reject(err);
                });
            });

            return defer.promise();
        }
    };

    /**
     * @public
     * @static
     * @memberOf {Unit}
     * @method
     *
     * @param {Object} [members]
     * @param {Object} [statics]
     *
     * @returns {Function}
     * */
    Unit.inherit = function (members, statics) {
        var mixins = Object(members).mixins;

        if (!mixins) {
            mixins = [];
        }

        return inherit([this].concat(mixins), members, statics);
    };

    /**
     * @public
     * @memberOf {Agent}
     * @property
     * @type {Unit}
     * */
    agent.Unit = Unit;
}

function main(self, track, context) {
    return vow.invoke(function () {
        return self.main(track, context);
    });
}

module.exports = init;
