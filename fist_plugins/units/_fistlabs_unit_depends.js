'use strict';

var S_UNIT_NAME = '_fistlabs_unit_depends';

var FistError = /** @type FistError */ require('../../core/fist-error');
var Obus = /** @type Obus */ require('obus');

var _ = require('lodash-node');
var f = require('util').format;

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
            this.__base();

             //  check dependencies issues
            assertDepsOk(agent.getUnitClass(this.name), []);

            /**
             * @protected
             * @memberOf {_fist_contrib_unit}
             * @property
             * @type {Object}
             * */
            this._deps = _.uniq(this.deps);

            /**
             * @protected
             * @memberOf {_fist_contrib_unit}
             * @property
             * @type {Object}
             * */
            this._depsNames = {};

            _.forEach(this._deps, function (name) {
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

            _.forEach(this._deps, function (name) {
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
         * @param {Object} track
         * @param {Function} done
         * */
        _fetch: function (track, done) {
            var __base;
            var dDepsStart;
            var i;
            var remaining;
            var l = remaining = this._deps.length;
            var logger;
            var wasFlushed = false;

            if (l === 0) {
                this.__base(track, done);
                return;
            }

            __base = this.__base;
            dDepsStart = new Date();
            logger = track.logger;

            function resolveDep(self, pos) {
                var name = self._deps[pos];
                var args = self._depsArgs[name].call(self, track);

                if (wasFlushed) {
                    return;
                }

                agent.callUnit(track.track, name, args, function (err, res) {
                    if (wasFlushed) {
                        return;
                    }

                    if (track.isFlushed()) {
                        wasFlushed = true;
                        logger.debug('The track was flushed by deps, skip invocation');
                        done(null, null);
                        return;
                    }

                    if (arguments.length < 2) {
                        track.skipCache = true;
                        Obus.add(track.errors, self._depsNames[name], err);
                    } else {
                        track.keys[pos] = res.memKey;
                        Obus.add(track.result, self._depsNames[name], res.result);
                    }

                    if (remaining === 1) {
                        logger.debug('Deps resolved in %dms', new Date() - dDepsStart);
                        __base.call(self, track, done);
                    }

                    remaining -= 1;
                });
            }

            for (i = 0; i < l; i += 1) {
                resolveDep(this, i);
            }
        },

        /**
         * @protected
         * @memberOf {_fist_contrib_unit}
         * @method
         *
         * @param {Object} track
         *
         * @returns {*}
         * */
        _buildTag: function (track) {
            if (track.skipCache) {
                return null;
            }

            return this.__base(track) + '-' + track.keys.join('-');
        },

        /**
         * @public
         * @memberOf {_fist_contrib_unit}
         * @method
         *
         * @param {Track} track
         * @param {*} [args]
         *
         * @returns {Object}
         * */
        createContext: function (track, args) {
            var context = this.__base(track, args);

            context.keys = new Array(this._deps.length + 1);

            context.skipCache = false;

            context.errors = new Obus();

            context.result = new Obus();

            context.e = function (path, def) {
                return Obus.get(this.errors, path, def);
            };

            context.r = function (path, def) {
                return Obus.get(this.result, path, def);
            };

            return context;
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
            var deps = this.prototype.deps;
            var mixins = [];

            members = Object(members);

            if (members.deps) {
                deps = deps.concat(members.deps);
            }

            if (members.mixins) {
                mixins = mixins.concat(members.mixins);
            }

            members.deps = _.reduce(mixins, function (deps, Mixin) {
                if (_.isFunction(Mixin) && Mixin.prototype.deps) {
                    deps = deps.concat(Mixin.prototype.deps);
                }

                return deps;
            }, deps);

            return this.__base(members, statics);
        }

    });
};
