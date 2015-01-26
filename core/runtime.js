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
var RuntimeFinishWait = /** @type RuntimeFinishWait */ require('./utils/runtime-finish-wait');

var vow = require('vow');

/**
 * @class Runtime
 * @extends Context
 *
 * @param {Core} app
 * @param {Unit} unit
 * @param {Track} track
 * @param {Runtime} [parent]
 * @param {Object} [args]
 * @param {Function} done
 *
 * @constructs
 * */
function Runtime(app, unit, track, parent, args, done) {
    /*eslint max-params: 0*/
    /**
     * The host application instance
     *
     * @public
     * @memberOf {Runtime}
     * @property
     * @type {Core}
     * */
    this.app = app;

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
     * The key for cache
     *
     * @public
     * @memberOf {Runtime}
     * @property
     * @type {String}
     * */
    this.cacheKey = '';

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
    this.statusBits = unit.runtimeInitBits;

    /**
     * Runtime context
     *
     * @public
     * @memberOf {Runtime}
     * @property
     * @type {Context}
     * */
    this.context = new Context(new Obus(), new Obus(), new Obus(),
        unit.logger.bind(track.id)).setParams(unit.params, track.params, args);

    /**
     * Runtime identity is a part of cacheKey and memorization key
     *
     * @public
     * @memberOf {Runtime}
     * @property
     * @type {String}
     * */
    this.identity = unit.identify(track, this.context);

    /**
     * Runtime logger
     *
     * @public
     * @memberOf {Runtime}
     * @property
     * @type {Context}
     * */
    this.logger = this.context.logger = this.context.logger.bind(this.identity);

    /**
     * The id of this runtime
     *
     * @public
     * @memberOf {Runtime}
     * @property
     * @type {String}
     * */
    this.runId = unit.name + '-' + this.identity;
}

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
 * @param {Function} func
 *
 * @returns {Function}
 * */
Runtime.prototype.fbind = function $Runtime$prototype$fbind(func) {

    function $Runtime$prototype$bound(err, res) {
        $Runtime$prototype$bound.self.__tmpMethod = $Runtime$prototype$bound.func;
        return $Runtime$prototype$bound.self.__tmpMethod(err, res);
    }

    $Runtime$prototype$bound.func = func;
    $Runtime$prototype$bound.self = this;

    return $Runtime$prototype$bound;
};

/**
 * @public
 * @memberOf {Runtime}
 * @method
 * */
Runtime.prototype.start = function $Runtime$prototype$run() {
    var i;
    var l;

    if (!this.track.calls.hasOwnProperty(this.runId)) {
        //  unique unit request
        this.logger.debug('Running...');
        this.track.calls[this.runId] = new RuntimeFinishWait();
    }

    if (this.track.calls[this.runId].wait(this)) {
        return;
    }

    l = this.pathsLeft;

    if (l === 0) {
        this.syncCache();
        return;
    }

    for (i = 0; i < l; i += 1) {
        this.createDependency(this.unit.deps[i]).start();
    }
};

/**
 * @public
 * @memberOf {Runtime}
 * @method
 *
 * @param {String} name
 *
 * @returns {Runtime}
 * */
Runtime.prototype.createDependency = function $Runtime$prototype$createDependency(name) {
    return new Runtime(this.app, this.app.getUnit(name), this.track, this,
        this.unit.depsArgs[name](this.track, this.context), this.doneAsDependency);
};

/**
 * @public
 * @memberOf {Runtime}
 * @method
 * */
Runtime.prototype.doneAsDependency = function $Runtime$prototype$doneAsDependency() {

    //  parent skipped
    if (this.parent.statusBits & B00000100) {
        return;
    }

    //  this skipped
    if (this.statusBits & B00000100) {
        //  set parent is skipped
        this.parent.statusBits |= B00000100;
        this.parent.finish();
        return;
    }

    //  is rejected
    if (this.statusBits & B00000010) {
        //  set parent skip cache
        this.parent.statusBits |= B00010000;
        Obus.add(this.parent.context.errors, this.parent.unit.depsMap[this.unit.name], this.value);
    } else {
        //  set need update to parent if this is updated
        this.parent.statusBits |= this.statusBits & B00001000;
        this.parent.keys[this.parent.unit.depsIndexMap[this.unit.name]] = this.identity;
        Obus.add(this.parent.context.result, this.parent.unit.depsMap[this.unit.name], this.value);
    }

    this.parent.pathsLeft -= 1;

    if (this.parent.pathsLeft === 0) {
        this.parent.syncCache();
    }
};

