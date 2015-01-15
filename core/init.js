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
     * Common Fist Unit interface
     * @class Unit
     * */
    function Unit() {
        //  check dependencies issues
        assertDepsOk(app.getUnitClass(this.name), []);

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
         * @protected
         * @memberOf {Unit}
         * @method
         * @property
         * */
        this._cache = app.caches[this.cache];

        /**
         * @public
         * @memberOf {Unit}
         * @property
         * @type {Array<String>}
         * */
        this.deps = buildDeps(this);

        /**
         * @public
         * @memberOf {Unit}
         * @property
         * @type {Array<String>}
         * */
        this.depsMap = buildDepsMap(this);

        /**
         * @public
         * @memberOf {Unit}
         * @property
         * @type {Array<String>}
         * */
        this.depsArgs = buildDepsArgs(this);
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
         * @param {Object} track
         * @param {Object} context
         * @param {Function} done
         *
         * @returns {*}
         * */
        call: function (track, context, done) {
            var result;

            context.logger.debug('Pending...');

            fetch(this, track, context, function () {
                var execTime = context.getTimePassed();

                if (context.isRejected()) {
                    if (context.skipped) {
                        context.logger.warn('Skip error in %dms', execTime, context.valueOf());
                    } else {
                        context.logger.error('Rejected in %dms', execTime, context.valueOf());
                    }

                    done(context);

                    return;
                }

                if (context.isAccepted()) {
                    context.logger.debug('Accepted in %dms', execTime);
                } else {
                    context.logger.debug('Skip result in %dms', execTime);
                }

                done(context);
            });
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
        identify: function (track, context) {
            /*eslint no-unused-vars: 0*/
            return context.identity;
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
            /*eslint complexity: 0*/
            var context = new Context(track.logger.bind(/** @type {String} */ this.name));
            var i;
            var k;
            var l;
            var params;

            args = [this.params, track.params, args];

            for (i = 0, l = args.length; i < l; i += 1) {
                params = args[i];

                for (k in params) {
                    if (hasProperty.call(params, k) && params[k] !== void 0) {
                        context.params[k] = params[k];
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

    var checked = {};

    function assertDepsOk(UnitClass, trunk) {
        var unitName = UnitClass.prototype.name;

        if (/^[^a-z]/i.test(unitName) || _.has(checked, unitName)) {
            return;
        }

        _.forEach(UnitClass.prototype.deps, function (depName) {
            var Dependency = app.getUnitClass(depName);
            var branch = trunk.concat(depName);

            if (!Dependency) {
                throw new FistError(FistError.NO_SUCH_UNIT,
                    f('There is no dependency %j for unit %j', depName, unitName));
            }

            if (_.contains(trunk, depName)) {
                throw new FistError(FistError.DEPS_CONFLICT,
                    f('Recursive dependencies found: "%s"', branch.join('" < "')));
            }

            assertDepsOk(Dependency, branch);
        });

        checked[unitName] = true;
    }

    function fetch(self, track, context, done) {
        var paths = self.deps;
        var i;
        var l = paths.length;

        if (l === 0) {
            cache(self, track, context, done);
            return;
        }

        context.paths = paths;
        context.pathsLeft = l;

        for (i = 0; i < l; i += 1) {
            resolvePath(self, track, context, i, done);
        }
    }

    function resolvePath(self, track, context, i, done) {
        var name = context.paths[i];
        var args = self.depsArgs[name](track, context);
        var path = self.depsMap[name];

        app.callUnit(track, name, args, function (depCtx) {

            if (context.skipped) {
                return;
            }

            if (depCtx.skipped) {
                context.skipped = true;
                context.logger.debug('The track was flushed by deps, skip invocation');
                done(context);
                return;
            }

            if (depCtx.isRejected()) {
                context.skipCache = true;
                Obus.add(context.errors, path, depCtx.valueOf());
            } else {
                if (depCtx.updated) {
                    context.needUpdate = true;
                }
                context.keys[i] = depCtx.identity;
                Obus.add(context.result, path, depCtx.valueOf());
            }

            context.pathsLeft -= 1;

            if (context.pathsLeft === 0) {
                context.logger.debug('Deps %(paths)j resolved in %dms',
                    context.getTimePassed(), context);
                cache(self, track, context, done);
            }
        });
    }

    /**
     * @public
     * @memberOf {Agent}
     * @property
     * @type {Function}
     * */
    app.Unit = Unit;
}

function cache(self, track, context, done) {

    if (!(self.maxAge > 0) || context.skipCache) {
        main(self, track, context, done);
        return;
    }

    context.cacheKey = self.name + '-' + context.identity + '-' + context.keys.join('-');

    if (context.needUpdate) {
        update(self, track, context, done);
        return;
    }

    self._cache.get(context.cacheKey, function (err, data) {
        if (!err && data) {
            context.logger.debug('Found in cache');
            context.value = data.value;
            context.status = 'ACCEPTED';
            done(context);
            return;
        }

        if (err) {
            context.logger.warn('Failed to load cache', err);
        } else {
            context.logger.note('Outdated');
        }

        update(self, track, context, done);
    });
}

function main(self, track, context, done) {

    function makeVal(result, status) {
        if (track.isFlushed()) {
            context.skipped = true;
            context.logger.debug('The track was flushed during execution');
            return context;
        }

        context.value = result;
        context.updated = true;
        context.status = status;

        return context;
    }

    vow.invoke(function () {
        return self.main(track, context);
    }).done(function (res) {
        done(makeVal(res, 'ACCEPTED'));
    }, function (err) {
        done(makeVal(err, 'REJECTED'));
    });
}

function update(self, track, context, done) {
    main(self, track, context, function () {
        if (context.isRejected()) {
            done(context);
            return;
        }

        if (context.isAccepted()) {
            self._cache.set(context.cacheKey, {value: context.valueOf()}, self.maxAge, function (err) {
                if (err) {
                    context.logger.warn('Failed to set cache', err);
                } else {
                    context.logger.note('Updated');
                }
            });
        }

        done(context);
    });
}

function buildDepsArgs(self) {
    var depsArgs = _.reduce(self.deps, function (accum, name) {
        var args = self.depsArgs[name];
        if (_.isFunction(args)) {
            accum[name] = args.bind(self);
        } else {
            accum[name] = function () {
                return args;
            };
        }
        return accum;
    }, {});

    return Object.freeze(depsArgs);
}

function buildDepsMap(self) {
    var result = _.reduce(self.deps, function (accum, name) {
        if (_.has(self.depsMap, name)) {
            accum[name] = self.depsMap[name];
        } else {
            accum[name] = name;
        }

        return accum;
    }, {});

    return Object.freeze(result);
}

function buildDeps(self) {
    return Object.freeze(_.uniq(self.deps));
}

module.exports = init;
