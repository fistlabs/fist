'use strict';

/**
 * @class RuntimeFinishWait
 * */
function RuntimeFinishWait() {

    /**
     * @public
     * @memberOf {RuntimeFinishWait}
     * @property
     * @type {Array}
     * */
    this.pending = [];

    /**
     * @public
     * @memberOf {RuntimeFinishWait}
     * @property
     * @type {*}
     * */
    this.runtime = null;
}

/**
 * @public
 * @memberOf {RuntimeFinishWait}
 * @method
 *
 * @param {Runtime} runtime
 *
 * @returns {Boolean}
 * */
RuntimeFinishWait.prototype.wait = function $RuntimeFinishWait$prototype$wait(runtime) {
    if (this.runtime) {
        this.doneRuntime(runtime);
        return true;
    }

    return this.pending.push(runtime) > 1;
};

RuntimeFinishWait.prototype.doneRuntime = function (runtime) {
    this.runtime.done = runtime.done;
    this.runtime.parent = runtime.parent;
    this.runtime.done();
};

/**
 * @public
 * @memberOf {RuntimeFinishWait}
 * @method
 *
 * @param {Runtime} runtime
 *
 * @returns {Boolean}
 * */
RuntimeFinishWait.prototype.emitDone = function $RuntimeFinishWait$prototype$emitDone(runtime) {
    var i;
    var l = this.pending.length;
    this.runtime = runtime;

    for (i = 0; i < l; i += 1) {
        this.doneRuntime(this.pending[i]);
    }
};

module.exports = RuntimeFinishWait;
