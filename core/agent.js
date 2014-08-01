'use strict';

var BaseConflictError = require('./error/base-conflict-error');
var DepsConflictError = require('./error/deps-conflict-error');
var R_ABSTRACT_UNIT = /^[a-z]/i;

var Cache = /** @type Cache */ require('./cache/cache');
var Channel = /** @type Channel */ require('./channel');
var Unit = /** @type Unit */ require('./unit');

var _ = require('lodash-node');
var inherit = require('inherit');
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
         * @type {Object}
         * */
        this.__decls = {};
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
                this.__unit({
                    base: base,
                    path: path
                });
            }, this);

            return this;
        }

        this.__unit({
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
        this.__unit(members, statics);

        return this;
    },

    /**
     * @private
     * @memberOf {Agent}
     * @method
     *
     * @param {Object} members
     * @param {Object} [statics]
     *
     * @returns {Agent}
     * */
    __unit: function (members, statics) {

        this.__decls[members.path] = {
            members: members,
            statics: statics
        };
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

        return _.reduce(units, function (units, Unit, path) {

            if ( R_ABSTRACT_UNIT.test(path) ) {
                units[path] = new Unit(this.params);
            }

            return units;
        }, {}, this);
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
        var classes = {};
        var remaining = _.size(decls);

        classes[Unit.prototype.path] = Unit;

        while ( remaining ) {
            decls = Agent.__transfuse(decls, classes);

            if ( _.size(decls) < remaining ) {
                remaining = _.size(decls);

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
     * @param {Array} decls
     * @param {Object} classes
     *
     * @returns {Array}
     * */
    __transfuse: function (decls, classes) {

        return _.reduce(decls, function (decls, decl, path) {
            var base;
            var members = decl.members;

            if ( _.has(members, 'base') ) {
                base = members.base;

            } else {
                base = Unit.prototype.path;
            }

            //  postpone
            if ( !_.has(classes, base) ) {
                decls[path] = decl;

                return decls;
            }

            if ( _.isUndefined(members.mix) || _.isNull(members.mix) ) {
                base = [base];

            } else if ( !_.isArray(members.mix) ) {
                base = [base, members.mix];

            } else {
                base = [base].concat(members.mix);
            }

            base = [classes[base[0]]].concat(_.rest(base, 1));
            classes[path] = inherit(base, members, decl.statics);

            return decls;
        }, {}, this);
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
    }

});

module.exports = Agent;
