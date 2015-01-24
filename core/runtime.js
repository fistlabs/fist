'use strict';

//  TODO separate tests

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
function Runtime(app, unit, track, parent, args, done) {
    /*eslint max-params: 0*/
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

    this.context = new Context(new Obus(), track.logger.bind(unit.name), new Obus(), new Obus()).
        setParams(unit.params, track.params, args);
}

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

Runtime.prototype.run = function $Runtime$prototype$run() {
    var i;
    var l;
    var name;

    this.identity = this.unit.identify(this.track, this.context);

    this.runId = this.unit.name + '-' + this.identity;

    this.context.logger.debug('Starting %(runId)j', this);

    if (this.track.calls.hasOwnProperty(this.runId)) {
        this.context.logger.debug('Identity %(runId)j found', this);
    } else {
        this.track.calls[this.runId] = new CallWait();
    }

    if (this.track.calls[this.runId].wait(this)) {
        //  inline?
        return;
    }

    l = this.pathsLeft;

    this.context.logger.debug('Pending...');

    //  no any deps
    if (l === 0) {
        this.syncCache();
        return;
    }

    for (i = 0; i < l; i += 1) {
        name = this.unit.deps[i];
        new Runtime(this.app, this.app.getUnit(name), this.track, this,
            this.unit.depsArgs[name](this.track, this.context), this.asDependency).run();
    }
};

Runtime.prototype.asDependency = function $Runtime$prototype$asDependency() {

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

    // is rejected
    if (this.status & B00100000) {
        // set parent skip cache
        this.parent.status |= B00000010;
        Obus.add(this.parent.context.errors, this.parent.unit.depsMap[this.unit.name], this.valueOf());
    } else {
        //  set need update to parent if this is updated
        this.parent.status |= (this.status & B00001000) >> 1;
        this.parent.keys[this.parent.unit.depsIndexMap[this.parent.unit.name]] = this.identity;
        Obus.add(this.parent.context.result, this.parent.unit.depsMap[this.unit.name], this.valueOf());
    }

    this.parent.pathsLeft -= 1;

    if (this.parent.pathsLeft  === 0) {
        this.parent.syncCache();
    }
};

Runtime.prototype.finish = function $Runtime$prototype$finish() {
    if (this.status & B00100000) {
        // is rejected
        this.context.logger.debug('Rejected in %dms', this.getTimePassed());
    } else if (this.status & B01000000) {
        // is accepted
        this.context.logger.debug('Accepted in %dms', this.getTimePassed());
    } else {
        this.context.logger.debug('Skipping in %dms', this.getTimePassed());
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
            self.context.logger.debug('Found in cache');
            self.value = data.value;
            // set is accepted
            self.status |= B01000000;
            self.finish();
            return;
        }

        if (err) {
            self.context.logger.warn(err);
        } else {
            self.context.logger.debug('Outdated');
        }

        // set need update
        self.status |= B00000100;

        self.callUnitMain();
    });
};

Runtime.prototype.callUnitMain = function $Runtime$prototype$callUnitMain() {
    /** @this {Runtime} */
    vow.invoke(function (self) {
        return self.unit.main(self.track, self.context);
    }, this).done(function (res) {
        this.afterMainCalled(res, B01000000);
    }, function (err) {
        this.context.logger.error(err);
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
                self.context.logger.warn(err);
            } else {
                self.context.logger.debug('Updated');
            }
        });
    }

    this.finish();
};

module.exports = Runtime;
