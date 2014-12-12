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
    agent.caches = {

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

        /**
         * @protected
         * @memberOf {Unit}
         * @method
         * @property
         * */
        this._cache = agent.caches[this.cache];
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
         * @param {Function} done
         *
         * @returns {*}
         * */
        call: function (track, context, done) {
            var dStartExec = new Date();
            var result;
            var logger = context.logger;

            logger.debug('Pending...');

            this._fetch(track, context, function (err, res) {
                var execTime = new Date() - dStartExec;

                if (arguments.length < 2) {
                    if (track.isFlushed()) {
                        logger.warn('Skip error in %dms', execTime, err);
                    } else {
                        logger.error('Rejected in %dms', execTime, err);
                    }

                    done(err);
                    return;
                }

                if (track.isFlushed()) {
                    logger.debug('Skip result in %dms', execTime);
                } else {
                    logger.debug('Accepted in %dms', execTime);
                }

                done(null, res);
            });
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
         * @param {Function} done
         * */
        _fetch: function (track, context, done) {
            var self = this;
            var memKey = self._buildTag(track, context);
            var logger = context.logger;

            if (!memKey || !(self.maxAge > 0)) {
                main(self, track, context, function (err, res) {
                    if (arguments.length < 2) {
                        done(err);
                        return;
                    }

                    if (track.isFlushed()) {
                        logger.debug('The track was flushed during execution');
                        done(null, null);
                        return;
                    }

                    done(null, {
                        result: res,
                        memKey: memKey
                    });
                });
                return;
            }

            self._cache.get(memKey, function (err, res) {
                //  has value in cache
                if (res) {
                    logger.debug('Found in cache');

                    done(null, {
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
                main(self, track, context, function (err, res) {
                    if (arguments.length < 2) {
                        done(err);
                        return;
                    }

                    if (track.isFlushed()) {
                        logger.debug('The track was flushed during execution');
                        done(null, null);
                        return;
                    }

                    //  Try to set cache
                    self._cache.set(memKey, {data: res}, self.maxAge, function (err) {
                        if (err) {
                            logger.warn('Failed to set cache', err);
                        } else {
                            logger.note('Updated');
                        }
                    });

                    done(null, {
                        result: res,
                        memKey: memKey
                    });
                });
            });
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

function main(self, track, context, done) {
    var res;

    try {
        res = self.main(track, context);
    } catch (err) {
        if (vow.isPromise(err)) {
            vow.reject(err).fail(done);
            return;
        }

        done(err);
        return;
    }

    if (vow.isPromise(res)) {
        vow.resolve(res).then(function (res) {
            done(null, res);
        }, done);
        return;
    }

    done(null, res);
}

module.exports = init;
