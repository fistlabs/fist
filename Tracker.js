'use strict';

var Agent = require('./Agent');
var Ctx = /** @type Ctx */ require('./ctx/Ctx');
var Unit = /** @type Unit */ require('./unit/Unit');

var _ = require('lodash-node');
var inherit = require('inherit');
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

        var ready = this.ready();

        //  -1 possible tick
        if ( ready.isResolved() ) {

            return this.__immediateResolve(track, path, params);
        }

        return ready.then(function () {

            return this.__immediateResolve(track, path, params);
        }, this);
    },

    __immediateResolve: function (track, path, params) {

        if ( !_.has(track.tasks, path) ) {
            track.tasks[path] = this.__resolveUnit(track, path, params);
        }

        return track.tasks[path];
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
        var trackId = track.id;

        defer.promise().done(function (data) {
            this.emit('ctx:accept', {
                trackId: trackId,
                path: path,
                time: new Date() - date,
                data: data
            });
        }, function (data) {
            this.emit('ctx:reject', {
                trackId: trackId,
                path: path,
                time: new Date() - date,
                data: data
            });
        }, function (data) {
            this.emit('ctx:notify', {
                trackId: trackId,
                path: path,
                time: new Date() - date,
                data: data
            });
        }, this);

        this.emit('ctx:pending', {
            trackId: trackId,
            path: path,
            time: 0
        });

        if ( _.isUndefined(unit) ) {
            defer.reject();

            return defer.promise();
        }

        deps = unit.deps;

        if ( _.isUndefined(deps) || _.isNull(deps) ) {
            deps = [];

        } else if ( !_.isArray(deps) ) {
            deps = [deps];
        }

        //  avoid possible tick
        if ( 0 === deps.length ) {
            defer.resolve(unit.getValue(track, defer));

            return defer.promise();
        }

        deps = _.map(deps, function (path) {
            var promise = this.resolve(track, path, params);

            promise.always(function (promise) {

                if ( promise.isRejected() ) {
                    defer.setErr(path, promise.valueOf());

                } else {
                    defer.setRes(path, promise.valueOf());
                }
            });

            return promise;
        }, this);

        vow.allResolved(deps).done(function () {
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
