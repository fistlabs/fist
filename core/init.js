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
    var assertDepsOk = createDepsOkAssertion(app);

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
        call: function _$Unit$prototype$call(track, context, done) {
            context.logger.debug('Pending...');

            _$Unit$fetch(this, track, context, function () {
                var execTime = context.getTimePassed();

                if (context.isRejected()) {
                    context.logger.debug('Rejected in %dms', execTime);
                } else if (context.isAccepted()) {
                    context.logger.debug('Accepted in %dms', execTime);
                } else {
                    context.logger.debug('Skipping in %dms', execTime);
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
        identify: function _$Unit$prototype$identify(track, context) {
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
        createContext: function $Unit$prototype$createContext(track, args) {
            var context = new Context(track.logger.bind(/** @type {String} */ this.name));

            _$Unit$extendContextParams(context.params, this.params);
            _$Unit$extendContextParams(context.params, track.params);
            _$Unit$extendContextParams(context.params, args);

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

    function _$Unit$fetch(self, track, context, done) {
        var paths = self.deps;
        var l = paths.length;

        if (l === 0) {
            _$Unit$syncCache(self, track, context, done);
            return;
        }

        context.paths = paths;
        context.pathsLeft = l;

        function allResolved(ctxt) {
            if (ctxt.skipped) {
                done(ctxt);
                return;
            }

            _$Unit$syncCache(self, track, ctxt, done);
        }

        while (l) {
            l -= 1;
            _$Unit$resolveDepNo(self, track, context, l, allResolved);
        }
    }

    function _$Unit$resolveDepNo(self, track, context, i, done) {
        var name = context.paths[i];
        var args = self.depsArgs[name](track, context);
        var path = self.depsMap[name];

        app.callUnit(track, name, args, function (depCtx) {
            if (context.skipped) {
                return;
            }

            if (depCtx.skipped) {
                context.skipped = true;
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
                done(context);
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

function _$Unit$syncCache(self, track, context, done) {
    if (!(self.maxAge > 0) || context.skipCache) {
        _$Unit$main(self, track, context, done);
        return;
    }

    context.cacheKey = self.name + '-' + context.identity + '-' + context.keys.join('-');

    if (context.needUpdate) {
        _$Unit$updateCache(self, track, context, done);
        return;
    }

    _$Unit$getFromCache(self, track, context, done);
}

function _$Unit$getFromCache(self, track, context, done) {
    self._cache.get(context.cacheKey, function (err, data) {
        if (!err && data) {
            context.logger.debug('Found in cache');
            context.value = data.value;
            context.status = 'ACCEPTED';
            done(context);
            return;
        }

        if (err) {
            context.logger.warn(err);
        } else {
            context.logger.debug('Outdated');
        }

        _$Unit$updateCache(self, track, context, done);
    });
}

function _$Unit$main(self, track, context, done) {
    vow.invoke(function () {
        return self.main(track, context);
    }).done(function (res) {
        done(_$Unit$setValue(track, context, res, 'ACCEPTED'));
    }, function (err) {
        context.logger.error(err);
        done(_$Unit$setValue(track, context, err, 'REJECTED'));
    });
}

function _$Unit$setValue(track, context, value, status) {
    context.skipped = track.isFlushed();
    context.value = value;
    context.updated = true;
    context.status = status;

    return context;
}

function _$Unit$updateCache(self, track, context, done) {
    _$Unit$main(self, track, context, function () {
        if (context.isRejected()) {
            done(context);
            return;
        }

        if (!context.skipped) {
            self._cache.set(context.cacheKey, {value: context.valueOf()}, self.maxAge, function (err) {
                if (err) {
                    context.logger.warn(err);
                } else {
                    context.logger.debug('Updated');
                }
            });
        }

        done(context);
    });
}

function _$Unit$extendContextParams(obj, src) {
    var k;
    var i;
    var keys;

    if (!src || typeof src !== 'object') {
        return obj;
    }

    keys = Object.keys(src);
    i = keys.length;

    while (i) {
        i -= 1;
        k = keys[i];
        if (src[k] !== void 0) {
            obj[k] = src[k];
        }
    }

    //for (k in src) {
    //    if (hasProperty.call(src, k) && src[k] !== void 0) {
    //        obj[k] = src[k];
    //    }
    //}

    return obj;
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

function createDepsOkAssertion(app) {
    var checked = {};

    return function ok(UnitClass, trunk) {
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

            ok(Dependency, branch);
        });

        checked[unitName] = true;
    };
}

function Runtime(app, unit, track, done) {
    this.app = app;
    this.unit = unit;
    this.track = track;
    this.done = done;
}

module.exports = init;
