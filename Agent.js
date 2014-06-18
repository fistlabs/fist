'use strict';

var BaseUnit = require('./unit/Unit');
var EventEmitter = require('events').EventEmitter;

var _ = require('lodash-node');
var inherit = require('inherit');
var toArray = require('fist.lang.toarray');
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
     * @param {String} path
     *
     * @returns {Unit}
     * */
    getUnit: function (path) {

        return (this.units[path] || [])[1];
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

/**
 * @private
 * @static
 * @memberOf Agent
 * @param {Object} units
 *
 * @returns {Object}
 * */
function checkDeps (units) {

    return _.every(units, function checkDeps (unit, path) {

        if ( _.isUndefined(unit) ) {

            return true;
        }

        unit = unit[1];

        return _.every(toArray(unit.deps), function (name) {

            if ( path === name ) {

                return false;
            }

            return checkDeps(units[name], path);
        }, this);
    });
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

    var units = {};
    var remaining = decls.length;

    do {

        if ( _.isEmpty(decls) ) {

            break;
        }

        decls = addUnits(decls, units);

        if ( _.size(decls) < remaining ) {
            remaining = decls.length;

            continue;
        }

        throw new ReferenceError('There is no base unit for: %s!',
            _.map(decls, getDeclPath).join(', '));

    } while (true);

    if ( checkDeps(units) ) {

        return units;
    }

    //  TODO better error message (a>b>c>a)
    throw new ReferenceError('Recursive dependencies detected');
}

/**
 * @private
 * @static
 * @memberOf Agent
 * @method
 *
 * @param {Array} decl
 *
 * @returns {*}
 * */
function getDeclPath (decl) {

    return decl[0].path;
}

module.exports = Agent;
