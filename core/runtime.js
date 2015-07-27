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

var maxStackSize = 1;

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
    this.keys = [];

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
    this.value = undefined;

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
    this.cacheKey = unit.app.params.name;
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
    // All request unit calls
    var runtimeCache = track.calls;
    // Host application
    var app = unit.app;
    var deps;
    var l;
    var pos = 0;
    var identity;
    var existingRuns;
    var stack = new Array(maxStackSize);
    var runtime = new this(unit, track, null, args, done);
    var unitName;
    var logger;

    stack[pos] = runtime;

    do {
        // unpack stack item
        runtime = stack[pos];
        unit = runtime.unit;
        identity = runtime.identity;
        unitName = unit.name;

        // check for allocated runs object
        if (runtimeCache.hasOwnProperty(unitName)) {
            // The unit was already called
            existingRuns = runtimeCache[unitName];
        } else {
            // First time unit call
            existingRuns = runtimeCache[unitName] = {};
        }

        // check for existing execution
        if (existingRuns.hasOwnProperty(identity)) {
            // execution exist, set finish listener for existing execution
            $Runtime$addListener(existingRuns[identity], runtime);
            continue;
        }

        // memorize new execution by identity
        existingRuns[identity] = runtime;

        // bind unit's logger to track and execution identity
        logger = unit.logger.bind(track.id);

        // Now we can complete runtime initialization

        // Upgrade ContextLite to Context
        runtime.context = new Context(runtime.context.params, logger);

        // is not it so extraneous?
        logger.debug('Running...');

        // Set runtime creation date
        runtime.creationDate = new Date();

        // Set `skip cache` bit if maxAge less than 0 or not a number
        runtime.statusBits = B00010000 * !(unit.maxAge > 0);

        deps = unit.deps;
        l = runtime.pathsLeft = deps.length;

        if (l === 0) {
            // no deps, immediately execute runtime
            $Runtime$execute(runtime);
            continue;
        }

        // Allocate an array for deps identities
        runtime.keys = new Array(l);

        // deps raises child runtimes
        while (l) {
            l -= 1;
            unitName = deps[l];
            args = unit.depsArgs[unitName](track, runtime.context);
            stack[pos] = new this(app.getUnit(unitName), track, runtime, args, $Runtime$doneChild);
            pos += 1;
        }

        // auto adjust initial stack size, for future runs
        maxStackSize = Math.max(pos, maxStackSize);
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

function $Runtime$addListener(parent, runtime) {
    if (parent.statusBits & B00100000) {
        // has `finished` bit
        (0, runtime.done)(parent, runtime.parent);
    } else {
        // intermediate yet
        parent.listeners.push(runtime);
    }
}

function $Runtime$fbind(func, runtime) {
    return function $Runtime$bound(err, res) {
        return func(runtime, err, res);
    };
}

function $Runtime$doneChild(runtime, parent) {
    var name;

    //  parent has `skipping` bit
    //  NOTE: it is possible if one dependency flushes the track, and flush was bubbled to parent,
    //  then, next dependency tries to finish execution, this guard needed to prevent multiple runtime finishing
    if (parent.statusBits & B00000100) {
        return;
    }

    if (runtime.statusBits & B00010000) {
        // runtime has `skip cache` bit
        parent.statusBits |= B00010000;
    }

    if (runtime.statusBits & B00000100) {
        // runtime has `skipping` bit
        // set `skipping` bit to parent
        parent.statusBits |= B00000100;
        $Runtime$finish(parent);
        return;
    }

    name = runtime.unit.name;

    if (runtime.statusBits & B00000001) {
        //  runtime has `accepted` bit
        //  set `updating` bit to parent if runtime has `updating` bit
        parent.statusBits |= runtime.statusBits & B00001000;
        // add children identity to parent as part for cache key
        parent.keys[parent.unit.depsIndex[name]] = runtime.identity;
        // add children execution result to parent's context
        Obus.add(parent.context.result, parent.unit.depsMap[name], runtime.value);
    } else {
        //  has `rejected` bit
        //  set parent skip cache
        parent.statusBits |= B00010000;
        // add children execution fail reason to parent's context
        Obus.add(parent.context.errors, parent.unit.depsMap[name], runtime.value);
    }

    // reduce the counter of resolved dependencies
    parent.pathsLeft -= 1;

    if (parent.pathsLeft === 0) {
        // all the dependencies was resolved
        $Runtime$execute(parent);
    }
}

function $Runtime$execute(runtime) {
    if (runtime.statusBits & B00010000) {
        // has `skip cache` bit
        $Runtime$callUnitWithNoCacheUpdating(runtime);
        return;
    }

    // init cache key
    runtime.cacheKey += '-' + runtime.unit.name + '-' + runtime.identity + '-' + runtime.keys.join('-');

    if (runtime.statusBits & B00001000) {
        // has `updating` bit
        $Runtime$callUnit(runtime);
        return;
    }

    // Try to get cached result for runtime
    runtime.unit.cache.get(runtime.cacheKey, $Runtime$fbind($Runtime$onCacheGot, runtime));
}

function $Runtime$callUnit(runtime) {
    return Bluebird.attempt($Runtime$callUnitMain, runtime).
        done(function (res) {
            // Tear down unit.main() call
            $Runtime$afterMainCalled(runtime, res, B00000001);
        }, function (err) {
            // unit.main() was not successfully completed
            runtime.context.logger.error(err);
            // Tear down unit.main() call
            $Runtime$afterMainCalled(runtime, err, B00000010);
        });
}

function $Runtime$callUnitWithNoCacheUpdating(runtime) {
    // Same as $Runtime$callUnit, but does not tries to update cache with returned result
    return Bluebird.attempt($Runtime$callUnitMain, runtime).
        done(function (res) {
            $Runtime$afterMainCalled2(runtime, res, B00000001);
        }, function (err) {
            runtime.context.logger.error(err);
            $Runtime$afterMainCalled2(runtime, err, B00000010);
        });
}

function $Runtime$callUnitMain(runtime) {
    return runtime.unit.main(runtime.track, runtime.context);
}

function $Runtime$onCacheGot(runtime, err, res) {
    if (res) {
        runtime.context.logger.debug('Found in cache');
        runtime.value = res.value;
        // set `accepted` bit
        runtime.statusBits |= B00000001;
        $Runtime$finish(runtime);
        return;
    }

    if (err) {
        runtime.context.logger.warn(err);
    } else {
        // value was not found in cache
        runtime.context.logger.debug('Outdated');
    }

    // set `updating` bit, schedule update
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
        //  has `accepted` bit
        runtime.context.logger.debug('Accepted in %dms', timePassed);
    } else if (runtime.statusBits & B00000010) {
        //  has `rejected` bit
        runtime.context.logger.debug('Rejected in %dms', timePassed);
    } else {
        // has no both `accepted` and `rejected` bits
        runtime.context.logger.debug('Skipping in %dms', timePassed);
    }

    // call runtime.done without context
    (0, runtime.done)(runtime, runtime.parent);

    for (i = 0, l = listeners.length; i < l; i += 1) {
        listener = listeners[i];
        // call listener.done without context
        (0, listener.done)(runtime, listener.parent);
    }
}

function $Runtime$afterMainCalled(runtime, value, statusBitMask) {
    // set `skipping` bit if track is flushed + `updating` + statusBitMask bits
    runtime.statusBits |= B00000100 * runtime.track.isFlushed() | B00001000 | statusBitMask;
    // assign value to a runtime
    runtime.value = value;

    if ((runtime.statusBits & B00000110) === 0) {
        // has no `skipping` and/or `rejected` bits
        runtime.unit.cache.set(runtime.cacheKey, {value: value},
            runtime.unit.maxAge, $Runtime$fbind($Runtime$onCacheSet, runtime));
    }

    $Runtime$finish(runtime);
}

function $Runtime$afterMainCalled2(runtime, value, statusBitMask) {
    // set `skipping` bit if track is flushed + `updating` + statusBitMask bits
    runtime.statusBits |= B00000100 * runtime.track.isFlushed() | B00001000 | statusBitMask;
    // assign value to a runtime
    runtime.value = value;

    $Runtime$finish(runtime);
}

function $Runtime$onCacheSet(runtime, err) {
    // Just noop function, cache set issues
    if (err) {
        runtime.context.logger.warn(err);
    } else {
        runtime.context.logger.debug('Updated');
    }
}

module.exports = Runtime;
