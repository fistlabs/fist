'use strict';

var Obus = /** @type Obus */ require('obus');

/**
 * @class ContextLite
 * */
function ContextLite() {

    /**
     * @public
     * @memberOf {ContextLite}
     * @property
     * @type {Obus}
     * */
    this.params = new Obus();
}

/**
 * @public
 * @memberOf {ContextLite}
 * @method
 *
 * @param {String} path
 * @param {*} [def]
 *
 * @returns {*}
 * */
ContextLite.prototype.p = function (path, def) {
    return Obus.get(this.params, path, def);
};

/**
 * @public
 * @memberOf {Context}
 * @method
 *
 * @param {Object} params
 *
 * @returns {ContextLite}
 * */
ContextLite.prototype.addParams = function (params) {
    $Context$extendParams(this.params, params);
    return this;
};

/**
 * @class Context
 *
 * @param {Obus} params
 * @param {Logger} logger
 * */
function Context(params, logger) {

    /**
     * @public
     * @memberOf {Context}
     * @property
     * @type {Object}
     * */
    this.params = params;

    /**
     * @public
     * @memberOf {Context}
     * @property
     * @type {Object}
     * */
    this.result = new Obus();

    /**
     * @public
     * @memberOf {Context}
     * @property
     * @type {Object}
     * */
    this.errors = new Obus();

    /**
     * @public
     * @memberOf {Context}
     * @property
     * @type {Logger}
     * */
    this.logger = logger;
}

Context.prototype = Object.create(ContextLite.prototype);

/**
 * @public
 * @memberOf {Context}
 * @method
 * @constructs
 * */
Context.prototype.constructor = Context;

/**
 * @public
 * @memberOf {Context}
 * @method
 *
 * @param {String} path
 * @param {*} [def]
 *
 * @returns {*}
 * */
Context.prototype.r = function (path, def) {
    return Obus.get(this.result, path, def);
};

/**
 * @public
 * @memberOf {Context}
 * @method
 *
 * @param {String} path
 * @param {*} [def]
 *
 * @returns {*}
 * */
Context.prototype.e = function (path, def) {
    return Obus.get(this.errors, path, def);
};

/**
 * @public
 * @memberOf {Context}
 * @method
 *
 * @returns {Object}
 * */
Context.prototype.toJSON = function () {
    return {
        params: this.params,
        errors: this.errors,
        result: this.result
    };
};

function $Context$extendParams(obj, src) {
    var k;
    var keys = Object.keys(Object(src));
    var l = keys.length;

    while (l) {
        l -= 1;
        k = keys[l];
        if (src[k] !== void 0) {
            obj[k] = src[k];
        }
    }

    return obj;
}

Context.Lite = ContextLite;

module.exports = Context;
