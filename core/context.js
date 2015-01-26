'use strict';

var Obus = /** @type Obus */ require('obus');

/**
 * @class Context
 *
 * @param {Object} params
 * @param {Object} result
 * @param {Object} errors
 * @param {Logger} logger
 * */
function Context(params, result, errors, logger) {

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
    this.result = result;

    /**
     * @public
     * @memberOf {Context}
     * @property
     * @type {Object}
     * */
    this.errors = errors;

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
 * @memberOf {Context}
 * @method
 *
 * @returns {Context}
 * */
Context.prototype.setParams = function () {
    var i;
    var argc = arguments.length;
    for (i = 0; i < argc; i += 1) {
        _$Context$extendParams(this.params, arguments[i]);
    }
    return this;
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

function _$Context$extendParams(obj, src) {
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

module.exports = Context;
