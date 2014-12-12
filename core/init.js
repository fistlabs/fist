'use strict';

var LRUDictTtlAsync = /** @type LRUDictTtlAsync */ require('./cache/lru-dict-ttl-async');

var _ = require('lodash-node');
var create = require('./util/create');
var hasProperty = Object.prototype.hasOwnProperty;
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
         * @param {Object} track
         * @param {Function} done
         *
         * @returns {*}
         * */
        call: function (track, done) {
            var dStartExec = new Date();
            var result;
            var logger = track.logger;

            logger.debug('Pending...');

            this._fetch(track, function (err, res) {
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
         *
         * @returns {*}
         * */
        hashArgs: function (track) {
            /*eslint no-unused-vars: 0*/
            return '';
        },

        /**
         * @public
         * @memberOf {Unit}
         * @method
         *
         * @param {Object} track
         * @param {*} [args]
         *
         * @returns {Object}
         * */
        createContext: function (track, args) {
            var i;
            var k;
            var l;
            var context = create(track);

            args = [this.params, track.params, args];
            context.track = track;

            context.logger = track.logger.bind(this.name);
            context.params = {};

            for (i = 0, l = args.length; i < l; i += 1) {
                for (k in args[i]) {
                    if (hasProperty.call(args[i], k)) {
                        context.params[k] = args[i][k];
                    }
                }
            }

            return context;
        },

        /**
         * @public
         * @memberOf {Unit}
         * @method
         *
         * @param {Track} track
         *
         * @returns {*}
         * */
        main: /* istanbul ignore next */ function (track) {
            /*eslint no-unused-vars: 0*/
        },

        /**
         * @protected
         * @memberOf {Unit}
         * @method
         *
         * @param {Track} track
         *
         * @returns {*}
         * */
        _buildTag: function (track) {
            return this.name + '-' + this.hashArgs(track);
        },

        /**
         * @protected
         * @memberOf {Unit}
         * @method
         *
         * @param {Track} track
         * @param {Function} done
         * */
        _fetch: function (track, done) {
            var self = this;
            var memKey = self._buildTag(track);
            var logger = track.logger;

            if (!memKey || !(self.maxAge > 0)) {
                main(self, track, function (err, res) {
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
                main(self, track, function (err, res) {
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

function main(self, track, done) {
    var res;

    try {
        res = self.main(track);
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
