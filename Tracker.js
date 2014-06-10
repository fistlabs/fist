'use strict';

var Context = /** @type Context */ require('./context/Context');
var EventEmitter = /** @type EventEmitter */ require('events').EventEmitter;
var Unit = /** @type Unit */ require('./unit/Unit');

var _ = require('lodash-node');
var inherit = require('inherit');
var toArray = require('fist.lang.toarray');
var vow = require('vow');

/**
 * @abstract
 * @class Tracker
 * @extends EventEmitter
 * */
var Tracker = inherit(EventEmitter, /** @lends Tracker.prototype */ {

    /**
     * @private
     * @memberOf {Tracker}
     * @method
     *
     * @constructs
     * */
    __constructor: function (params) {
        this.__base();

        /**
         * @public
         * @memberOf {Tracker}
         * @property
         * @type {Object}
         * */
        this.decls = {};

        /**
         * @private
         * @memberOf {Tracker}
         * @property
         * @type {Object}
         * */
        this.__bases = {};

        /**
         * @public
         * @memberOf {Tracker}
         * @property
         * @type {Object}
         * */
        this.params = _.extend({}, this.params, params);
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
        var decl = {
            orig: members,
            unit: unit,
            Unit: Class
        };

        if ( this.__checkDeps(path, decl) ) {
            this.decls[path] = decl;

            //  Если уже кто-то унаследовал от этого узла, хотя его еще не было
            //  то надо снова унаследовать
            if ( _.has(this.__bases, path) ) {
                this.unit(this.decls[this.__bases[path]].orig);
            }

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
                this.__bases[Base] = members.path;

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
