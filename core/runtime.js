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
var vow = require('vow');

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
    // TODO why context.result and context.errors does not creating in Context constructor?
    var context = new Context(Context.createParams(unit.params, track.params, args),
        new Obus(), new Obus(), unit.logger.bind(track.id));

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
    this.pathsLeft = unit.deps.length;

    /**
     * The array of dependency identities
     *
     * @public
     * @memberOf {Runtime}
     * @property
     * @type {Array}
     * */
    this.keys = new Array(this.pathsLeft);

    /**
     * @public
     * @memberOf {Runtime}
     * @property
     * @type {Date}
     * */
    this.creationDate = new Date();

    /**
     * The result, returned from runtime
     *
     * @public
     * @memberOf {Runtime}
     * @property
     * @type {*}
     * */
    this.value = null;

    /**
     * The status of current runtime
     *
     * @public
     * @memberOf {Runtime}
     * @property
     * @type {Number}
     * */
    this.statusBits = B00010000 * !(unit.maxAge > 0);

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
     * Runtime identity is a part of cacheKey and memorization key
     *
     * @public
     * @memberOf {Runtime}
     * @property
     * @type {String}
     * */
    this.identity = unit.identify(track, context);

    /**
     * Runtime logger
     *
     * @public
     * @memberOf {Runtime}
     * @property
     * @type {Context}
     * */
    this.logger = context.logger = context.logger.bind(this.identity);

    /**
     * @public
     * @memberOf {Runtime}
     * @property
     * @type {Array<Runtime>}
     * */
    this.listeners = [];
}

/**
 * TODO inline this method consists of to improve performance
 *
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
Runtime.startRun = function (unit, track, args, done) {
    var app = unit.app;
    var calls = track.calls;
    var deps;
    var l;
    var pos = 0;
    var runId;
    var runtime = new Runtime(unit, track, null, args, done);
    var unitRuns;
    var stack = new Array(maxRunDepth);

    stack[pos] = runtime;

    do {
        runtime = stack[pos];
        unit = runtime.unit;

        if (calls.hasOwnProperty(unit.name)) {
            unitRuns = calls[unit.name];
        } else {
            unitRuns = calls[unit.name] = {};
        }

        runId = runtime.identity;

        if (unitRuns.hasOwnProperty(runId)) {
            unitRuns[runId].wait(runtime);
            continue;
        }

        runtime.logger.debug('Running...');
        unitRuns[runId] = runtime;

        l = runtime.pathsLeft;

        if (l === 0) {
            $Runtime$execute(runtime);
            continue;
        }

        deps = unit.deps;

        while (l) {
            l -= 1;
            stack[pos] = $Runtime$fork(runtime, app.getUnit(deps[l]));
            pos += 1;
        }

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
 * @param {Runtime} sameIdentityRuntime
 * */
Runtime.prototype.wait = function (sameIdentityRuntime) {
    this.listeners.push(sameIdentityRuntime);
};

/**
 * The key for cache
 *
 * @public
 * @memberOf {Runtime}
 * @property
 * @type {String}
 * */
Object.defineProperty(Runtime.prototype, 'cacheKey', {
    get: function () {
        return this.unit.name + '-' + this.identity + '-' + this.keys.join('-');
    }
});

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
    this.logger.error(err);
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

function $Runtime$fbind(func, self) {

    function $Runtime$bound(err, res) {
        return func(self, err, res);
    }

    return $Runtime$bound;
}

function $Runtime$fork(self, unit) {
    var track = self.track;
    return new Runtime(unit, track, self,
        self.unit.depsArgs[unit.name](track, self.context), $Runtime$doneAsDependency);
}

function $Runtime$doneAsDependency() {
    var name;
    var self = this;
    var parent = self.parent;

    //  parent skipped
    if (parent.statusBits & B00000100) {
        return;
    }

    //  this skipped
    if (self.statusBits & B00000100) {
        //  set parent is skipped
        parent.statusBits |= B00000100;
        $Runtime$finish(parent);
        return;
    }

    name = self.unit.name;

    //  is accepted
    if (self.statusBits & B00000001) {
        //  set need update to parent if this is updated
        parent.statusBits |= self.statusBits & B00001000;
        parent.keys[parent.unit.depsIndex[name]] = self.identity;
        Obus.add(parent.context.result, parent.unit.depsMap[name], self.value);
    } else {
        //  is rejected
        //  set parent skip cache
        parent.statusBits |= B00010000;
        Obus.add(parent.context.errors, parent.unit.depsMap[name], self.value);
    }

    parent.pathsLeft -= 1;

    if (parent.pathsLeft === 0) {
        $Runtime$execute(parent);
    }
}

function $Runtime$execute(self) {
    // need update or need skip cache
    if (self.statusBits & B00011000) {
        $Runtime$callUnit(self);
        return;
    }

    self.unit.cache.get(self.cacheKey, $Runtime$fbind($Runtime$onCacheGot, self));
}

function $Runtime$callUnit(self) {
    vow.invoke($Runtime$callUnitMain, self).
        done(self.onMainFulfilled, self.onMainRejected, self);
}

function $Runtime$onCacheGot(self, err, res) {
    if (!err && res) {
        self.logger.debug('Found in cache');
        self.value = res.value;
        // set is accepted
        self.statusBits |= B00000001;
        $Runtime$finish(self);
        return;
    }

    if (err) {
        self.logger.warn(err);
    } else {
        self.logger.debug('Outdated');
    }

    // set need update
    self.statusBits |= B00001000;

    $Runtime$callUnit(self);
}

function $Runtime$finish(self) {
    var i;
    var l;
    var listeners = self.listeners;

    self.wait = $Runtime$doneImmediately;

    if (self.statusBits & B00000001) {
        //  is accepted
        self.logger.debug('Accepted in %dms', self.getTimePassed());
    } else if (self.statusBits & B00000010) {
        //  is rejected
        self.logger.debug('Rejected in %dms', self.getTimePassed());
    } else {
        self.logger.debug('Skipping in %dms', self.getTimePassed());
    }

    self.done();

    for (i = 0, l = listeners.length; i < l; i += 1) {
        $Runtime$doneOther(self, listeners[i]);
    }
}

function $Runtime$doneImmediately(other) {
    $Runtime$doneOther(this, other);
}

function $Runtime$doneOther(self, other) {
    self.done = other.done;
    self.parent = other.parent;
    self.done();
}

function $Runtime$callUnitMain(self) {
    return self.unit.main(self.track, self.context);
}

function $Runtime$afterMainCalled(self, value, statusBitMask) {

    if (self.track.isFlushed()) {
        // set is skipped
        self.statusBits |= B00000100;
    }

    self.value = value;
    // set updated and (accepted or rejected)
    self.statusBits |= B00001000 | statusBitMask;

    // !skip cache & updating & !skipping & accepted
    if ((self.statusBits & B00011101) === B00001001) {
        value = {value: value};
        self.unit.cache.set(self.cacheKey, value, self.unit.maxAge, $Runtime$fbind($Runtime$onCacheSet, self));
    }

    $Runtime$finish(self);
}

function $Runtime$onCacheSet(self, err) {
    if (err) {
        self.logger.warn(err);
    } else {
        self.logger.debug('Updated');
    }
}

module.exports = Runtime;
