'use strict';

var LRUDictTtl = /** @type LRUDictTtl */ require('./lru-dict-ttl');

/**
 * @class LRUDictTtlAsync
 * @extends LRUDictTtl
 *
 * @param {Number} size
 * */
function LRUDictTtlAsync(size) {
    LRUDictTtl.call(this, size);
}

LRUDictTtlAsync.prototype = Object.create(LRUDictTtl.prototype);

/**
 * @public
 * @memberOf {LRUDictTtlAsync}
 * @method
 *
 * @constructs
 * */
LRUDictTtlAsync.prototype.constructor = LRUDictTtlAsync;

/**
 * @public
 * @memberOf {LRUDictTtlAsync}
 * @method
 *
 * @param {String} key
 * @param {Function} done
 * */
LRUDictTtlAsync.prototype.get = function (key, done) {
    var self = this;
    process.nextTick(function () {
        done(null, LRUDictTtl.prototype.get.call(self, key));
    });
};

/**
 * @public
 * @memberOf {LRUDictTtlAsync}
 * @method
 *
 * @param {String} key
 * @param {*} val
 * @param {Number|Function} [ttl=Infinity]
 * @param {Function} done
 * */
LRUDictTtlAsync.prototype.set = function (key, val, ttl, done) {
    var self = this;

    if (typeof ttl === 'function') {
        done = ttl;
        ttl = void 0;
    }

    process.nextTick(function () {
        done(null, LRUDictTtl.prototype.set.call(self, key, val, ttl));
    });
};

/**
 * @public
 * @memberOf {LRUDictTtlAsync}
 * @method
 *
 * @param {String} key
 * @param {Function} done
 * */
LRUDictTtlAsync.prototype.del = function (key, done) {
    var self = this;
    process.nextTick(function () {
        done(null, LRUDictTtl.prototype.del.call(self, key));
    });
};

/**
 * @public
 * @memberOf {LRUDictTtlAsync}
 * @method
 *
 * @param {String} key
 * @param {Function} done
 * */
LRUDictTtlAsync.prototype.peek = function (key, done) {
    var self = this;
    process.nextTick(function () {
        done(null, LRUDictTtl.prototype.peek.call(self, key));
    });
};

/**
 * @public
 * @memberOf {LRUDictTtlAsync}
 * @method
 *
 * @param {Function} done
 * */
LRUDictTtlAsync.prototype.keys = function (done) {
    var self = this;
    process.nextTick(function () {
        done(null, LRUDictTtl.prototype.keys.call(self));
    });
};

/**
 * @public
 * @memberOf {LRUDictTtlAsync}
 * @method
 *
 * @param {Function} done
 * */
LRUDictTtlAsync.prototype.vals = function (done) {
    var self = this;
    process.nextTick(function () {
        done(null, LRUDictTtl.prototype.vals.call(self));
    });
};

module.exports = LRUDictTtlAsync;
