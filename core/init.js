'use strict';

var FistError = /** @type FistError */ require('./fist-error');
var LRUDictTtlAsync = /** @type LRUDictTtlAsync */ require('lru-dict/core/lru-dict-ttl-async');
var Obus = /** @type Obus */ require('obus');
var Runtime = /** @type Runtime */ require('./runtime');

var _ = require('lodash-node');
var f = require('util').format;
var hasProperty = Object.prototype.hasOwnProperty;
var inherit = require('inherit');
var utools = require('./utils/unit-tools');
var vow = require('vow');

function init(app) {

    /**
     * @public
     * @memberOf app
     * @property
     * @type {Object}
     * */
    app.caches = {

        /**
         * default cache interface "local"
         *
         * @public
         * @memberOf app.caches
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
     * @param {Track} track
     * @param {Context} context
     *
     * @returns {*}
     * */
    Unit.prototype.identify = function _$Unit$prototype$identify(track, context) {
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
        new Runtime(app, this, track, null, args, done).run();
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
     * @memberOf {Core}
     * @property
     * @type {Function}
     * */
    app.Unit = Unit;
}

module.exports = init;
