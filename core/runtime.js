'use strict';

//  TODO separate tests
//  TODO dump!

// resolved
var B01100000 = parseInt('01100000', 2);

// accepted
var B01000000 = parseInt('01000000', 2);

// rejected
var B00100000 = parseInt('00100000', 2);

// skipped
var B00010000 = parseInt('00010000', 2);

// updated
var B00001000 = parseInt('00001000', 2);

// need update
var B00000100 = parseInt('00000100', 2);

// skip cache
var B00000010 = parseInt('00000010', 2);

// need update + skip cache
var B00000110 = parseInt('00000110', 2);

// is accepted and need update
var B01000100 = parseInt('01000100', 2);

// is accepted and skipped and need update and skip cache
var B01010110 = parseInt('01010110', 2);

var Context = /** @type Context */ require('./context');
var Obus = /** @type Obus */ require('obus');

var vow = require('vow');

function CallWait() {
    this.onOk = [];
    this.runtime = null;
}

CallWait.prototype.wait = function $CallWait$prototype$wait(runtime) {
    if (this.runtime) {
        this.runtime.done = runtime.done;
        this.runtime.parent = runtime.parent;
        this.runtime.done();
        return true;
    }

    return this.onOk.push(runtime) > 1;
};

CallWait.prototype.emitDone = function $CallWait$prototype$emitDone(runtime) {
    var i;
    var l = this.onOk.length;
    this.runtime = runtime;

    for (i = 0; i < l; i += 1) {
        this.runtime.done = this.onOk[i].done;
        this.runtime.parent = this.onOk[i].parent;
        this.runtime.done();
    }
};

/**
 * @class Runtime
 * @extends Context
 * */
function Runtime(app, unit, track, parent, done) {
    Context.call(this, track.logger.bind(unit.name));

    this.app = app;
    this.unit = unit;
    this.track = track;
    this.parent = parent;
    this.done = done;

    this.pathsLeft = unit.deps.length;
    this.keys = new Array(this.pathsLeft);
    this.creationDate = new Date();
    this.cacheKey = '';
    this.identity = '';
    this.runId = '';
    this.value = null;

    this.status = unit.runtimeInitBits;

    _$Runtime$extendParams(this.params, unit.params);
    _$Runtime$extendParams(this.params, track.params);
}

Runtime.prototype = Object.create(Context.prototype);

Runtime.prototype.constructor = Runtime;

Runtime.prototype.isRejected = function () {
    return (this.status & B00100000) > 0;
};

Runtime.prototype.isAccepted = function () {
    return (this.status & B01000000) > 0;
};

Runtime.prototype.isResolved = function () {
    return (this.status & B01100000) > 0;
};

Runtime.prototype.getTimePassed = function () {
    return new Date() - this.creationDate;
};

Runtime.prototype.valueOf = function () {
    return this.value;
};

Runtime.prototype.run = function $Runtime$prototype$run(args) {
    var i;
    var l;
    var name;

    _$Runtime$extendParams(this.params, args);

    this.identity = this.unit.identify(this.track, this);

    this.runId = this.unit.name + '-' + this.identity;

    this.logger.debug('Starting %(runId)j', this);

    if (this.track.calls.hasOwnProperty(this.runId)) {
        this.logger.debug('Identity %(runId)j found', this);
    } else {
        this.track.calls[this.runId] = new CallWait();
    }

    if (this.track.calls[this.runId].wait(this)) {
        //  inline?
        return;
    }

    l = this.pathsLeft;

    this.logger.debug('Pending...');

    //  no any deps
    if (l === 0) {
        this.syncCache();
        return;
    }

    for (i = 0; i < l; i += 1) {
        name = this.unit.deps[i];
        new Runtime(this.app, this.app.getUnit(name), this.track, this, this.asDependency).
            run(this.unit.depsArgs[name](this.track, this));
    }
};

Runtime.prototype.asDependency = function $Runtime$prototype$asDependency() {
    var path;

    //  parent skipped
    if (this.parent.status & B00010000) {
        return;
    }

    //  this skipped
    if (this.status & B00010000) {
        //  set parent is skipped
        this.parent.status |= B00010000;
        this.parent.finish();
        return;
    }

    path = this.parent.unit.depsMap[this.unit.name];

    // is rejected
    if (this.status & B00100000) {
        // set parent skip cache
        this.parent.status |= B00000010;
        Obus.add(this.parent.errors, path, this.valueOf());
    } else {
        //  set need update to parent if this is updated
        this.parent.status |= (this.status & B00001000) >> 1;
        this.parent.keys[this.parent.unit.depsIndexMap[this.parent.unit.name]] = this.identity;
        Obus.add(this.parent.result, path, this.valueOf());
    }

    this.parent.pathsLeft -= 1;

    if (this.parent.pathsLeft  === 0) {
        this.parent.syncCache();
    }
};

Runtime.prototype.finish = function $Runtime$prototype$finish() {
    var execTime = this.getTimePassed();

    if (this.status & B00100000) {
        // is rejected
        this.logger.debug('Rejected in %dms', execTime);
    } else if (this.status & B01000000) {
        // is accepted
        this.logger.debug('Accepted in %dms', execTime);
    } else {
        this.logger.debug('Skipping in %dms', execTime);
    }

    this.track.calls[this.runId].emitDone(this);
};

Runtime.prototype.syncCache = function $Runtime$prototype$syncCache() {
    this.cacheKey = this.unit.name + '-' + this.identity + '-' + this.keys.join('-');

    // need update or need skip cache
    if (this.status & B00000110) {
        this.callUnitMain();
        return;
    }

    // inline?
    this.getFromCache();
};

Runtime.prototype.getFromCache = function $Runtime$prototype$getFromCache() {
    var self = this;
    //  closure...
    this.unit.cache.get(this.cacheKey, function (err, data) {
        if (!err && data) {
            self.logger.debug('Found in cache');
            self.value = data.value;
            // set is accepted
            self.status |= B01000000;
            self.finish();
            return;
        }

        if (err) {
            self.logger.warn(err);
        } else {
            self.logger.debug('Outdated');
        }

        // set need update
        self.status |= B00000100;

        self.callUnitMain();
    });
};

Runtime.prototype.callUnitMain = function $Runtime$prototype$callUnitMain() {
    /** @this {Runtime} */
    vow.invoke(function (self) {
        return self.unit.main(self.track, self);
    }, this).done(function (res) {
        this.afterMainCalled(res, B01000000);
    }, function (err) {
        this.logger.error(err);
        this.afterMainCalled(err, B00100000);
    }, this);
};

Runtime.prototype.afterMainCalled = function $Runtime$prototype$afterMainCalled(value, statusMask) {
    var self = this;

    if (this.track.isFlushed()) {
        // set is skipped
        this.status |= B00010000;
    }

    this.value = value;
    // set updated and (accepted or rejected)
    this.status |= B00001000 | statusMask;

    // is accepted and not skipped and need update and not skip cache
    if ((this.status & B01010110) === B01000100) {
        //  closure ....
        this.unit.cache.set(this.cacheKey, {value: value}, this.unit.maxAge, function (err) {
            if (err) {
                self.logger.warn(err);
            } else {
                self.logger.debug('Updated');
            }
        });
    }

    this.finish();
};

function _$Runtime$extendParams(obj, src) {
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

    // for (k in src) {
    //    if (hasProperty.call(src, k) && src[k] !== void 0) {
    //        obj[k] = src[k];
    //    }
    // }

    return obj;
}

module.exports = Runtime;
