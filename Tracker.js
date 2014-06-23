'use strict';

var Agent = require('./Agent');
var Ctx = /** @type Ctx */ require('./ctx/Ctx');
var Unit = /** @type Unit */ require('./unit/Unit');

var _ = require('lodash-node');
var inherit = require('inherit');
var toArray = require('fist.lang.toarray');
var vow = require('vow');

/**
 * @class Tracker
 * @extends Agent
 * */
var Tracker = inherit(Agent, /** @lends Tracker.prototype */ {

    /**
     * @private
     * @memberOf {Tracker}
     * @method
     *
     * @constructs
     *
     * @param {Object} [params]
     * */
    __constructor: function (params) {
        this.__base(params);

        /**
         * @public
         * @memberOf {Tracker}
         * @property
         * @type {Object}
         * */
        this.tasks = {};
    },

    /**
     * Запускает операцию разрешения узла
     *
     * @public
     * @memberOf {Tracker}
     * @method
     *
     * @param {Track} track
     * @param {String} path
     * @param {*} [params]
     *
     * @returns {vow.Promise}
     * */
    resolve: function (track, path, params) {

        return this.ready().then(function () {

            if ( !_.has(track.tasks, path) ) {
                track.tasks[path] = this.__resolveCtx(track, path, params);
            }

            return track.tasks[path].promise();

        }, this);
    },

    /**
     * @protected
     * @memberOf {Tracker}
     * @method
     *
     * @param {Track} track
     * @param {Object} unit
     * @param {Ctx} ctx
     * */
    _call: function (track, unit, ctx) {

        var result;

        if ( _.isFunction(unit.data) ) {

            try {
                result = unit.data(track, ctx);

                if ( ctx.promise() === result ) {

                    return;
                }

                ctx.resolve(result);

            } catch (err) {
                ctx.reject(err);
            }

            return;
        }

        ctx.resolve(unit.data);
    },

    /**
     * @protected
     * @memberOf {Tracker}
     * @method
     *
     * @param {Object} params
     *
     * @returns {Ctx}
     * */
    _createCtx: function (params) {

        return new Ctx(params);
    },

    /**
     * @private
     * @memberOf {Tracker}
     * @method
     *
     * @param {Track} track
     * @param {String} path
     * @param {Object} params
     *
     * @returns {Ctx}
     * */
    __resolveCtx: function (track, path, params) {

        var date = new Date();
        var ctx = this._createCtx(params);
        var unit = this.getUnit(path);

        ctx.promise().done(function (data) {
            this.emit('ctx:accept', {
                trackId: track.id,
                path: path,
                time: new Date() - date,
                data: data
            });
        }, function (data) {
            this.emit('ctx:reject', {
                trackId: track.id,
                path: path,
                time: new Date() - date,
                data: data
            });
        }, function (data) {
            this.emit('ctx:notify', {
                trackId: track.id,
                path: path,
                time: new Date() - date,
                data: data
            });
        }, this);

        this.emit('ctx:pending', {
            trackId: track.id,
            path: path,
            time: 0
        });

        if ( _.isUndefined(unit) ) {
            ctx.reject();

            return ctx;
        }

        this.__resolveDeps(track, unit, ctx).
            then(function () {
                this._call(track, unit, ctx);
            }, this);

        return ctx;
    },

    /**
     * @private
     * @memberOf {Tracker}
     * @method
     *
     * @param {Track} track
     * @param {Unit} unit
     * @param {Ctx} ctx
     *
     * @returns {vow.Promise}
     * */
    __resolveDeps: function (track, unit, ctx) {

        var deps = _.map(toArray(unit.deps), function (path) {

            var promise = this.resolve(track, path);

            promise.done(function (data) {
                ctx.setRes(path, data);
            }, function (data) {
                ctx.setErr(path, data);
            });

            return promise;
        }, this);

        return vow.allResolved(deps);
    }

});

module.exports = Tracker;
