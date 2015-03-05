'use strict';

// accepted
var B00000001 = parseInt('00000001', 2);
// rejected
var B00000010 = parseInt('00000010', 2);
// skipping
var B00000100 = parseInt('00000100', 2);
// updating
var B00001000 = parseInt('00001000', 2);
// skip cache
var B00010000 = parseInt('00010000', 2);
// finished
var B00100000 = parseInt('00100000', 2);

// accepted + rejected
var B00000011 = B00000010 | B00000001;
// skipping + rejected
var B00000110 = B00000100 | B00000010;

var Bluebird = /** @type Promise */ require('bluebird');
var Context = /** @type Context */ require('./context');
var Obus = /** @type Obus */ require('obus');

var maxRunDepth = 1;

var DEFAULT_KEYS = Object.freeze([]);

/**
 * @class Runtime
 * @extends Context
 *
 * @param {Unit} unit
 * @param {Track} track
 * @param {Runtime} [parent]
 * @param {Object} [args]
 * @param {Function} done
 *
 * @constructs
 * */
function Runtime(unit, track, parent, args, done) {
    // Create lite context to provide an interface to check execution parameters
    var context = new Context.Lite().
        // add default context params
        addParams(unit.params).
        // add track's params
        addParams(track.params).
        // add local args
        addParams(args);

    /**
     * Runtime identity is a part of cacheKey and memorization key
     *
     * @public
     * @memberOf {Runtime}
     * @property
     * @type {String}
     * */
    this.identity = unit.identify(track, context);

    /**
     * Invoking unit
     *
     * @public
     * @memberOf {Runtime}
     * @property
     * @type {Unit}
     * */
    this.unit = unit;

    /**
     * Request handling runtime
     *
     * @public
     * @memberOf {Runtime}
     * @property
     * @type {Track}
     * */
    this.track = track;

    /**
     * The dependant Runtime
     *
     * @public
     * @memberOf {Runtime}
     * @property
     * @type {Runtime}
     * */
    this.parent = parent;

    /**
     * Finish listener
     *
     * @public
     * @memberOf {Runtime}
     * @property
     * @type {Function}
     * */
    this.done = done;

    /**
     * The number of dependencies remaining to resolve
     *
     * @public
     * @memberOf {Runtime}
     * @property
     * @type {Number}
     * */
    this.pathsLeft = 0;

    /**
     * The array of dependency identities
     *
     * @public
     * @memberOf {Runtime}
     * @property
     * @type {Array}
     * */
    this.keys = DEFAULT_KEYS;

    /**
     * @public
     * @memberOf {Runtime}
     * @property
     * @type {Date}
     * */
    this.creationDate = 0;

    /**
     * @public
     * @memberOf {Runtime}
     * @property
     * @type {*}
     * */
    this.value = void 0;

    /**
     * The status of current runtime
     *
     * @public
     * @memberOf {Runtime}
     * @property
     * @type {Number}
     * */
    this.statusBits = 0;

    /**
     * Runtime context
     *
     * @public
     * @memberOf {Runtime}
     * @property
     * @type {Context}
     * */
    this.context = context;

    /**
     * @public
     * @memberOf {Runtime}
     * @property
     * @type {Array<Runtime>}
     * */
    this.listeners = [];

    /**
     * @public
     * @memberOf {Runtime}
     * @property
     * @type {String}
     * */
    this.cacheKey = '';
}

/**
 * @public
 * @static
 * @memberOf {Runtime}
 * @method
 *
 * @param {Unit} unit
 * @param {Track} track
 * @param {Object} args
 * @param {Function} done
 * */
