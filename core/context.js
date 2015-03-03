'use strict';

var Obus = /** @type Obus */ require('obus');

function ContextLite() {
    this.params = new Obus();
}

ContextLite.prototype.p = function (path, def) {
    return Obus.get(this.params, path, def);
};

ContextLite.prototype.addParams = function (params) {
    $Context$extendParams(this.params, params);
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

/**
 * @public
 * @memberOf {Context}
 * @method
 * @constructs
 * */
Context.prototype.constructor = Context;

/**
 * @public
 * @static
 * @memberOf {Context}
 * @method
 *
 * @param {Object} [unitParams]
 * @param {Object} [trackParams]
 * @param {Object} [args]
 *
 * @returns {Obus}
 * */
Context.createParams = function (unitParams, trackParams, args) {
    var params = new Obus();
    $Context$extendParams(params, unitParams);
    $Context$extendParams(params, trackParams);
    $Context$extendParams(params, args);
    return params;
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
 * @param {String} path
 * @param {*} [def]
 *
 * @returns {*}
 * */
Context.prototype.p = function (path, def) {
    return Obus.get(this.params, path, def);
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
