'use strict';

var Runtime = /** @type Runtime */ require('./runtime');

var _ = require('lodash-node');
var inherit = require('inherit');
var utools = require('./utils/unit-tools');

/**
 * @class Unit
 * @param {Core} app
 * */
function Unit(app) {

    /**
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
     * @type {Core}
     * */
    this.app = app;

    /**
     * @public
     * @memberOf {Unit}
     * @property
     * @type {Object}
     * */
    this.cache = utools.buildCache(this);

    /**
     * @public
     * @memberOf {Unit}
     * @property
     * @type {Logger}
     * */
    this.logger = this.app.logger.bind(this.name);

    /**
     * @public
     * @memberOf {Unit}
     * @property
     * @type {Array<String>}
     * */
    this.deps = utools.buildDeps(this);

    /**
     * @public
     * @memberOf {Unit}
     * @property
     * @type {Array<String>}
     * */
    this.depsMap = utools.buildDepsMap(this);

    /**
     * @public
     * @memberOf {Unit}
     * @property
     * @type {Array<String>}
     * */
    this.depsArgs = utools.buildDepsArgs(this);

    /**
     * @public
     * @memberOf {Unit}
     * @property
     * @type {Object}
     * */
    this.depsIndexMap = utools.buildDepsIndexMap(this);
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
Unit.prototype.cache = 'local';

/**
 * @public
 * @memberOf {Unit}
 * @property
 * @type {Number}
 * */
Unit.prototype.maxAge = 0;

/**
 * @public
 * @memberOf {Unit}
 * @property
 * @type {Object}
 * */
Unit.prototype.params = {};

/**
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
 * @public
 * @memberOf {Unit}
 * @method
 *
 * @param {Object} track
 * @param {Object} context
 *
 * @returns {*}
 * */
Unit.prototype.main = function (track, context) {
    /*eslint no-unused-vars: 0*/
};

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
        deps = deps.concat(members.deps);
    }

    if (members.mixins) {
        mixins = mixins.concat(members.mixins);
    }

    members.deps = _.reduce(mixins, function (fullDeps, Mixin) {
        if (_.isFunction(Mixin) && Mixin.prototype.deps) {
            fullDeps = fullDeps.concat(Mixin.prototype.deps);
        }

        return fullDeps;
    }, deps);

    // Unit's settings inherits from parent's settings
    members.settings = _.extend({}, this.prototype.settings, members.settings);

    return inherit([this].concat(mixins), members, statics);
};

module.exports = Unit;