Runtime.startRun = function $Runtime$startRun(unit, track, args, done) {
    /*eslint complexity: 0*/
    // All request unit calls
    var runtimeCache = track.calls;
    // Host application
    var app = unit.app;
    var deps;
    var l;
    var pos = 0;
    var identity;
    var existingRuns;
    var stack = new Array(maxRunDepth);
    var unitName;
    var parent = new this(unit, track, null, args, done);
    var runtime;
    var childUnit;
    var childUnitName;
    var logger;

    stack[pos] = parent;

    do {
        // unpack stack item
        parent = stack[pos];
        unit = parent.unit;
        identity = parent.identity;
        unitName = unit.name;

        // check for allocated runs object
        if (runtimeCache.hasOwnProperty(unitName)) {
            // The unit was already called
            existingRuns = runtimeCache[unitName];
        } else {
            // First unit call
            existingRuns = runtimeCache[unitName] = {};
        }

        // check for existing execution
        if (existingRuns.hasOwnProperty(identity)) {
            // execution exist
            runtime = parent;
            parent = existingRuns[identity];

            if (parent.statusBits & B00100000) {
                // finished
                (0, runtime.done)(parent, runtime.parent);
            } else {
                // intermediate
                parent.listeners.push(runtime);
            }

            continue;
        }

        // Save execution
        existingRuns[identity] = parent;

        // bind unit's logger to track and execution identity
        logger = unit.logger.bind(track.id).bind(identity);

        // rly need this shit? Is it makes sense?
        logger.debug('Running...');

        // Now we can complete runtime initialization

        // Upgrade ContextLite to Context
        parent.context = new Context(parent.context.params, logger);

        // Set runtime creation date
        parent.creationDate = new Date();

        // Should skip cache if maxAge lt 0 or invalid
        parent.statusBits = B00010000 * !(unit.maxAge > 0);

        deps = unit.deps;
        l = parent.pathsLeft = deps.length;

        if (l === 0) {
            // no deps, execute runtime
            $Runtime$execute(parent);
            continue;
        }

        parent.keys = new Array(l);

        // deps raises child runtimes
        while (l) {
            l -= 1;
            childUnitName = deps[l];
            args = unit.depsArgs[childUnitName](track, parent.context);
            childUnit = app.getUnit(childUnitName);
            runtime = new this(childUnit, track, parent, args, $Runtime$doneChild);

            stack[pos] = runtime;
            pos += 1;
        }

        // auto adjust initial stack size, for future runs
        maxRunDepth = Math.max(pos, maxRunDepth);
        /*eslint no-plusplus: 0*/
    } while (pos--);
};

/**
 * @public
 * @memberOf {Runtime}
 * @method
 *
 * @constructs
 * */
Runtime.prototype.constructor = Runtime;

/**
 * @public
 * @memberOf {Runtime}
 * @method
 *
 * @param {*} res
 * */
Runtime.prototype.onMainFulfilled = function $Runtime$prototype$onMainFulfilled(res) {
    $Runtime$afterMainCalled(this, res, B00000001);
};

/**
 * @public
 * @memberOf {Runtime}
 * @method
 *
 * @param {*} res
 * */
Runtime.prototype.onMainFulfilled2 = function $Runtime$prototype$onMainFulfilled2(res) {
    $Runtime$afterMainCalled2(this, res, B00000001);
};

/**
 * @public
 * @memberOf {Runtime}
 * @method
 *
 * @param {*} err
 * */
Runtime.prototype.onMainRejected = function $Runtime$prototype$onMainRejected(err) {
    this.context.logger.error(err);
    $Runtime$afterMainCalled(this, err, B00000010);
};

/**
 * @public
 * @memberOf {Runtime}
 * @method
 *
 * @param {*} err
 * */
Runtime.prototype.onMainRejected2 = function $Runtime$prototype$onMainRejected2(err) {
    this.context.logger.error(err);
    $Runtime$afterMainCalled2(this, err, B00000010);
};

/**
 * @public
 * @memberOf {Runtime}
 * @method
 *
 * @returns {*}
 * */
Runtime.prototype.valueOf = function () {
    return this.value;
};

/**
 * @public
 * @memberOf {Runtime}
 * @method
 *
 * @returns {Boolean}
 * */
Runtime.prototype.isAccepted = function () {
    return (this.statusBits & B00000001) > 0;
};

/**
 * @public
 * @memberOf {Runtime}
 * @method
 *
 * @returns {Boolean}
 * */
Runtime.prototype.isRejected = function () {
    return (this.statusBits & B00000010) > 0;
};

/**
 * @public
 * @memberOf {Runtime}
 * @method
 *
 * @returns {Boolean}
 * */
Runtime.prototype.isResolved = function () {
    return (this.statusBits & B00000011) > 0;
};

function $Runtime$fbind(func, runtime) {

    function $Runtime$bound(err, res) {
        return func(runtime, err, res);
    }

    return $Runtime$bound;
}

