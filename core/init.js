'use strict';

var Context = require('./context');
var FistError = /** @type FistError */ require('./fist-error');
var LRUDictTtlAsync = /** @type LRUDictTtlAsync */ require('./cache/lru-dict-ttl-async');
var Obus = /** @type Obus */ require('obus');

var _ = require('lodash-node');
var hasProperty = Object.prototype.hasOwnProperty;
var inherit = require('inherit');
var vow = require('vow');

var f = require('util').format;

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
            throw new FistError('UNKNOWN_CACHE', f('You should define app.caches["%s"] interface', this.cache));
        }

        /**
         * @protected
         * @memberOf {Unit}
         * @method
         * @property
         * */
        this._cache = agent.caches[this.cache];

        /**
         * @protected
         * @memberOf {Unit}
         * @property
         * @type {Object}
         * */
        this._deps = _.uniq(this.deps);

        /**
         * @protected
         * @memberOf {Unit}
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
         * @memberOf {Unit}
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
         * @param {Function} done
         *
         * @returns {*}
         * */
        call: function (track, context, done) {
            var dStartExec = new Date();
            var result;
            var logger = context.logger;

            logger.debug('Pending...');

            function onFetch(err, res) {
                var execTime = new Date() - dStartExec;

                if (arguments.length < 2) {
                    if (track.isFlushed()) {
                        logger.warn('Skip error in %dms', execTime, err);
                    } else {
                        logger.error('Rejected in %dms', execTime, err);
                    }

                    done(err);
                    return;
                }

                if (track.isFlushed()) {
                    logger.debug('Skip result in %dms', execTime);
                } else {
                    logger.debug('Accepted in %dms', execTime);
                }

                done(null, res);
            }

            fetch(this, track, context, onFetch);
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
            return '';
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
            context.params = extend({}, this.params, track.params, args);
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
        },

        /**
         * @protected
         * @memberOf {Unit}
         * @method
         *
         * @param {Object} track
         * @param {Object} context
         *
         * @returns {*}
         * */
        _buildTag: function (track, context) {

            if (context.skipCache) {
                return null;
            }

            return this.name + '-' + this.hashArgs(track, context) + '-' + context.keys.join('-');
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

    function assertDepsOk(Unit, trunk) {

        if (/^[^a-z]/i.test(Unit.prototype.name)) {
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

    function fetch(self, track, context, done) {
        var dDepsStart;
        var i;
        var remaining;
        var l = remaining = self._deps.length;
        var logger;
        var wasFlushed = false;

        context.keys = new Array(l + 1);
        context.skipCache = false;

        if (l === 0) {
            cache(self, track, context, done);
            return;
        }

        dDepsStart = new Date();
        logger = context.logger;

        function resolveDep(pos) {
            var name = self._deps[pos];
            //  TODO prevent throwing user code
            var args = self._depsArgs[name].call(self, track, context);

            if (wasFlushed) {
                return;
            }

            //  TODO if (track.isFlushed()) {}

            agent.callUnit(track, name, args, function (err, res) {
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
                    context.skipCache = true;
                    Obus.add(context.errors, self._depsNames[name], err);
                } else {
                    context.keys[pos] = res.memKey;
                    Obus.add(context.result, self._depsNames[name], res.result);
                }

                if (remaining === 1) {
                    logger.debug('Deps resolved in %dms', new Date() - dDepsStart);
                    cache(self, track, context, done);
                }

                remaining -= 1;
            });
        }

        for (i = 0; i < l; i += 1) {
            resolveDep(i);
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

function main(self, track, context, done) {
    var res;

    try {
        res = self.main(track, context);
    } catch (err) {
        if (vow.isPromise(err)) {
            vow.reject(err).fail(done);
            return;
        }

        done(err);
        return;
    }

    if (vow.isPromise(res)) {
        vow.resolve(res).then(function (res) {
            done(null, res);
        }, done);
        return;
    }

    done(null, res);
}

function e(path, def) {
    return Obus.get(this.errors, path, def);
}

function r(path, def) {
    return Obus.get(this.result, path, def);
}

function extend(dst) {
    var i;
    var k;
    var l;
    var src;

    for (i = 1, l = arguments.length; i < l; i += 1) {
        src = arguments[i];
        for (k in src) {
            if (hasProperty.call(src, k)) {
                dst[k] = src[k];
            }
        }
    }

    return dst;
}

function cache(self, track, context, done) {
    //  TODO prevent throwing user code...
    var memKey = self._buildTag(track, context);
    var logger = context.logger;

    if (!memKey || !(self.maxAge > 0)) {
        main(self, track, context, function (err, res) {
            if (arguments.length < 2) {
                done(err);
                return;
            }

            if (track.isFlushed()) {
                logger.debug('The track was flushed during execution');
                done(null, null);
                return;
            }

            done(null, {
                result: res,
                memKey: memKey
            });
        });
        return;
    }

    self._cache.get(memKey, function (err, res) {
        //  has value in cache
        if (res) {
            logger.debug('Found in cache');

            done(null, {
                result: res.data,
                memKey: memKey
            });
            return;
        }

        //  error while getting value from cache
        if (err) {
            logger.warn('Failed to load cache', err);
        } else {
            logger.note('Outdated');
        }

        //  calling unit
        main(self, track, context, function (err, res) {
            if (arguments.length < 2) {
                done(err);
                return;
            }

            if (track.isFlushed()) {
                logger.debug('The track was flushed during execution');
                done(null, null);
                return;
            }

            //  Try to set cache
            self._cache.set(memKey, {data: res}, self.maxAge, function (err) {
                if (err) {
                    logger.warn('Failed to set cache', err);
                } else {
                    logger.note('Updated');
                }
            });

            done(null, {
                result: res,
                memKey: memKey
            });
        });
    });
}

module.exports = init;
