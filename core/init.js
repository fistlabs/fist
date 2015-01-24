'use strict';

var Runtime = /** @type Runtime */ require('./runtime');
var FistError = /** @type FistError */ require('./fist-error');
var LRUDictTtlAsync = /** @type LRUDictTtlAsync */ require('lru-dict/core/lru-dict-ttl-async');
var Obus = /** @type Obus */ require('obus');

var _ = require('lodash-node');
var f = require('util').format;
var hasProperty = Object.prototype.hasOwnProperty;
var inherit = require('inherit');
var utools = require('./utils/unit-tools');
var vow = require('vow');

function init(app) {
    /*eslint max-params: 0*/
    /**
     * @public
     * @memberOf agent
     * @property
     * @type {Object}
     * */
    app.caches = {

        /**
         * default cache interface "local"
         *
         * @public
         * @memberOf agent.caches
         * @property
         * @type {LRUDictTtlAsync}
         * */
        local: new LRUDictTtlAsync(0xffff)
    };

    /**
     * @class Unit
     * */
    function Unit() {
        /**
         * @public
         * @memberOf {Unit}
         * @property
         * @type {Object}
         * */
        this.params = _.extend({}, this.params);

        if (!_.has(app.caches, this.cache)) {
            throw new FistError('UNKNOWN_CACHE', f('You should define app.caches[%j] interface', this.cache));
        }

        /**
         * @public
         * @memberOf {Unit}
         * @method
         * @property
         * */
        this.cache = app.caches[this.cache];

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

        /**
         * @public
         * @memberOf {Unit}
         * @property
         * @type {Number}
         * */
        this.runtimeInitBits = utools.buildRuntimeInitBits(this);
    }

    Unit.prototype = {

        /**
         * @public
         * @memberOf {Unit}
         * @method
         *
         * @constructs
         * */
        constructor: Unit,

        /**
         * @public
         * @memberOf {Unit}
         * @property
         * */
        name: 0,

        /**
         * @public
         * @memberOf {Unit}
         * @property
         * @type {String}
         * */
        cache: 'local',

        /**
         * @public
         * @memberOf {Unit}
         * @property
         * @type {Number}
         * */
        maxAge: 0,

        /**
         * @public
         * @memberOf {Unit}
         * @property
         * @type {Object}
         * */
        params: {},

        /**
         * @public
         * @memberOf {Unit}
         * @property
         * @type {Object}
         * */
        settings: {},

        /**
         * @public
         * @memberOf {Unit}
         * @property
         * @type {Object}
         * */
        depsArgs: {},

        /**
         * @public
         * @memberOf {Unit}
         * @property
         * @type {Object}
         * */
        depsMap: {},

        /**
         * @public
         * @memberOf {Unit}
         * @property
         * @type {Array}
         * */
        deps: [],

        /**
         * @public
         * @memberOf {Unit}
         * @method
         *
         * @returns {*}
         * */
        identify: function _$Unit$prototype$identify() {
            return 'static';
        },

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
        main: /* istanbul ignore next */ function (track, context) {
            /*eslint no-unused-vars: 0*/
        },

        run: function $Unit$ptototype$run(track, args, done) {
            new Runtime(app, this, track, null, args, done).run();
        }
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

        members.settings = _.extend({},
            this.prototype.settings,
            members.settings,
            app.params.unitSettings[members.name]);

        return inherit([this].concat(mixins), members, statics);
    };

    /**
     * @public
     * @memberOf {Agent}
     * @property
     * @type {Function}
     * */
    app.Unit = Unit;
}

module.exports = init;
