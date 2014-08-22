'use strict';

var BaseConflictError = require('./error/base-conflict-error');
var DepsConflictError = require('./error/deps-conflict-error');
var R_PUBLIC_UNIT = /^[a-z]/i;

var Cache = /** @type Cache */ require('./cache/cache');
var Channel = /** @type Channel */ require('./channel');
var Unit = /** @type Unit */ require('./unit');

var _ = require('lodash-node');
var inherit = require('inherit');
var uniqueId = require('unique-id');
var vow = require('vow');

/**
 * @class Agent
 * @extends Channel
 * */
var Agent = inherit(Channel, /** @lends Agent.prototype */ {

    /**
     * @private
     * @memberOf {Agent}
     * @method
     *
     * @constructs
     *
     * @param {Object} [params]
     * */
    __constructor: function (params) {
        this.__base();

        params = _.extend({cwd: process.cwd()}, this.params, params);

        /**
         * @public
         * @memberOf {Agent}
         * @property
         * @type {Object}
         * */
        this.params = params;

        /**
         * @public
         * @memberOf {Agent}
         * @property
         * @type {Cache}
         * */
        this.cache = this._createCache(this.params.cache);

        /**
         * @public
         * @memberOf {Agent}
         * @property
         * @type {Object}
         * */
        this.units = {};

        /**
         * @private
         * @memberOf {Agent}
         * @property
         * @type {Array}
         * */
        this.__decls = [];
    },

    /**
     * @public
     * @memberOf {Agent}
     * @method
     *
     * @param {String} [base]
     * @param {Object|String} path
     *
     * @returns {Agent}
     * */
    alias: function (base, path) {

        if ( _.isObject(base) ) {
            _.forOwn(base, function (path, base) {
                this.unit({
                    base: base,
                    path: path
                });
            }, this);

            return this;
        }

        this.unit({
            base: base,
            path: path
        });

        return this;
    },

    /**
     * @public
     * @memberOf {Agent}
     * @method
     *
     * @param {String} path
     *
     * @returns {Unit}
     * */
    getUnit: function (path) {

        return this.units[path];
    },

    /**
     * @public
     * @memberOf {Agent}
     * @method
     *
     * @param {Object} members
     * @param {Object} [statics]
     *
     * @returns {Agent}
     * */
    unit: function (members, statics) {
        members = Object(members);

        if ( !_.has(members, 'path') ) {
            members.path = 'unit-' + uniqueId();
        }

        _.remove(this.__decls, function (decl) {

            return decl.members.path === members.path;
        });

        this.__decls.push({
            members: members,
            statics: statics
        });

        return this;
    },

    /**
     * @public
     * @memberOf {Agent}
     * @method
     *
     * @returns {vow.Promise}
     * */
    ready: function () {
        var sys = this.channel('sys');

        if ( this.__ready ) {

            return this.__ready;
        }

        sys.emit('pending');

        this.__ready = this._getReady();

        this.__ready.then(function () {
            sys.emit('ready');
        }, function (err) {
            sys.emit('eready', err);
        });

        return this.__ready;
    },

    /**
     * @protected
     * @memberOf {Agent}
     * @method
     *
     * @param {Object} params
     *
     * @returns {Cache}
     * */
    _createCache: function (params) {

        return new Cache(params);
    },

    /**
     * @protected
     * @memberOf {Agent}
     * @method
     *
     * @returns {vow.Promise}
     * */
    _getReady: function () {
        var createUnits = _.bind(this.__instUnits, this);

        return vow.invoke(createUnits).
            then(function (units) {
                var paths = Agent.__findDepsConflicts(units);

                if ( _.size(paths) ) {

                    throw new DepsConflictError(paths);
                }

                this.units = units;
            }, this);
    },

    /**
     * @private
     * @memberOf {Agent}
     * @method
     *
     * @returns {Object<Unit>}
     * */
    __instUnits: function () {
        var units = Agent.__transform(this.__decls);

        return _.reduce(units, function (units, Unit) {
            var path = Unit.prototype.path;

            if ( R_PUBLIC_UNIT.test(path) ) {
                units[path] = this._instUnit(Unit);
            }

            return units;
        }, {}, this);
    },

    /**
     * @protected
     * @memberOf {Agent}
     * @method
     *
     * @param {Function} Unit
     *
     * @returns {Unit}
     * */
    _instUnit: function (Unit) {

        return new Unit(this.params);
    }

}, {

    /**
     * @private
     * @static
     * @memberOf Agent
     * @method
     *
     * @param {Array<Object>} decls
     *
     * @returns {Object<Function>}
     * */
    __transform: function (decls) {
        var Base;
        var classes = [Unit];
        var count;
        var decl;
        var i;
        var l;
        var remaining = _.size(decls);

        function findBase (decl) {
            var base = decl.members.base;

            if ( Agent.__isFalsy(base) ) {
                base = Unit.prototype.path;
            }

            return _.find(classes, function (Class) {

                if ( _.isFunction(Class) ) {

                    return Class.prototype.path === base;
                }

                return false;
            });
        }

        function getUnitMixes (decl) {
            var mixes = decl.members.mix;

            if ( Agent.__isFalsy(mixes) ) {

                return [];
            }

            if ( _.isArray(mixes) ) {

                return mixes;
            }

            return [mixes];
        }

        decls = _.clone(decls);

        while ( remaining ) {

            for ( i = 0, l = decls.length; i < l; i += 1 ) {
                decl = decls[i];

                if ( !decl ) {

                    continue;
                }

                Base = findBase(decl);

                if ( !_.isFunction(Base) ) {

                    continue;
                }

                Base = [Base].concat(getUnitMixes(decl));
                classes[i + 1] = inherit(Base, decl.members, decl.statics);

                delete decls[i];
            }

            count = Agent.__count(decls);

            if ( count < remaining ) {
                remaining = count;

                continue;
            }

            throw new BaseConflictError(decls);
        }

        return classes;
    },

    /**
     * @private
     * @static
     * @memberOf Agent
     * @method
     *
     * @param {Object} units
     *
     * @returns {Array}
     * */
    __findDepsConflicts: function (units) {
        var found = {};

        return _.reduce(units, function (paths, unit, path) {
            var confs = Agent.__findConflictedPaths(path, units, [], found);

            return paths.concat(confs);
        }, []);
    },

    /**
     * @private
     * @static
     * @memberOf Agent
     * @method
     *
     * @param {String} path
     * @param {Object} units
     * @param {Array} trunk
     * @param {Object} found
     *
     * @returns {Array}
     * */
    __findConflictedPaths: function (path, units, trunk, found) {
        var deps;
        var unit;
        var paths = [];

        if ( _.has(found, path) ) {

            return paths;
        }

        unit = units[path];

        if ( _.isUndefined(unit) ) {

            return paths;
        }

        deps = unit.deps;

        if ( !_.size(deps) ) {

            return paths;
        }

        paths = _.reduce(deps, function (paths, path) {
            var confs;
            var branch = _.clone(trunk);

            branch.push(path);

            if ( _.contains(trunk, path) ) {
                paths.push(branch);

                return paths;
            }

            confs = Agent.__findConflictedPaths(path, units, branch, found);

            return paths.concat(confs);
        }, paths);

        found[path] = true;

        return paths;
    },

    /**
     * @private
     * @static
     * @memberOf {Agent}
     *
     * @param {*} items
     *
     * @returns {Number}
     * */
    __count: function (items) {

        return _.reduce(items, function (count, v) {

            if ( v ) {

                return count + 1;
            }

            return count;
        }, 0);
    },

    /**
     * @private
     * @static
     * @memberOf {Agent}
     *
     * @param {*} v
     *
     * @returns {Boolean}
     * */
    __isFalsy: function (v) {

        return _.isUndefined(v) || _.isNull(v) || '' === v;
    }

});

module.exports = Agent;
