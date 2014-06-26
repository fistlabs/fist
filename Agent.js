'use strict';

var BaseUnit = require('./unit/Unit');
var EventEmitter = require('events').EventEmitter;

var _ = require('lodash-node');
var inherit = require('inherit');
var vow = require('vow');

/**
 * @class Agent
 * @extends EventEmitter
 * */
var Agent = inherit(EventEmitter, /** @lends Agent.prototype */ {

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

        /**
         * @public
         * @memberOf {Agent}
         * @property
         * @type {Array}
         * */
        this.decls = [];

        /**
         * @public
         * @memberOf {Agent}
         * @property
         * @type {Object}
         * */
        this.params = _.extend({}, this.params, params);

        /**
         * @public
         * @memberOf {Agent}
         * @property
         * @type {Object}
         * */
        this.units = {};
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

        return (this.units[path] || [])[1];
    },

    /**
     * @public
     * @memberOf {Agent}
     * @method
     *
     * @param {Object} members
     *
     * @returns {Agent}
     * */
    unit: function (members) {

        var statics = void 0;

        if ( _.isArray(members) ) {
            statics = members[1];
            members = members[0];
        }

        this.decls.push([Object(members), statics, this.params]);

        return this;
    },

    /**
     * @public
     * @memberOf {Agent}
     * @method
     *
     * @param {Boolean} [force]
     *
     * @returns {vow.Promise}
     * */
    ready: function (force) {

        if ( this._fistReady && !force ) {

            return this._fistReady;
        }

        this._fistReady = this._getReady();

        this._fistReady.done(function () {
            this.emit('sys:ready');
        }, function (err) {
            this.emit('sys:eready', err);
        }, this);

        return this._fistReady;
    },

    /**
     * @protected
     * @memberOf {Agent}
     * @method
     *
     * @returns {vow.Promise}
     * */
    _getReady: function () {

        var defer = vow.defer();

        defer.promise().then(function (units) {
            this.units = units;
        }, this);

        try {
            defer.resolve(createUnits(this.decls));

        } catch (err) {
            defer.reject(err);
        }

        return defer.promise();
    }

});

/**
 * @private
 * @static
 * @memberOf Agent
 * @method
 *
 * @param {Array} decls
 * @param {Object} units
 *
 * @returns {Array}
 * */
function addUnits (decls, units) {

    return _.reduce(decls, function (decls, decl) {

        var Base;
        var Unit;
        var members = Object(decl[0]);
        var unit;

        //  Если не передали base, то сами добьем
        if ( !_.has(members, 'base') ) {
            members.base = BaseUnit;
        }

        Base = members.base;

        if ( _.isFunction(Base) ||
            _.has(units, Base) && (Base = units[Base][0]) ) {

            Unit = inherit(Base, members, decl[1]);
            unit = new Unit(decl[2]);
            units[unit.path] = [Unit, unit];

            return decls;
        }

        decls.push(decl);

        return decls;
    }, []);
}

function findAllConflicts (units) {

    var found4 = {};

    return _.reduce(units, function (conflicts, unit, path) {

        return conflicts.concat(findConflicts(path, units, [], found4));
    }, []);
}

function findConflicts (part, units, path, found4) {

    var decl = units[part];
    var deps;
    var paths = [];

    if ( _.has(found4, part) ) {

        return paths;
    }

    if ( _.isUndefined(decl) ) {

        return paths;
    }

    deps = decl[1].deps;

    if ( !_.size(deps) ) {

        return paths;
    }

    _.forEach(deps, function (dep) {
        var branch = _.clone(path);

        branch.push(dep);

        if ( _.contains(path, dep) ) {
            paths.push(branch);

            return;
        }

        paths = paths.concat(findConflicts(dep, units, branch, found4));
    });

    found4[part] = true;

    return paths;
}

/**
 * @private
 * @static
 * @memberOf Agent
 * @method
 *
 * @param {Array} decls
 *
 * @returns {Object}
 * */
function createUnits (decls) {

    var conflicts;
    var units = {};
    var remaining = decls.length;

    while ( _.size(decls) ) {
        decls = addUnits(decls, units);

        if ( _.size(decls) < remaining ) {
            remaining = decls.length;

            continue;
        }

        throw new ReferenceError('no base unit for: ' +
            _.map(decls, formatBaseConflictDetails).join(', '));
    }

    conflicts = findAllConflicts(units);

    if ( !_.size(conflicts) ) {

        return units;
    }

    throw new ReferenceError('unit dependencies conflict: ' +
        _.map(conflicts, formatDepsConflictDetails).join(', '));
}

/**
 * @private
 * @static
 * @memberOf Agent
 * @method
 *
 * @param {Array} decl
 *
 * @returns {String}
 * */
function formatBaseConflictDetails (decl) {

    return decl[0].path + ' (needs ' + decl[0].base + ')';
}

/**
 * @private
 * @static
 * @memberOf Agent
 * @method
 *
 * @param {Array<String>} path
 *
 * @returns {String}
 * */
function formatDepsConflictDetails (path) {

    return path.join(' < ');
}

module.exports = Agent;
