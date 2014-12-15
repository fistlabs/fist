'use strict';

/**
 * @class LRUDict
 * @param {Number} [size]
 * */
function LRUDict(size) {

    /**
     * @public
     * @readonly
     * @memberOf {LRUDict}
     * @property
     * @type {Object}
     * */
    this.links = Object.create(null);

    /**
     * @public
     * @readonly
     * @memberOf {LRUDict}
     * @property
     * @type {Link}
     * */
    this.tail = null;

    /**
     * @public
     * @readonly
     * @memberOf {LRUDict}
     * @property
     * @type {Link}
     * */
    this.head = null;

    /**
     * @public
     * @readonly
     * @memberOf {LRUDict}
     * @property
     * @type {Number}
     * */
    this.size = size;

    /**
     * @public
     * @readonly
     * @memberOf {LRUDict}
     * @property
     * @type {Number}
     * */
    this.length = 0;
}

/**
 * @public
 * @memberOf {LRUDict}
 * @method
 *
 * @constructs
 * */
LRUDict.prototype.constructor = LRUDict;

/**
 * @public
 * @memberOf {LRUDict}
 * @method
 *
 * @param {String} key
 * @param {*} val
 *
 * @returns {LRUDict}
 * */
LRUDict.prototype.set = function (key, val) {
    var link;

    unlink(this, this.links[key]);

    //  If size is NaN, then unbounded
    while (this.length >= this.size) {
        link = this.tail;

        if (unlink(this, link)) {
            delete this.links[link.name];
            continue;
        }

        return this;
    }

    link = new Link(key, val, null, null);
    push(this, link);
    this.links[key] = link;

    return this;
};

/**
 * @public
 * @memberOf {LRUDict}
 * @method
 *
 * @param {String} key
 *
 * @returns {Boolean}
 * */
LRUDict.prototype.del = function (key) {
    if (unlink(this, this.links[key])) {
        delete this.links[key];

        return true;
    }

    return false;
};

/**
 * @public
 * @memberOf {LRUDict}
 * @method
 *
 * @param {String} key
 *
 * @returns {*}
 * */
LRUDict.prototype.get = function (key) {
    var link = unlink(this, this.links[key]);

    if (link) {
        push(this, link);
        link = link.data;
    }

    return link;
};

/**
 * @public
 * @memberOf {LRUDict}
 * @method
 *
 * @param {String} key
 *
 * @returns {*}
 * */
LRUDict.prototype.peek = function (key) {
    return this.links[key] && this.links[key].data;
};

/**
 * @public
 * @memberOf {LRUDict}
 * @method
 *
 * @returns {Array<String>}
 * */
LRUDict.prototype.keys = function () {
    var i = 0;
    var keys = new Array(this.length);
    var link = this.tail;

    while (link) {
        keys[i] = link.name;
        link = link.next;
        i += 1;
    }

    return keys;
};

/**
 * @public
 * @memberOf {LRUDict}
 * @method
 *
 * @returns {Array<*>}
 * */
LRUDict.prototype.vals = function () {
    var i = 0;
    var link = this.tail;
    var vals = new Array(this.length);

    while (link) {
        vals[i] = link.data;
        link = link.next;
        i += 1;
    }

    return vals;
};

function unlink(self, link) {

    if (link) {
        if (link.prev) {
            link.prev.next = link.next;
        } else {
            self.tail = link.next;
        }

        if (link.next) {
            link.next.prev = link.prev;
        } else {
            self.head = link.prev;
        }

        link.prev = null;
        link.next = null;

        self.length -= 1;
    }

    return link;
}

function push(self, link) {
    if (self.head) {
        self.head.next = link;
    }

    link.prev = self.head;
    link.next = null;
    self.head = link;

    if (!self.tail) {
        self.tail = link;
    }

    self.length += 1;
}

/**
 * @class Link
 *
 * @param {String} name
 * @param {*} data
 * @param {Link} [prev]
 * @param {Link} [next]
 * */
function Link(name, data, prev, next) {

    /**
     * @public
     * @memberOf {Link}
     * @property
     * @type {String}
     * */
    this.name = name;

    /**
     * @public
     * @memberOf {Link}
     * @property
     * @type {Link}
     * */
    this.prev = prev;

    /**
     * @public
     * @memberOf {Link}
     * @property
     * @type {Link}
     * */
    this.next = next;

    /**
     * @public
     * @memberOf {Link}
     * @property
     * @type {*}
     * */
    this.data = data;
}

/**
 * @public
 * @memberOf {Link}
 * @method
 *
 * @returns {Number}
 * */
Link.prototype.index = function () {
    return (this.prev && this.prev.index() + 1) | 0;
};

module.exports = LRUDict;
