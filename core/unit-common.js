'use strict';

var Context = /** @type Context */ require('./context');
var LRUDictTtlAsync = /** @type LRUDictTtlAsync */ require('./cache/lru-dict-ttl-async');

var _ = require('lodash-node');
var inherit = require('inherit');
var vow = require('vow');

/**
 * Common Fist Unit interface
 *
 * @class UnitCommon
 * */
var UnitCommon = inherit(Object, /** @lends UnitCommon.prototype */ {

    /**
     * @private
     * @memberOf {UnitCommon}
     * @method
     *
     * @constructs
     * */
    __constructor: function () {

        /**
         * @public
         * @memberOf {UnitCommon}
         * @property
         * @type {Object}
         * */
        this.params = _.extend({}, this.params);
    },

    /**
     * @public
     * @memberOf {UnitCommon}
     * @property
     * @type {String}
     * */
    name: '_fist_contrib_unit_common',

    /**
     * @public
     * @memberOf {UnitCommon}
     * @property
     * @type {Number}
     * */
    maxAge: 0,

    /**
     * @public
     * @memberOf {UnitCommon}
     * @property
     * @type {Object}
     * */
    params: {},

    /**
     * @public
     * @memberOf {UnitCommon}
     * @method
     *
     * @returns {*}
     * */
    call: function (track, args) {
        var self = this;
        var context;
        var dStartExec = new Date();
        var result;
        var logger = track.logger.bind(self.name);

        logger.debug('Pending...');

        context = self.__self.createContext(logger).setup(self.params, track.params, args);
        result = self._execute(track, context);

        result.done(function () {
            var execTime = new Date() - dStartExec;

            if (track.isFlushed()) {
                logger.note('Skip result in %dms', execTime);
            } else {
                logger.note('Accepted in %dms', execTime);
            }
        }, function (err) {
            var execTime = new Date() - dStartExec;

            if (track.isFlushed()) {
                logger.warn('Skip error in %dms', execTime, err);
            } else {
                logger.warn('Rejected in %dms', execTime, err);
            }
        });

        return result;
    },

    /**
     * @public
     * @memberOf {UnitCommon}
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
     * @public
     * @memberOf {UnitCommon}
     * @method
     *
     * @param {Track} track
     * @param {Context} context
     *
     * @returns {*}
     * */
    getMemKey: function (track, context) {
        /*eslint no-unused-vars: 0*/
        return [this.name, String(context.params)].join(',');
    },

    /**
     * @protected
     * @memberOf {UnitCommon}
     * @method
     *
     * @param {Track} track
     * @param {Context} context
     * */
    _execute: function (track, context) {
        var self = this;
        var memKey = null;
        var defer;
        var logger = context.logger;

        //  if maxAge is not a number,
        //  then the expression will return true
        //  and cache will not be used
        if (!(self.maxAge > 0)) {
            memKey = null;
        } else {
            memKey = self._buildMemKey(track, context);
        }

        if (!memKey) {

            return main(self, track, context).then(function (result) {
                if (track.isFlushed()) {
                    logger.note('The track was flushed during execution');
                    return null;
                }

                return {
                    result: result,
                    memKey: memKey
                };
            });
        }

        defer = vow.defer();

        self.__self.cache.get(memKey, function (err, res) {
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
                    logger.note('The track was flushed during execution');
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
                self.__self.cache.set(memKey, result, self.maxAge, function (err) {
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
    },

    /**
     * @protected
     * @memberOf {UnitCommon}
     * @method
     *
     * @param {Track} track
     * @param {Context} context
     *
     * @returns {*}
     * */
    _buildMemKey: function (track, context) {
        return this.getMemKey(track, context);
    }

}, {

    /**
     * @public
     * @static
     * @memberOf {UnitCommon}
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
     * @static
     * @memberOf {UnitCommon}
     * @method
     *
     * @param {Object} [members]
     * @param {Object} [statics]
     *
     * @returns {Function}
     * */
    inherit: function (members, statics) {
        var mixins = Object(members).mixins;

        if (!mixins) {
            mixins = [];
        }

        return inherit([this].concat(mixins), members, statics);
    },

    /**
     * @public
     * @static
     * @memberOf {UnitCommon}
     * @property
     * @type {LRUDictTtlAsync}
     * */
    cache: new LRUDictTtlAsync(0xffff)

});

function main(self, track, context) {
    return vow.invoke(function () {
        return self.main(track, context);
    });
}

module.exports = UnitCommon;
