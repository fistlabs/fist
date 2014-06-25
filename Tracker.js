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

        /**
         *
         * @protected
         * @memberOf {Tracker}
         * @property
         * @type {Array<Function>}
         * */
        this._plugs = [];
    },

    /**
     * @public
     * @memberOf {Tracker}
     * @method
     * */
    plug: function () {
        Array.prototype.push.apply(this._plugs, arguments);
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

            if ( !vow.isPromise(track.tasks[path]) ) {
                track.tasks[path] = this.__resolveUnit(track, path, params);
            }

            return track.tasks[path];
        }, this);
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
     * @protected
     * @memberOf {Tracker}
     * @method
     *
     * @returns {vow.Promise}
     * */
    _getReady: function () {
        var plugins = _.map(this._plugs, this.__invokePlugin, this);

        return vow.all(plugins).then(this.__base, this);
    },

    /**
     * @private
     * @memberOf {Tracker}
     * @method
     *
     * @param {Track} track
     * @param {String} path
     * @param {*} [params]
     * */
    __resolveUnit: function (track, path, params) {

        var date = new Date();
        var defer = this._createCtx(params);
        var deps;
        var unit = this.getUnit(path);

        defer.promise().done(function (data) {
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
            defer.reject();

            return defer.promise();
        }

        deps = _.map(toArray(unit.deps), function (path) {

            var promise = this.resolve(track, path, params);

            promise.done(function (data) {
                defer.setRes(path, data);
            }, function (data) {
                defer.setErr(path, data);
            });

            return promise;
        }, this);

        deps = vow.allResolved(deps);

        deps.done(function () {
            defer.resolve(unit.getValue(track, defer));
        });

        return defer.promise();
    },

    /**
     * @private
     * @memberOf {Tracker}
     * @method
     *
     * @param {Function} plug
     *
     * @returns {vow.Promise}
     * */
    __invokePlugin: function (plug) {

        return vow.invoke(this.__wrapPlugin(plug));
    },

    /**
     * @private
     * @memberOf {Tracker}
     * @method
     *
     * @param {Function} plug
     *
     * @returns {Function}
     * */
    __wrapPlugin: function (plug) {

        var self = this;

        return function () {

            var defer = vow.defer();

            plug.call(self, function (err) {

                if ( 0 === arguments.length ) {
                    defer.resolve();

                    return;
                }

                defer.reject(err);
            });

            return defer.promise();
        };
    }

});

module.exports = Tracker;
