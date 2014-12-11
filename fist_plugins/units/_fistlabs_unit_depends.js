'use strict';

var S_UNIT_NAME = '_fistlabs_unit_depends';

var Context = /** @type Context */ require('../../core/context');
var FistError = /** @type FistError */ require('../../core/fist-error');
var Obus = /** @type Obus */ require('obus');

var _ = require('lodash-node');
var f = require('util').format;
var vow = require('vow');

module.exports = function (agent) {

    function assertDepsOk(Unit, trunk) {

        if (/^[^a-z]/i.test(Unit.prototype.name) ||
            !(Unit.prototype instanceof agent.getUnitClass(S_UNIT_NAME))) {
            return;
        }

        _.forEach(Unit.prototype.deps, function (name) {
            var Dependency = agent.getUnitClass(name);
            var branch = trunk.concat(name);

            if (!Dependency) {
                throw new FistError(FistError.NO_SUCH_UNIT,
                    f('There is no dependency "%s" for unit "%s"', name, Unit.prototype.name));
            }

            if (_.contains(trunk, name)) {
                throw new FistError(FistError.DEPS_CONFLICT,
                    f('Recursive dependencies found: "%s"', branch.join('" < "')));
            }

            assertDepsOk(Dependency, branch);
        });
    }

    /**
     * @class _fist_contrib_unit
     * @extends Unit
     * */
    agent.unit(/** @lends _fist_contrib_unit.prototype */ {

        /**
         * @public
         * @memberOf {_fist_contrib_unit}
         * @property
         * */
        base: 0,

        /**
         * @public
         * @memberOf {_fist_contrib_unit}
         * @property
         * @type {String}
         * */
        name: S_UNIT_NAME,

        /**
         * @private
         * @memberOf {_fist_contrib_unit}
         * @method
         * @constructs
         * */
        __constructor: function () {
            var deps;
            this.__base();

             //  check dependencies issues
            assertDepsOk(agent.getUnitClass(this.name), []);

            deps = _.uniq(this.deps);

            /**
             * @protected
             * @memberOf {_fist_contrib_unit}
             * @property
             * @type {Object}
             * */
            this._deps = tuple(deps);

            /**
             * @protected
             * @memberOf {_fist_contrib_unit}
             * @property
             * @type {Object}
             * */
            this._depsNames = {};

            _.forEach(deps, function (name) {
                 this._depsNames[name] = _.has(this.depsMap, name) ?
                     this.depsMap[name] : name;
            }, this);

            /**
             * @protected
             * @memberOf {_fist_contrib_unit}
             * @property
             * @type {Object}
             * */
            this._depsArgs = {};

            _.forEach(deps, function (name) {
                if (_.has(this.depsArgs, name)) {
                    if (_.isFunction(this.depsArgs[name])) {
                        this._depsArgs[name] = this.depsArgs[name];
                    } else {
                        this._depsArgs[name] = function () {
                            return this.depsArgs[name];
                        };
                    }
                } else {
                    this._depsArgs[name] = function () {};
                }
            }, this);
        },

        /**
         * @public
         * @memberOf {_fist_contrib_unit}
         * @property
         * @type {Object}
         * */
        depsArgs: {},

        /**
         * @public
         * @memberOf {_fist_contrib_unit}
         * @property
         * @type {Object}
         * */
        depsMap: {},

        /**
         * @public
         * @memberOf {_fist_contrib_unit}
         * @property
         * @type {Array}
         * */
        deps: [],

        /**
         * @protected
         * @memberOf {_fist_contrib_unit}
         * @method
         *
         * @param {Track} track
         * @param {Object} context
         *
         * @returns {vow.Promise}
         * */
        _fetch: function (track, context) {
            var __base = this.__base;
            var dDepsStart;
            var deps = this._deps;
            var depsVals;
            var i;
            var l = deps.length;
            var logger = context.logger;
            var name = this.name;

            //  Start deps execution
            dDepsStart = new Date();
            deps = this._deps;
            depsVals = new Array(l);
            context.keys = new Array(l + 1);

            //  call dependencies
            for (i = 0, l = deps.length; i < l; i += 1) {
                name = deps[i];
                depsVals[i] = agent.callUnit(name, track, this._depsArgs[name].call(this, track, context));
            }

            return vow.allResolved(depsVals).then(function (promises) {
                var pos;
                var size;
                var promise;
                var value;
                var hosting;

                if (track.isFlushed()) {
                    logger.debug('The track was flushed up from dependencies tree, skip invocation');
                    return null;
                }

                for (pos = 0, size = promises.length; pos < size; pos += 1) {
                    promise = promises[pos];
                    value = promise.valueOf();

                    if (promise.isRejected()) {
                        context.skipCache = true;
                        context.keys[pos] = null;
                        hosting = context.errors;
                    } else {
                        context.keys[pos] = value.memKey;
                        value = value.result;
                        hosting = context.result;
                    }

                    Obus.add(hosting, this._depsNames[deps[pos]], value);
                }

                logger.debug('Deps resolved in %dms', new Date() - dDepsStart);

                return __base.call(this, track, context);
            }, this);
        },

        /**
         * @protected
         * @memberOf {_fist_contrib_unit}
         * @method
         *
         * @param {Track} track
         * @param {Object} context
         *
         * @returns {*}
         * */
        _buildTag: function (track, context) {
            if (context.skipCache) {
                return null;
            }

            return this.__base(track, context) + '-' + context.keys.join('-');
        },

        /**
         * @public
         * @memberOf {_fist_contrib_unit}
         * @method
         *
         * @param {Logger} logger
         *
         * @returns {Model}
         * */
        createContext: function (logger) {
            return new Model(logger);
        }

    }, {

        /**
         * @public
         * @static
         * @memberOf {_fist_contrib_unit}
         *
         * @param {Object} [members]
         * @param {Object} [statics]
         *
         * @returns {Function}
         * */
        inherit: function (members, statics) {
            members = Object(members);

            if (!members.deps) {
                members.deps = this.prototype.deps;
            } else {
                members.deps = this.prototype.deps.concat(members.deps);
            }

            return this.__base(members, statics);
        }

    });
};

