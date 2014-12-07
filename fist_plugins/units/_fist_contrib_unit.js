'use strict';

var S_UNIT_NAME = '_fist_contrib_unit';

var Context = /** @type Context */ require('../../core/context');
var FistError = /** @type FistError */ require('../../core/fist-error');
var Obus = /** @type Obus */ require('obus');

var _ = require('lodash-node');
var f = require('util').format;
var hasProperty = Object.prototype.hasOwnProperty;
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
     * @extends UnitCommon
     * */
    agent.unit(/** @lends _fist_contrib_unit.prototype */ {

        /**
         * @public
         * @memberOf {_fist_contrib_unit}
         * @property
         * @type {String}
         * */
        base: '_fist_contrib_unit_common',

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
            this.__base();

            /**
             * @public
             * @memberOf {_fist_contrib_unit}
             * @property
             * @type {Array<String>}
             * */
            this.deps = _.uniq(this.deps);

            //  check dependencies issues
            assertDepsOk(agent.getUnitClass(this.name), []);
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
         * @param {Model} context
         *
         * @returns {vow.Promise}
         * */
        _execute: function (track, context) {
            var __base = this.__base;
            var args;
            var dDepsStart;
            var deps;
            var depsArgs;
            var depsMap;
            var depsVals;
            var i;
            var l;
            var logger = context.logger;
            var name = this.name;

            //  Start deps execution
            dDepsStart = new Date();
            deps = this.deps;
            depsArgs = Object(this.depsArgs);
            depsMap = Object(this.depsMap);
            depsVals = new Array(deps.length);

            //  call dependencies
            for (i = 0, l = deps.length; i < l; i += 1) {
                name = deps[i];
                args = void 0;

                if (hasProperty.call(depsArgs, name)) {
                    args = depsArgs[name];

                    if (typeof args === 'function') {
                        args = args.call(this, track, context);
                    }
                }

                depsVals[i] = agent.callUnit(name, track, args);
            }

            return vow.allResolved(depsVals).then(function (promises) {
                var pos;
                var size;
                var promise;
                var value;
                var hosting;

                if (track.isFlushed()) {
                    logger.note('The track was flushed up from dependencies tree, skip invocation');
                    return null;
                }

                for (pos = 0, size = promises.length; pos < size; pos += 1) {
                    promise = promises[pos];
                    value = promise.valueOf();
                    name = deps[pos];

                    if (promise.isRejected()) {
                        context.memKeys[name] = null;
                        hosting = context.errors;
                    } else {
                        context.memKeys[name] = value.memKey;
                        value = value.result;
                        hosting = context.result;
                    }

                    Obus.add(hosting, hasProperty.call(depsMap, name) ? depsMap[name] : name, value);
                }

                logger.note('Deps resolved in %dms', new Date() - dDepsStart);

                return __base.call(this, track, context);
            }, this);
        },

        /**
         * @protected
         * @memberOf {_fist_contrib_unit}
         * @method
         *
         * @param {Track} track
         * @param {Model} context
         *
         * @returns {*}
         * */
        _buildMemKey: function (track, context) {
            var memKey;
            var memKeys = context.memKeys;
            var parts = [this.__base(track, context)];
            var name;

            for (name in memKeys) {
                if (hasProperty.call(memKeys, name)) {
                    memKey = memKeys[name];

                    if (memKey) {
                        parts[parts.length] = memKey;
                        continue;
                    }

                    //  do not cache if any of dependencies was not cached
                    return null;
                }
            }

            return parts.join(',');
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

    /**
     * @public
     * @memberOf {Model}
     * @property
     * @type {Object}
     * */
    this.memKeys = {};
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
