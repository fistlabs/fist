'use strict';

var Runtime = /** @type Runtime */ require('./runtime');
var LRUDictTtlAsync = require('lru-dict/core/lru-dict-ttl-async');

var _ = require('lodash-node');
var f = require('util').format;
var inherit = require('inherit');

// TODO it is not good to overwrite original unit.prototype properties
// TODO prefix compiledProperties with "$" to save original properties

/**
 * @class Unit
 * @param {Core} app
 * */
function Unit(app) {

    /**
     * @public
     * @memberOf {Unit}
     * @property
     * @type {Core}
     * */
    this.app = app;

    /**
     * TODO rename to defaultContextParams?
     *
     * @public
     * @memberOf {Unit}
     * @property
     * @type {Object}
     * */
    this.params = _.extend({}, this.params);

    /**
     * @public
     * @memberOf {Unit}
     * @property
     * @type {Logger}
     * */
    this.logger = this.createLogger();

    /**
     * @public
     * @memberOf {Unit}
     * @property
     * @type {Array<String>}
     * */
    this.deps = this.freezeDepsList();

    /**
     * @public
     * @memberOf {Unit}
     * @property
     * @type {Array<String>}
     * */
    this.depsMap = this.freezeDepsMap();

    /**
     * @public
     * @memberOf {Unit}
     * @property
     * @type {Array<String>}
     * */
    this.depsArgs = this.freezeDepsArgs();

    /**
     * @public
     * @memberOf {Unit}
     * @property
     * @type {Object}
     * */
    this.depsIndex = this.freezeDepsIndex();
}

/**
 * @public
 * @memberOf {Unit}
 * @method
 *
 * @constructs
 * */
Unit.prototype.constructor = Unit;

/**
 * @public
 * @memberOf {Unit}
 * @property
 * @type {String}
 * */
Unit.prototype.name = 0;

/**
 * @public
 * @memberOf {Unit}
 * @property
 * @type {String}
 * */
Unit.prototype.cache = new LRUDictTtlAsync(0xFFFF);

/**
 * @public
 * @memberOf {Unit}
 * @property
 * @type {Number}
 * */
Unit.prototype.maxAge = 0;

/**
 * TODO rename to defaultContextParams ?
 *
 * @public
 * @memberOf {Unit}
 * @property
 * @type {Object}
 * */
Unit.prototype.params = {};

/**
 * TODO rename to params ?
 *
 * @public
 * @memberOf {Unit}
 * @property
 * @type {Object}
 * */
Unit.prototype.settings = {};

/**
 * @public
 * @memberOf {Unit}
 * @property
 * @type {Object}
 * */
Unit.prototype.depsArgs = {};

/**
 * @public
 * @memberOf {Unit}
 * @property
 * @type {Object}
 * */
Unit.prototype.depsMap = {};

/**
 * @public
 * @memberOf {Unit}
 * @property
 * @type {Array}
 * */
Unit.prototype.deps = [];

/**
 * @public
 * @memberOf {Unit}
 * @method
 *
 * @param {Object} track
 * @param {Object} context
 *
 * @returns {*}
 * */
Unit.prototype.identify = function _$Unit$prototype$identify(track, context) {
    /*eslint no-unused-vars: 0*/
    return 'static';
};

/**
 * Noop by default
 *
 * @public
 * @memberOf {Unit}
 * @method
 *
 * @param {Object} track
 * @param {Object} context
 *
 * @returns {*}
 * */
Unit.prototype.main = Function.prototype;

/**
 * @public
 * @memberOf {Unit}
 * @method
 *
 * @param {Track} track
 * @param {Object} args
 * @param {Function} done
 * */
Unit.prototype.run = function $Unit$prototype$run(track, args, done) {
    Runtime.startRun(this, track, args, done);
};

/**
 * @public
 * @static
 * @memberOf {Unit}
 * @method
 *
 * @param {Object} [members]
 * @param {Object} [statics]
 *
 * @returns {Function}
 * */
Unit.inherit = function (members, statics) {
    var deps = this.prototype.deps;
    var mixins = [];

    members = Object(members);

    if (members.deps) {
        // inherit parent's deps
        deps = deps.concat(members.deps);
    }

    if (members.mixins) {
        mixins = mixins.concat(members.mixins);
    }

    // inherit mixins deps
    members.deps = _.reduce(mixins, function (fullDeps, Mixin) {
        if (Mixin.prototype.deps) {
            fullDeps = fullDeps.concat(Mixin.prototype.deps);
        }

        return fullDeps;
    }, deps);

    // inherit parent's settings
    members.settings = _.extend({}, this.prototype.settings, members.settings);
    // inherit parent's depsMap
    members.depsMap = _.extend({}, this.prototype.depsMap, members.depsMap);
    // inherit parent's depsArgs
    members.depsArgs = _.extend({}, this.prototype.depsArgs, members.depsArgs);

    return inherit([this].concat(mixins), members, statics);
};

/**
 * @public
 * @memberOf {Unit}
 * @method
 *
 * @returns {Logger}
 * */
Unit.prototype.createLogger = function () {
    return this.app.logger.bind(this.name);
};

/**
 * @public
 * @memberOf {Unit}
 * @method
 *
 * @returns {Object}
 * */
Unit.prototype.freezeDepsList = function () {
    return Object.freeze(_.uniq(this.deps));
};

/**
 * @public
 * @memberOf {Unit}
 * @method
 *
 * @returns {Object}
 * */
Unit.prototype.freezeDepsMap = function () {
    var depsMap = {};

    _.forEach(this.deps, function (name) {
        if (_.has(this.depsMap, name)) {
            depsMap[name] = this.depsMap[name];
        } else {
            depsMap[name] = name;
        }
    }, this);

    return Object.freeze(depsMap);
};

/**
 * @public
 * @memberOf {Unit}
 * @method
 *
 * @returns {Object}
 * */
Unit.prototype.freezeDepsArgs = function () {
    var depsArgs = {};

    _.forEach(this.deps, function (name) {
        var args = this.depsArgs[name];
        if (_.isFunction(args)) {
            depsArgs[name] = args.bind(this);
        } else {
            depsArgs[name] = function () {
                return args;
            };
        }
    }, this);

    return Object.freeze(depsArgs);
};

/**
 * @public
 * @memberOf {Unit}
 * @method
 *
 * @returns {Object}
 * */
Unit.prototype.freezeDepsIndex = function () {
    return Object.freeze(_.invert(this.deps));
};

module.exports = Unit;
