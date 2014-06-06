'use strict';

var Context = /** @type Context */ require('./context/Context');
var Class = /** @type Class */ require('parent/Class');
var Emitter = /** @type EventEmitter */ require('events').EventEmitter;
var Unit = /** @type Unit */ require('./unit/Unit');

var _ = /** @type _ */ require('lodash-node');
var toArray = require('fist.lang.toarray');
var vow = require('vow');
var inherit = require('inherit');

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
        this.decls = {};
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

        var Class = this._createUnitClass(members);
        var unit = new Class(this.params);
        var path = unit.path;
        var decl = {unit: unit, Unit: Class};

        if ( this.__checkDeps(path, decl) ) {
            this.decls[path] = decl;

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
     * @param {Object} members
     *
     * @returns {Object}
     * */
    _createUnitClass: function (members) {

        var Base;

        if ( _.isFunction(members) ) {

            return members;
        }

        members = Object(members);

        if ( _.has(members, 'base') ) {
            Base = members.base;

            if ( !_.isFunction(Base) ) {

                if ( _.has(this.decls, Base) ) {
                    Base = this.decls[Base].Unit;

                } else {
                    Base = Unit;
                }
            }

        } else {
            Base = Unit;
        }

        if ( _.isArray(members) ) {

            return inherit(Base, members[0], members[1]);
        }

        return inherit(Base, members);
    },

    /**
     * @private
     * @memberOf {Tracker}
     * @method
     *
     * @param {String} path
     * @param {Object} decl
     *
     * @returns {Boolean}
     * */
    __checkDeps: function (path, decl) {

        if ( _.isUndefined(decl) ) {

            return true;
        }

        return _.every(toArray(decl.unit.deps), function (dep) {

            if ( path === dep ) {

                return false;
            }

            return this.__checkDeps(path, this.decls[dep]);
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

        var date = new Date();
        var decl = this.decls[path];
        var ctxt;
        var hasUnit = true;

        if ( _.has(this.decls, path) ) {
            ctxt = decl.unit.createCtx(params);

        } else {
            ctxt = new Context(params);
            hasUnit = false;
        }

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

        if ( !hasUnit ) {
            ctxt.reject();

            return ctxt;
        }

        this.__resolveDeps(track, decl.unit, ctxt).
            then(function () {
                this._call(track, decl.unit, ctxt);
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
