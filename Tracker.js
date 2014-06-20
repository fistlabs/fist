'use strict';

var Agent = require('./Agent');
var Context = /** @type Context */ require('./context/Context');
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
     * @param {Context} ctxt
     * */
    _call: function (track, unit, ctxt) {

        var result;

        if ( _.isFunction(unit.data) ) {

            try {
                result = unit.data(track, ctxt);

                if ( ctxt.promise() === result ) {

                    return;
                }

                ctxt.resolve(result);

            } catch (err) {
                ctxt.reject(err);
            }

            return;
        }

        ctxt.resolve(unit.data);
    },

    /**
     * @protected
     * @memberOf {Tracker}
     * @method
     *
     * @param {Object} params
     *
     * @returns {Context}
     * */
    _createCtx: function (params) {

        return new Context(params);
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
     * @returns {Context}
     * */
    __resolveCtx: function (track, path, params) {

        var date = new Date();
        var ctxt = this._createCtx(params);
        var unit = this.getUnit(path);

        ctxt.promise().done(function (data) {
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
            ctxt.reject();

            return ctxt;
        }

        this.__resolveDeps(track, unit, ctxt).
            then(function () {
                this._call(track, unit, ctxt);
            }, this);

        return ctxt;
    },

    /**
     * @private
     * @memberOf {Tracker}
     * @method
     *
     * @param {Track} track
     * @param {Unit} unit
     * @param {Context} ctxt
     *
     * @returns {vow.Promise}
     * */
    __resolveDeps: function (track, unit, ctxt) {

        var deps = _.map(toArray(unit.deps), function (path) {

            var promise = this.resolve(track, path);

            promise.done(function (data) {
                ctxt.setResult(path, data);
            }, function (data) {
                ctxt.setError(path, data);
            });

            return promise;
        }, this);

        return vow.allResolved(deps);
    }

});

module.exports = Tracker;
