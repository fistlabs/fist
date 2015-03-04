'use strict';

var Promise = require('bluebird');

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

// accepted and rejected
var B00000011 = B00000010 | B00000001;
// skip cache + updating
var B00011000 = B00010000 | B00001000;
// updated + accepted
var B00001001 = B00001000 | B00000001;
// skip cache + updating + skipping + accepted
var B00011101 = B00011000 | B00000100 | B00000001;

var Context = /** @type Context */ require('./context');
var Obus = /** @type Obus */ require('obus');

var maxRunDepth = 1;

var DEFAULT_KEYS = [];

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
    var context = new Context.Lite();

    // add default context params
    context.addParams(unit.params);
    // add track's params
    context.addParams(track.params);
    // add local args
    context.addParams(args);

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
    this.subscribeMethod = 'setListener';

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
    // All request unit calls
    var allUnitRuns = track.calls;
    // Host application
    var app = unit.app;
    var deps;
    var l;
    var pos = 0;
    var identity;
    var unitRuns;
    var stack = new Array(maxRunDepth);
    var unitName;
    var runtime = new this(unit, track, null, args, done);
    var childRuntime;
    var childUnit;
    var childUnitName;
    var runtimeLogger;
    var listener;

    stack[pos] = runtime;

    do {
        // unpack stack item
        runtime = stack[pos];
        unit = runtime.unit;
        identity = runtime.identity;
        unitName = unit.name;

        // check for allocated runs object
        if (allUnitRuns.hasOwnProperty(unitName)) {
            // The unit was already called
            unitRuns = allUnitRuns[unitName];
        } else {
            // First unit call
            unitRuns = allUnitRuns[unitName] = {};
        }

        // check for existing execution
        if (unitRuns.hasOwnProperty(identity)) {
            listener = runtime;
            runtime = unitRuns[identity];
            // execution exist
            runtime[runtime.subscribeMethod](listener);
            continue;
        }

        // bind unit's logger to track and execution identity
        runtimeLogger = unit.logger.bind(track.id).bind(identity);

        // rly need this shit? Is it makes sense?
        runtimeLogger.debug('Running...');

        // Now we can complete runtime initialization
        runtime.context = new Context(runtime.context.params, runtimeLogger);

        // TODO is it strange to always allocate Date just for debug, even that is not enabled?
        // is it real creation date?
        runtime.creationDate = new Date();

        // Should skip cache if maxAge lt 0 or invalid
        runtime.statusBits = B00010000 * !(unit.maxAge > 0);

        // Set execution
        unitRuns[identity] = runtime;

        deps = unit.deps;
        l = runtime.pathsLeft = deps.length;

        if (l === 0) {
            // no deps, execute runtime
            $Runtime$execute(runtime);
            continue;
        }

        runtime.keys = new Array(l);

        // deps raises child runtimes
        while (l) {
            l -= 1;
            childUnitName = deps[l];
            args = unit.depsArgs[childUnitName](track, runtime.context);
            childUnit = app.getUnit(childUnitName);
            childRuntime = new Runtime(childUnit, track, runtime, args, $Runtime$doneChild);

            stack[pos] = childRuntime;
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
 * @param {Runtime} listener
 * */
Runtime.prototype.setListener = function (listener) {
    this.listeners.push(listener);
};

/**
 * @public
 * @memberOf {Runtime}
 * @method
 *
 * @param {Runtime} listener
 * */
Runtime.prototype.doneListener = function (listener) {
    var done = listener.done;

    // copy original execution state to listener
    listener.statusBits = this.statusBits;
    listener.value = this.value;
    listener.context = this.context;

    // run done with no context
    done(listener);
};

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
 * @returns {Number}
 * */
Runtime.prototype.getTimePassed = function $Runtime$prototype$getTimePassed() {
    return new Date() - this.creationDate;
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

function $Runtime$doneChild(listener) {
    var name;
    var parent = listener.parent;

    //  parent skipped, do nothing
    // NOTE: it is possible if one dependency flushes the track, and flush was bubbled to parent,
    // then, next dependency tries to finish execution
    if (parent.statusBits & B00000100) {
        return;
    }

    if (listener.statusBits & B00000100) {
        // listener is skipped
        // set parent is skipped
        parent.statusBits |= B00000100;
        $Runtime$finish(parent);
        return;
    }

    name = listener.unit.name;

    //  is accepted
    if (listener.statusBits & B00000001) {
        //  set need update to parent if this is updated
        parent.statusBits |= listener.statusBits & B00001000;
        parent.keys[parent.unit.depsIndex[name]] = listener.identity;
        Obus.add(parent.context.result, parent.unit.depsMap[name], listener.value);
    } else {
        //  is rejected
        //  set parent skip cache
        parent.statusBits |= B00010000;
        Obus.add(parent.context.errors, parent.unit.depsMap[name], listener.value);
    }

    parent.pathsLeft -= 1;

    if (parent.pathsLeft === 0) {
        $Runtime$execute(parent);
    }
}

function $Runtime$execute(runtime) {
    runtime.cacheKey = runtime.unit.name + '-' + runtime.identity + '-' + runtime.keys.join('-');

    // need update or need skip cache
    if (runtime.statusBits & B00011000) {
        // do not check for cache, just invoke unit
        $Runtime$callUnit(runtime);
        return;
    }

    // async
    runtime.unit.cache.get(runtime.cacheKey, $Runtime$fbind($Runtime$onCacheGot, runtime));
}

function $Runtime$callUnit(runtime) {
    return Promise.attempt($Runtime$callUnitMain, [runtime]).
        bind(runtime).done(runtime.onMainFulfilled, runtime.onMainRejected);
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
    var listeners = runtime.listeners;
    var done = runtime.done;

    runtime.subscribeMethod = 'doneListener';

    if (runtime.statusBits & B00000001) {
        //  is accepted
        runtime.context.logger.debug('Accepted in %dms', runtime.getTimePassed());
    } else if (runtime.statusBits & B00000010) {
        //  is rejected
        runtime.context.logger.debug('Rejected in %dms', runtime.getTimePassed());
    } else {
        runtime.context.logger.debug('Skipping in %dms', runtime.getTimePassed());
    }

    done(runtime);

    for (i = 0, l = listeners.length; i < l; i += 1) {
        runtime.doneListener(listeners[i]);
    }
}

function $Runtime$callUnitMain(runtime) {
    return runtime.unit.main(runtime.track, runtime.context);
}

function $Runtime$afterMainCalled(runtime, value, statusBitMask) {

    if (runtime.track.isFlushed()) {
        // set is skipped
        runtime.statusBits |= B00000100;
    }

    runtime.value = value;
    // set updated and (accepted or rejected)
    runtime.statusBits |= B00001000 | statusBitMask;

    // if cache skipped, why we should do this check?
    // !skip cache & updating & !skipping & accepted
    if ((runtime.statusBits & B00011101) === B00001001) {
        value = {value: value};
        runtime.unit.cache.set(runtime.cacheKey, value,
            runtime.unit.maxAge, $Runtime$fbind($Runtime$onCacheSet, runtime));
    }

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
