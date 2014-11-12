'use strict';

var R_PUBLIC_UNIT = /^[a-z]/i;

var BaseConflictError = require('./error/base-conflict-error');
var DepsConflictError = require('./error/deps-conflict-error');
var Cache = /** @type Cache */ require('./cache/cache');
var Unit = /** @type Unit */ require('./unit');

var _ = require('lodash-node');
var inherit = require('inherit');
var loggin = require('loggin');
var uniqueId = require('unique-id');
var vow = require('vow');

/**
 * @class Agent
 * */
var Agent = inherit(/** @lends Agent.prototype */ {

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

        /**
         * @public
         * @memberOf {Agent}
         * @property
         * @type {Logger}
         * */
        this.logger = loggin.getLogger(this.params.appName);
    },

    /**
     * @public
     * @memberOf {Agent}
     * @method
     *
     * @param {String} [base]
     * @param {Object|String} name
     *
     * @returns {Agent}
     * */
    alias: function (base, name) {

        if (_.isObject(base)) {
            _.forOwn(base, function (name, base) {
                this.unit({
                    base: base,
                    name: name
                });
            }, this);

            return this;
        }

        this.unit({
            base: base,
            name: name
        });

        return this;
    },

    /**
     * @public
     * @memberOf {Agent}
     * @method
     *
     * @param {String} name
     *
     * @returns {Unit}
     * */
    getUnit: function (name) {

        return this.units[name];
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

        if (!_.has(members, 'name')) {
            members.name = 'unit-' + uniqueId();
        }

        _.remove(this.__decls, function (decl) {

            return decl.members.name === members.name;
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

        if (this.__ready) {

            return this.__ready;
        }

        this.logger.debug('Pending...');

        this.__ready = this._getReady();

        /** @this {Agent} */
        this.__ready.then(function () {
            this.logger.note('Ready.');
        }, function (err) {
            this.logger.fatal('Failed to start application', err);
            throw err;
        }, this);

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
                var names = Agent.__findDepsConflicts(units);

                if (_.size(names)) {

                    throw new DepsConflictError(names);
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
            var name = Unit.prototype.name;

            if (R_PUBLIC_UNIT.test(name)) {
                units[name] = this._instUnit(Unit);
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

        function findBase(decl) {
            var base = decl.members.base;

            if (Agent.__isFalsy(base)) {
                base = Unit.prototype.name;
            }

            return _.find(classes, function (Class) {

                if (_.isFunction(Class)) {

                    return Class.prototype.name === base;
                }

                return false;
            });
        }

        function getUnitMixes(decl) {
            var mixes = decl.members.mix;

            if (Agent.__isFalsy(mixes)) {

                return [];
            }

            if (_.isArray(mixes)) {

                return mixes;
            }

            return [mixes];
        }

        decls = _.clone(decls);

        while (remaining) {

            for (i = 0, l = decls.length; i < l; i += 1) {
                decl = decls[i];

                if (!decl) {

                    continue;
                }

                Base = findBase(decl);

                if (!_.isFunction(Base)) {

                    continue;
                }

                Base = [Base].concat(getUnitMixes(decl));
                classes[i + 1] = inherit(Base, decl.members, decl.statics);

                delete decls[i];
            }

            count = Agent.__count(decls);

            if (count < remaining) {
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

        return _.reduce(units, function (names, unit, name) {
            var confs = Agent.__findConflictedNames(name, units, [], found);

            return names.concat(confs);
        }, []);
    },

    /**
     * @private
     * @static
     * @memberOf Agent
     * @method
     *
     * @param {String} name
     * @param {Object} units
     * @param {Array} trunk
     * @param {Object} found
     *
     * @returns {Array}
     * */
    __findConflictedNames: function (name, units, trunk, found) {
        var deps;
        var unit;
        var names = [];

        if (_.has(found, name)) {

            return names;
        }

        unit = units[name];

        if (_.isUndefined(unit)) {

            return names;
        }

        deps = unit.deps;

        if (!_.size(deps)) {

            return names;
        }

        names = _.reduce(deps, function (names, name) {
            var confs;
            var branch = _.clone(trunk);

            branch.push(name);

            if (_.contains(trunk, name)) {
                names.push(branch);

                return names;
            }

            confs = Agent.__findConflictedNames(name, units, branch, found);

            return names.concat(confs);
        }, names);

        found[name] = true;

        return names;
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

            if (v) {

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

        return _.isUndefined(v) || _.isNull(v) || v === '';
    }

});

module.exports = Agent;
