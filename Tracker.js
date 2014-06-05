'use strict';

var Context = /** @type Context */ require('./context/Context');
var Class = /** @type Class */ require('parent/Class');
var Emitter = /** @type EventEmitter */ require('events').EventEmitter;

var _ = /** @type _ */ require('lodash-node');
var toArray = require('fist.lang.toarray');
var vow = require('vow');

/**
 * @abstract
 * @class Tracker
 * @extends EventEmitter
 * @extends Class
 * */
var Tracker = Class.extend.call(Emitter, /** @lends Tracker.prototype */ {

    /**
     * @protected
     * @memberOf {Tracker}
     * @method
     *
     * @constructs
     * */
    constructor: function () {
        Class.apply(this, arguments);
        Tracker.Parent.apply(this, arguments);

        /**
         * @public
         * @memberOf {Tracker}
         * @property
         * @type {Object}
         * */
        this.units = Object.create(null);
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

        var ctx;

        if ( _.has(track.tasks, path) ) {

            return track.tasks[path].promise();
        }

        ctx = track.tasks[path] = this._createContext(params);

        ctx.promise().done(function (data) {
            this.emit('ctx:accept', {
                path: path,
                time: ctx.getDuration(),
                data: data
            });
        }, function (data) {
            this.emit('ctx:reject', {
                path: path,
                time: ctx.getDuration(),
                data: data
            });
        }, function (data) {
            this.emit('ctx:notify', {
                path: path,
                time: ctx.getDuration(),
                data: data
            });
        }, this);

        if ( path in this.units ) {

            return this._resolveUnit(track, this.units[path], ctx);
        }

        ctx.reject();

        return ctx.promise();
    },

    /**
     * @public
     * @memberOf {Tracker}
     * @method
     *
     * @param {Object} unit
     * @param {String} unit.path
     *
     * @returns {Tracker}
     *
     * @throws {ReferenceError}
     * */
    unit: function (unit) {

        var path = unit.path;

        if ( this._checkDeps(path, unit) ) {
            this.units[path] = unit;

            return this;
        }

        throw new ReferenceError(path);
    },

    /**
     * @protected
     * @memberOf {Tracker}
     * @method
     *
     * @param {Object} unit
     * @param {Track} track
     * @param {Context} ctx
     *
     * @returns {vow.Promise}
     * */
    _call: function (unit, track, ctx) {

        var promise = unit.data;

        if ( _.isFunction(promise) ) {
            promise = vow.invoke(function () {

                return unit.data(track, ctx);
            });
        }

        ctx.resolve(promise);

        return ctx.promise();
    },

    /**
     * @protected
     * @memberOf {Tracker}
     * @method
     *
     * @param {String} path
     * @param {Object} unit
     *
     * @returns {Boolean}
     * */
    _checkDeps: function (path, unit) {

        if ( _.isUndefined(unit) ) {

            return true;
        }

        return _.every(toArray(unit.deps), function (dep) {

            if ( path === dep ) {

                return false;
            }

            return this._checkDeps(path, this.units[dep]);
        }, this);
    },

    /**
     * @protected
     * @memberOf {Tracker}
     * @method
     *
     * @param {*} params
     *
     * @returns {Context}
     * */
    _createContext: function (params) {

        return new Context(params);
    },

    /**
     * @private
     * @memberOf {Tracker}
     * @method
     *
     * @param {Track} track
     * @param {Object} unit
     * @param {Context} cxt
     *
     * @returns {vow.Promise}
     * */
    _resolveUnit: function (track, unit, cxt) {

        var deps = toArray(unit.deps);

        deps = _.map(deps, function (path) {

            var promise = this.resolve(track, path);

            promise.done(function (data) {
                cxt.setResult(path, data);
            }, function (data) {
                cxt.setError(path, data);
            });

            return promise;
        }, this);

        return vow.allResolved(deps).then(function () {

            return this._call(unit, track, cxt);
        }, this);
    }

});

module.exports = Tracker;
