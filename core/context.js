'use strict';

var Obus = /** @type Obus */ require('obus');

/**
 * @class Context
 *
 * @param {Object} params
 * @param {Logger} logger
 * @param {Object} result
 * @param {Object} errors
 * */
function Context(params, logger, result, errors) {

    /**
     * @public
     * @memberOf {Context}
     * @property
     * @type {Logger}
     * */
    this.logger = logger;

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
    this.errors = errors;

    /**
     * @public
     * @memberOf {Context}
     * @property
     * @type {Object}
     * */
    this.result = result;
}

Context.prototype = {

    setParams: function () {
        var i;
        var argc = arguments.length;
        for (i = 0; i < argc; i += 1) {
            _$Context$extendParams(this.params, arguments[i]);
        }
        return this;
    },

    /**
     * @public
     * @memberOf {Context}
     * @method
     * @constructs
     * */
    constructor: Context,

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
    r: function (path, def) {
        return Obus.get(this.result, path, def);
    },

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
    e: function (path, def) {
        return Obus.get(this.errors, path, def);
    },

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
    p: function (path, def) {
        return Obus.get(this.params, path, def);
    },

    /**
     * @public
     * @memberOf {Context}
     * @method
     *
     * @returns {Object}
     * */
    toJSON: function () {
        return {
            params: this.params,
            errors: this.errors,
            result: this.result
        };
    }
};

function _$Context$extendParams(obj, src) {
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

    return obj;
}

module.exports = Context;
