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
        this.units = {};
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

        if ( !_.has(track.tasks, path) ) {

            track.tasks[path] = this.__resolveCtx(track, path, params);
        }

        return track.tasks[path].promise();
    },

    /**
     * @public
     * @memberOf {Tracker}
     * @method
     *
     * @param {Object} members
     *
     * @returns {Tracker}
     *
     * @throws {ReferenceError}
     * */
    unit: function (members) {

        var unit = this._createUnit(members);
        var path = unit.path;

        if ( this.__checkDeps(path, unit) ) {
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
     * @param {Track} track
     * @param {Object} unit
     * @param {Context} ctxt
     * */
    _call: function (track, unit, ctxt) {

        if ( _.isFunction(unit.data) ) {
            ctxt.resolve(vow.invoke(function () {

                return unit.data(track, ctxt);
            }));

            return;
        }

        ctxt.resolve(unit.data);
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
     * @protected
     * @memberOf {Tracker}
     * @method
     *
     * @param {Object} members
     *
     * @returns {Object}
     * */
    _createUnit: function (members) {

        return members;
    },

    /**
     * @private
     * @memberOf {Tracker}
     * @method
     *
     * @param {String} path
     * @param {Object} unit
     *
     * @returns {Boolean}
     * */
    __checkDeps: function (path, unit) {

        if ( _.isUndefined(unit) ) {

            return true;
        }

        return _.every(toArray(unit.deps), function (dep) {

            if ( path === dep ) {

                return false;
            }

            return this.__checkDeps(path, this.units[dep]);
        }, this);
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

        var ctxt = this._createContext(params);
        var date = new Date();
        var unit;

        ctxt.promise().done(function (data) {
            this.emit('ctx:accept', {
                path: path,
                time: new Date() - date,
                data: data
            });
        }, function (data) {
            this.emit('ctx:reject', {
                path: path,
                time: new Date() - date,
                data: data
            });
        }, function (data) {
            this.emit('ctx:notify', {
                path: path,
                time: new Date() - date,
                data: data
            });
        }, this);

        if ( !_.has(this.units, path) ) {
            ctxt.reject();

            return ctxt;
        }

        unit = this.units[path];

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
     * @param {Object} unit
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
