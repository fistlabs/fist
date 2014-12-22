'use strict';

var Context = /** @type Context */ require('./context');
var FistError = /** @type FistError */ require('./fist-error');
var LRUDictTtlAsync = /** @type LRUDictTtlAsync */ require('lru-dict/core/lru-dict-ttl-async');
var Obus = /** @type Obus */ require('obus');

var _ = require('lodash-node');
var f = require('util').format;
var hasProperty = Object.prototype.hasOwnProperty;
var inherit = require('inherit');
var vow = require('vow');

function init(agent) {
    /*eslint max-params: 0*/

    /**
     * @public
     * @memberOf agent
     * @property
     * @type {Object}
     * */
    agent.caches = {

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
     * Common Fist Unit interface
     * @class Unit
     * */
    function Unit() {
        //  check dependencies issues
        assertDepsOk(agent.getUnitClass(this.name), []);

        /**
         * @public
         * @memberOf {Unit}
         * @property
         * @type {Object}
         * */
        this.params = _.extend({}, this.params);

        if (!_.has(agent.caches, this.cache)) {
            throw new FistError('UNKNOWN_CACHE', f('You should define app.caches[%j] interface', this.cache));
        }

        /**
         * @protected
         * @memberOf {Unit}
         * @method
         * @property
         * */
        this._cache = agent.caches[this.cache];

        /**
         * @public
         * @memberOf {Unit}
         * @property
         * @type {Object}
         * */
        this.deps = _.uniq(this.deps);

        Object.freeze(this.deps);

        /**
         * @this {Unit}
         * */
        this.depsMap = _.reduce(this.deps, function (depsMap, name) {
            if (_.has(this.depsMap, name)) {
                depsMap[name] = this.depsMap[name];
            } else {
                depsMap[name] = name;
            }

            return depsMap;
        }, {}, this);

        Object.freeze(this.depsMap);

        /**
         * @this {Unit}
         * */
        this.depsArgs = _.reduce(this.deps, function (depsArgs, name) {
            var args = this.depsArgs[name];
            if (_.isFunction(args)) {
                depsArgs[name] = args;
            } else {
                depsArgs[name] = function () {
                    return args;
                };
            }
            return depsArgs;
        }, {}, this);

        Object.freeze(this.depsArgs);
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
         * @param {Object} track
         * @param {Object} context
         *
         * @returns {*}
         * */
        call: function (track, context) {
            var dStartExec = new Date();
            var result;
            var defer = vow.defer();

            context.logger.debug('Pending...');

            fetch(this, track, context, function (err, res) {
                var execTime = new Date() - dStartExec;

                if (err) {
                    defer.reject(err);

                    if (track.isFlushed()) {
                        context.logger.warn('Skip error in %dms', execTime, err);
                    } else {
                        context.logger.error('Rejected in %dms', execTime, err);
                    }

                    return;
                }

                defer.resolve(res);

                if (res) {
                    context.logger.debug('Accepted in %dms', execTime);
                } else {
                    context.logger.debug('Skip result in %dms', execTime);
                }
            });

            return defer.promise();
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
        hashArgs: function (track, context) {
            /*eslint no-unused-vars: 0*/
            return 'none';
        },

        /**
         * @public
         * @memberOf {Unit}
         * @method
         *
         * @param {Object} track
         * @param {*} [args]
         *
         * @returns {Object}
         * */
        createContext: function (track, args) {
            var context = new Context(track.logger.bind(this.name));
            context.params = _.extend({}, this.params, track.params, args);
            context.argsHash = this.hashArgs(track, context);
            return context;
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

        members.deps = _.reduce(mixins, function (deps, Mixin) {
            if (_.isFunction(Mixin) && Mixin.prototype.deps) {
                deps = deps.concat(Mixin.prototype.deps);
            }

            return deps;
        }, deps);

        return inherit([this].concat(mixins), members, statics);
    };

    var checked = {};

    function assertDepsOk(Unit, trunk) {

        if (/^[^a-z]/i.test(Unit.prototype.name) || _.has(checked, Unit.prototype.name)) {
            return;
        }

        _.forEach(Unit.prototype.deps, function (name) {
            var Dependency = agent.getUnitClass(name);
            var branch = trunk.concat(name);

            if (!Dependency) {
                throw new FistError(FistError.NO_SUCH_UNIT,
                    f('There is no dependency %j for unit %j', name, Unit.prototype.name));
            }

            if (_.contains(trunk, name)) {
                throw new FistError(FistError.DEPS_CONFLICT,
                    f('Recursive dependencies found: "%s"', branch.join('" < "')));
            }

            assertDepsOk(Dependency, branch);
        });

        checked[Unit.prototype.name] = true;
    }

    function fetch(self, track, context, done) {
        var dDepsStart;
        var deps = self.deps;
        var i;
        var l;
        var remaining = l = self.deps.length;

        context.keys = new Array(deps.length);
        context.skipCache = false;
        context.needUpdate = false;

        if (remaining === 0) {
            cache(self, track, context, done);
            return;
        }

        dDepsStart = new Date();

        function fetchDep(i) {
            var name = deps[i];
            var args = self.depsArgs[name].call(self, track, context);
            var promise = agent.callUnit(track, name, args);

            function onPromiseResolved(promise) {
                var value;
                var path;

                if (track.isFlushed()) {
                    context.logger.debug('The track was flushed by deps, skip invocation');
                    done(null, null);
                    return;
                }

                value = promise.valueOf();
                path = self.depsMap[name];

                if (promise.isRejected()) {
                    context.skipCache = true;
                    Obus.add(context.errors, path, value);
                } else {
                    if (value.updated) {
                        context.needUpdate = true;
                    }
                    context.keys[i] = value.argsHash;
                    Obus.add(context.result, path, value.result);
                }

                remaining -= 1;

                if (remaining === 0) {
                    context.logger.debug('Deps %j resolved in %dms', deps, new Date() - dDepsStart);
                    cache(self, track, context, done);
                }
            }

            if (promise.isResolved()) {
                onPromiseResolved(promise);
            } else {
                promise.always(onPromiseResolved);
            }
        }

        for (i = 0; i < l; i += 1) {
            fetchDep(i);
        }
    }

    /**
     * @public
     * @memberOf {Agent}
     * @property
     * @type {Function}
     * */
    agent.Unit = Unit;
}

function cache(self, track, context, done) {
    var argsHash = context.argsHash;
    var memKey;

    if (!(self.maxAge > 0) || context.skipCache) {
        main(self, track, context, argsHash, done);
        return;
    }

    memKey = self.name + '-' + argsHash + '-' + context.keys.join('-');

    if (context.needUpdate) {
        set(self, track, context, argsHash, memKey, done);
        return;
    }

    self._cache.get(memKey, function (err, res) {
        if (!err && res) {
            context.logger.debug('Found in cache');
            res.updated = false;
            done(null, res);
            return;
        }

        if (err) {
            context.logger.warn('Failed to load cache', err);
        } else {
            context.logger.note('Outdated');
        }

        set(self, track, context, argsHash, memKey, done);
    });
}

function main(self, track, context, argsHash, done) {
    var value;

    try {
        value = self.main(track, context);
    } catch (err) {
        if (vow.isPromise(err)) {
            vow.reject(err).fail(done);
        } else {
            done(err);
        }
        return;
    }

    function success(result) {
        if (track.isFlushed()) {
            context.logger.debug('The track was flushed during execution');
            return null;
        }

        return {
            updated: true,
            result: result,
            argsHash: argsHash
        };
    }

    if (vow.isPromise(value)) {
        vow.resolve(value).then(function (value) {
            done(null, success(value));
        }, done);
        return;
    }

    done(null, success(value));
}

function set(self, track, context, argsHash, memKey,  done) {
    main(self, track, context, argsHash, function (err, res) {

        if (err) {
            done(err);
            return;
        }

        if (res) {
            self._cache.set(memKey, res, self.maxAge, function (err) {
                if (err) {
                    context.logger.warn('Failed to set cache', err);
                } else {
                    context.logger.note('Updated');
                }
            });
        }

        done(null, res);
    });
}

module.exports = init;