/**
 * @class Model
 * @extends Context
 * */
function Model(logger) {
    Context.call(this, logger);

    /**
     * @public
     * @memberOf {Model}
     * @property
     * @type {Obus}
     * */
    this.errors = new Obus();

    /**
     * @public
     * @memberOf {Model}
     * @property
     * @type {Obus}
     * */
    this.result = new Obus();
}

Model.prototype = Object.create(Context.prototype);

/**
 * @public
 * @memberOf {Model}
 * @method
 *
 * @constructs
 * */
Model.prototype.constructor = Model;

/**
 * @public
 * @memberOf {Model}
 * @method
 *
 * @returns {Object}
 * */
Model.prototype.toJSON = function () {

    return {
        params: Context.prototype.toJSON.call(this),
        errors: this.errors,
        result: this.result
    };
};

/**
 * @public
 * @memberOf {Model}
 * @method
 *
 * @param {String} path
 * @param {*} [def]
 *
 * @returns {*}
 * */
Model.prototype.r = function (path, def) {
    return this.result.get(path, def);
};

/**
 * @public
 * @memberOf {Model}
 * @method
 *
 * @param {String} path
 * @param {*} [def]
 *
 * @returns {*}
 * */
Model.prototype.e = function (path, def) {
    return this.errors.get(path, def);
};

function tuple(list) {
    var i;
    var l = list.length;
    var result = Object.create(null, {
        toString: {
            value: function () {
                return '(' + Array.prototype.join.call(this, ', ') + ')';
            }
        },
        length: {
            value: l
        }
    });

    for (i = 0; i < l; i += 1) {
        Object.defineProperty(result, String(i), {
            value: list[i],
            enumerable: true
        });
    }

    return result;
}
