'use strict';

var Obus = require('obus');

/**
 * @class Context
 * @param {Logger} logger
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
    this.params = new Obus();

    /**
     * @public
     * @memberOf {Context}
     * @property
     * @type {Obus}
     * */
    this.errors = new Obus();

    /**
     * @public
     * @memberOf {Context}
     * @property
     * @type {Obus}
     * */
    this.result = new Obus();
}

Context.prototype = {

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

module.exports = Context;
