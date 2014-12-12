'use strict';

var LRUDictTtlAsync = /** @type LRUDictTtlAsync */ require('./cache/lru-dict-ttl-async');

var _ = require('lodash-node');
var create = require('./util/create');
var hasProperty = Object.prototype.hasOwnProperty;
var inherit = require('inherit');
var vow = require('vow');

var FistError = /** @type FistError */ require('./fist-error');
var Obus = /** @type Obus */ require('obus');
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
     *
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

        /**
         * @protected
         * @memberOf {Unit}
         * @method
         * @property
         * */
        this._cache = agent.caches[this.cache];
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

            this._fetch(track, context, function (err, res) {
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
            });
        },

        /**
         * @public
         * @memberOf {Unit}
         * @method
         *
         * @param {Object} context
         *
         * @returns {*}
         * */
        hashArgs: function (context) {
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
            var i;
            var k;
            var l;
            var context = create(track);

            args = [this.params, track.params, args];

            context.logger = track.logger.bind(this.name);
            context.params = {};

            for (i = 0, l = args.length; i < l; i += 1) {
                for (k in args[i]) {
                    if (hasProperty.call(args[i], k)) {
                        context.params[k] = args[i][k];
                    }
                }
            }

            return context;
        },

        /**
         * @public
         * @memberOf {Unit}
         * @method
         *
         * @param {Track} context
         *
         * @returns {*}
         * */
        main: /* istanbul ignore next */ function (context) {
            /*eslint no-unused-vars: 0*/
        },

        /**
         * @protected
         * @memberOf {Unit}
         * @method
         *
         * @param {Track} context
         *
         * @returns {*}
         * */
        _buildTag: function (context) {
            return this.name + '-' + this.hashArgs(context);
        },

        /**
         * @protected
         * @memberOf {Unit}
         * @method
         *
         * @param {Object} track
         * @param {Object} context
         * @param {Function} done
         * */
        _fetch: function (track, context, done) {
            var self = this;
            var memKey = self._buildTag(context);
            var logger = context.logger;

            if (!memKey || !(self.maxAge > 0)) {
                main(self, context, function (err, res) {
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
                main(self, context, function (err, res) {
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
        var mixins = Object(members).mixins;

        if (!mixins) {
            mixins = [];
        }

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

    /**
     * @abstract
     * @class Depends
     * @extends Unit
     * */
    var Depends = inherit(Unit, {

        /**
         * @private
         * @memberOf {Depends}
         * @method
         * @constructs
         * */
        __constructor: function () {
            this.__base();

            //  check dependencies issues
            assertDepsOk(agent.getUnitClass(this.name), []);

            /**
             * @protected
             * @memberOf {Depends}
             * @property
             * @type {Object}
             * */
            this._deps = _.uniq(this.deps);

            /**
             * @protected
             * @memberOf {Depends}
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
             * @memberOf {Depends}
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
         * @memberOf {Depends}
         * @property
         * @type {Object}
         * */
        depsArgs: {},

        /**
         * @public
         * @memberOf {Depends}
         * @property
         * @type {Object}
         * */
        depsMap: {},

        /**
         * @public
         * @memberOf {Depends}
         * @property
         * @type {Array}
         * */
        deps: [],

        /**
         * @protected
         * @memberOf {Depends}
         * @method
         *
         * @param {Object} track
         * @param {Object} context
         * @param {Function} done
         * */
        _fetch: function (track, context, done) {
            var __base;
            var dDepsStart;
            var i;
            var remaining;
            var l = remaining = this._deps.length;
            var logger;
            var wasFlushed = false;

            context.keys = new Array(l + 1);
            context.skipCache = false;

            if (l === 0) {
                this.__base(track, context, done);
                return;
            }

            __base = this.__base;
            dDepsStart = new Date();
            logger = context.logger;

            function resolveDep(self, pos) {
                var name = self._deps[pos];
                var args = self._depsArgs[name].call(self, context);

                if (wasFlushed) {
                    return;
                }

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
                        __base.call(self, track, context, done);
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
         * @memberOf {Depends}
         * @method
         *
         * @param {Object} context
         *
         * @returns {*}
         * */
        _buildTag: function (context) {
            if (context.skipCache) {
                return null;
            }

            return this.__base(context) + '-' + context.keys.join('-');
        },

        /**
         * @public
         * @memberOf {Depends}
         * @method
         *
         * @param {Track} track
         * @param {*} [args]
         *
         * @returns {Object}
         * */
        createContext: function (track, args) {
            var context = this.__base(track, args);

            context.errors = new Obus();
            context.result = new Obus();
            context.e = e;
            context.r = r;

            return context;
        }

    }, {

        /**
         * @public
         * @static
         * @memberOf {Depends}
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

    /**
     * @public
     * @memberOf {Agent}
     * @property
     * @type {Function}
     * */
    agent.Unit = Depends;
}

function main(self, track, done) {
    var res;

    try {
        res = self.main(track);
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

module.exports = init;