function $Runtime$doneChild(runtime, parent) {
    var name;

    //  parent skipped, do nothing
    // NOTE: it is possible if one dependency flushes the track, and flush was bubbled to parent,
    // then, next dependency tries to finish execution
    if (parent.statusBits & B00000100) {
        return;
    }

    if (runtime.statusBits & B00000100) {
        // runtime is skipped
        // set parent is skipped
        parent.statusBits |= B00000100;
        $Runtime$finish(parent);
        return;
    }

    name = runtime.unit.name;

    //  is accepted
    if (runtime.statusBits & B00000001) {
        //  set need update to parent if this is updated
        parent.statusBits |= runtime.statusBits & B00001000;
        parent.keys[parent.unit.depsIndex[name]] = runtime.identity;
        Obus.add(parent.context.result, parent.unit.depsMap[name], runtime.value);
    } else {
        //  is rejected
        //  set parent skip cache
        parent.statusBits |= B00010000;
        Obus.add(parent.context.errors, parent.unit.depsMap[name], runtime.value);
    }

    parent.pathsLeft -= 1;

    if (parent.pathsLeft === 0) {
        $Runtime$execute(parent);
    }
}

function $Runtime$execute(runtime) {
    if (runtime.statusBits & B00010000) {
        // need skip cache
        $Runtime$callUnitWithNoCacheUpdating(runtime);
        return;
    }

    // init cache key
    runtime.cacheKey = runtime.unit.name + '-' + runtime.identity + '-' + runtime.keys.join('-');

    if (runtime.statusBits & B00001000) {
        // need update
        $Runtime$callUnit(runtime);
        return;
    }

    // async
    runtime.unit.cache.get(runtime.cacheKey, $Runtime$fbind($Runtime$onCacheGot, runtime));
}

function $Runtime$callUnit(runtime) {
    return Bluebird.attempt($Runtime$callUnitMain, runtime).
        bind(runtime).done(runtime.onMainFulfilled, runtime.onMainRejected);
}

function $Runtime$callUnitWithNoCacheUpdating(runtime) {
    return Bluebird.attempt($Runtime$callUnitMain, runtime).
        bind(runtime).done(runtime.onMainFulfilled2, runtime.onMainRejected2);
}

function $Runtime$onCacheGot(runtime, err, res) {
    if (!err && res) {
        runtime.context.logger.debug('Found in cache');
        runtime.value = res.value;
        // set is accepted
        runtime.statusBits |= B00000001;
        $Runtime$finish(runtime);
        return;
    }

    if (err) {
        runtime.context.logger.warn(err);
    } else {
        runtime.context.logger.debug('Outdated');
    }

    // set need update
    runtime.statusBits |= B00001000;

    $Runtime$callUnit(runtime);
}

function $Runtime$finish(runtime) {
    var i;
    var l;
    var listener;
    var listeners = runtime.listeners;
    var timePassed = new Date() - runtime.creationDate;

    // set `finished` bit
    runtime.statusBits |= B00100000;

    if (runtime.statusBits & B00000001) {
        //  is accepted
        runtime.context.logger.debug('Accepted in %dms', timePassed);
    } else if (runtime.statusBits & B00000010) {
        //  is rejected
        runtime.context.logger.debug('Rejected in %dms', timePassed);
    } else {
        runtime.context.logger.debug('Skipping in %dms', timePassed);
    }

    (0, runtime.done)(runtime, runtime.parent);

    for (i = 0, l = listeners.length; i < l; i += 1) {
        listener = listeners[i];
        (0, listener.done)(runtime, listener.parent);
    }
}

function $Runtime$callUnitMain(runtime) {
    return runtime.unit.main(runtime.track, runtime.context);
}

function $Runtime$afterMainCalled(runtime, value, statusBitMask) {
    // set skipping if track is flushed + updating + accepted or rejected
    runtime.statusBits |= B00000100 * runtime.track.isFlushed() | B00001000 | statusBitMask;
    // assign value to runtime
    runtime.value = value;

    // skipping or rejected
    if ((runtime.statusBits & B00000110) === 0) {
        runtime.unit.cache.set(runtime.cacheKey, {value: value},
            runtime.unit.maxAge, $Runtime$fbind($Runtime$onCacheSet, runtime));
    }

    $Runtime$finish(runtime);
}

function $Runtime$afterMainCalled2(runtime, value, statusBitMask) {
    // set skipping if track is flushed + updating + accepted or rejected
    runtime.statusBits |= B00000100 * runtime.track.isFlushed() | B00001000 | statusBitMask;
    // assign value to runtime
    runtime.value = value;

    $Runtime$finish(runtime);
}

function $Runtime$onCacheSet(runtime, err) {
    if (err) {
        runtime.context.logger.warn(err);
    } else {
        runtime.context.logger.debug('Updated');
    }
}

module.exports = Runtime;