/**
 * @public
 * @memberOf {Runtime}
 * @method
 * */
Runtime.prototype.syncCache = function $Runtime$prototype$syncCache() {
    this.cacheKey = this.unit.name + '-' + this.identity + '-' + this.keys.join('-');

    // need update or need skip cache
    if (this.statusBits & B00011000) {
        this.callUnitMain();
        return;
    }

    this.unit.cache.get(this.cacheKey, this.fbind(this.onCacheGot));
};

/**
 * @public
 * @memberOf {Runtime}
 * @method
 * */
Runtime.prototype.callUnitMain = function $Runtime$prototype$callUnitMain() {
    vow.invoke(Runtime.callUnitMain, this).
        done(this.onMainFulfilled, this.onMainRejected, this);
};

/**
 * @public
 * @memberOf {Runtime}
 * @method
 *
 * @param {*} err
 * @param {*} res
 * */
Runtime.prototype.onCacheGot = function $Runtime$prototype$onCacheGot(err, res) {
    if (!err && res) {
        this.logger.debug('Found in cache');
        this.value = res.value;
        // set is accepted
        this.statusBits |= B00000001;
        this.finish();
        return;
    }

    if (err) {
        this.logger.warn(err);
    } else {
        this.logger.debug('Outdated');
    }

    // set need update
    this.statusBits |= B00001000;

    this.callUnitMain();
};

/**
 * @public
 * @memberOf {Runtime}
 * @method
 * */
Runtime.prototype.finish = function $Runtime$prototype$finish() {
    if (this.statusBits & B00000010) {
        // is rejected
        this.logger.debug('Rejected in %dms', this.getTimePassed());
    } else if (this.statusBits & B00000001) {
        // is accepted
        this.logger.debug('Accepted in %dms', this.getTimePassed());
    } else {
        this.logger.debug('Skipping in %dms', this.getTimePassed());
    }

    this.track.calls[this.runId].emitDone(this);
};

/**
 * @public
 * @static
 * @memberOf {Runtime}
 * @method
 *
 * @param {Runtime} self
 *
 * @returns {*}
 * */
Runtime.callUnitMain = function $Runtime$callUnitMain(self) {
    return self.unit.main(self.track, self.context);
};

/**
 * @public
 * @memberOf {Runtime}
 * @method
 *
 * @param {*} res
 * */
Runtime.prototype.onMainFulfilled = function $Runtime$prototype$onMainFulfilled(res) {
    this.afterMainCalled(res, B00000001);
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
    this.afterMainCalled(err, B00000010);
};

/**
 * @public
 * @memberOf {Runtime}
 * @method
 *
 * @param {*} value
 * @param {Number} statusBitMask
 * */
Runtime.prototype.afterMainCalled = function $Runtime$prototype$afterMainCalled(value, statusBitMask) {

    if (this.track.isFlushed()) {
        // set is skipped
        this.statusBits |= B00000100;
    }

    this.value = value;
    // set updated and (accepted or rejected)
    this.statusBits |= B00001000 | statusBitMask;

    // !skip cache & updating & !skipping & accepted
    if ((this.statusBits & B00011101) === B00001001) {
        this.unit.cache.set(this.cacheKey, {value: value}, this.unit.maxAge, this.fbind(this.onCacheSet));
    }

    this.finish();
};

/**
 * @public
 * @memberOf {Runtime}
 * @method
 *
 * @param {*} err
 * */
Runtime.prototype.onCacheSet = function $Runtime$prototype$onCacheSet(err) {
    if (err) {
        this.logger.warn(err);
    } else {
        this.logger.debug('Updated');
    }
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

module.exports = Runtime;
