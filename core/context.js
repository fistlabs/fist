'use strict';

var Obus = /** @type Obus */ require('obus');

var hasProperty = Object.prototype.hasOwnProperty;

/**
 * @class Context
 * */
function Context(logger) {

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
    this.params = {};
}

/**
 * @public
 * @memberOf {Context}
 * @method
 *
 * @constructs
 * */
Context.prototype.constructor = Context;

/**
 * @public
 * @memberOf {Context}
 * @method
 *
 * @param {*} args...
 *
 *  @returns {*}
 * */
Context.prototype.setup = function (args) {
    var i;
    var k;
    var l;

    for (i = 0, l = arguments.length; i < l; i += 1) {
        args = arguments[i];

        for (k in args) {
            if (hasProperty.call(args, k)) {
                this.params[k] = args[k];
            }
        }
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
Context.prototype.param = function (path, def) {
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
    return this.params;
};

module.exports = Context;
