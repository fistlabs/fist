'use strict';

var LRUDict = /** @type LRUDict */  require('./lru-dict');

/**
 * @class LRUDictTtl
 * @extends LRUDict
 *
 * @param {Number} size
 * */
function LRUDictTtl(size) {
    LRUDict.call(this, size);
}

LRUDictTtl.prototype = Object.create(LRUDict.prototype);

/**
 * @public
 * @memberOf {LRUDictTtl}
 * @method
 *
 * @constructs
 * */
LRUDictTtl.prototype.constructor = LRUDictTtl;

/**
 * @public
 * @memberOf {LRUDictTtl}
 * @method
 *
 * @param {String} key
 * @param {*} val
 * @param {Number} [ttl=Infinity] life time in seconds
 *
 * @returns {LRUDictTtl}
 * */
LRUDictTtl.prototype.set = function (key, val, ttl) {
    return LRUDict.prototype.set.call(this, key, new Entry(val, ttl * 1000));
};

/**
 * @public
 * @memberOf {LRUDictTtl}
 * @method
 *
 * @param {String} key
 *
 * @returns {LRUDictTtl}
 * */
LRUDictTtl.prototype.get = function (key) {
    return val(this, key, LRUDict.prototype.get.call(this, key));
};

/**
 * @public
 * @memberOf {LRUDictTtl}
 * @method
 *
 * @param {String} key
 *
 * @returns {LRUDictTtl}
 * */
LRUDictTtl.prototype.peek = function (key) {
    return val(this, key, LRUDict.prototype.peek.call(this, key));
};

/**
 * @public
 * @memberOf {LRUDictTtl}
 * @method
 *
 * @returns {Array}
 * */
LRUDictTtl.prototype.keys = function () {
    var keys = [];
    var link = this.tail;
    var next;

    while (link) {
        next = link.next;

        if (check(this, link.name, link.data)) {
            keys[keys.length] = link.name;
        }

        link = next;
    }

    return keys;
};

/**
 * @public
 * @memberOf {LRUDictTtl}
 * @method
 *
 * @returns {Array}
 * */
LRUDictTtl.prototype.vals = function () {
    var link = this.tail;
    var next;
    var vals = [];

    while (link) {
        next = link.next;

        if (check(this, link.name, link.data)) {
            vals[vals.length] = link.data.val;
        }

        link = next;
    }

    return vals;
};

function val(self, key, val) {
    if (val && check(self, key, val)) {
        return val.val;
    }

    return void 0;
}

function check(self, key, val) {
    if (val.now + val.ttl < new Date().getTime()) {
        LRUDict.prototype.del.call(self, key);
        return false;
    }

    return true;
}

/**
 * @class Entry
 * @param {*} val
 * @param {Number} [ttl=Infinity]
 * */
function Entry(val, ttl) {

    /**
     * @public
     * @memberOf {Entry}
     * @property
     * @type {*}
     * */
    this.val = val;

    /**
     * @public
     * @memberOf {Entry}
     * @property
     * @type {Number}
     * */
    this.ttl = ttl;

    /**
     * @public
     * @memberOf {Entry}
     * @property
     * @type {Number}
     * */
    this.now = new Date().getTime();
}

module.exports = LRUDictTtl;
