'use strict';

var Obus = /** @type Obus */ require('obus');

/**
 * @class Context
 * @param {Logger} logger
 * */
function Context(logger) {

    /**
     * @public
     * @memberOf {Context}
     * @property
     * @type {Date}
     * */
    this.creationDate = new Date();

    /**
     * @public
     * @memberOf {Context}
     * @property
     * @type {String}
     * */
    this.identity = 'static';

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

    /**
     * @public
     * @memberOf {Context}
     * @property
     * @type {Array}
     * */
    this.keys = [];

    /**
     * @public
     * @memberOf {Context}
     * @property
     * @type {Boolean}
     * */
    this.skipCache = false;

    /**
     * @public
     * @memberOf {Context}
     * @property
     * @type {Boolean}
     * */
    this.needUpdate = false;

    /**
     * @public
     * @memberOf {Context}
     * @property
     * @type {String}
     * */
    this.cacheKey = null;

    /**
     * @public
     * @memberOf {Context}
     * @property
     * @type {*}
     * */
    this.value = null;

    /**
     * @public
     * @memberOf {Context}
     * @property
     * @type {Boolean}
     * */
    this.updated = false;

    /**
     * @public
     * @memberOf {Context}
     * @property
     * @type {String}
     * */
    this.status = 'PENDING';

    /**
     * @public
     * @memberOf {Context}
     * @property
     * @type {Boolean}
     * */
    this.skipped = false;
}

Context.prototype = {

    /**
     * @public
     * @memberOf {Context}
     * @method
     *
     * @returns {Boolean}
     * */
    isResolved: function () {
        return this.status !== 'PENDING';
    },

    /**
     * @public
     * @memberOf {Context}
     * @method
     *
     * @returns {Boolean}
     * */
    isAccepted: function () {
        return this.status === 'ACCEPTED';
    },

    /**
     * @public
     * @memberOf {Context}
     * @method
     *
     * @returns {Boolean}
     * */
    isRejected: function () {
        return this.status === 'REJECTED';
    },

    /**
     * @public
     * @memberOf {Context}
     * @method
     *
     * @returns {*}
     * */
    valueOf: function () {
        return this.value;
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
     * @returns {Number}
     * */
    getTimePassed: function () {
        return new Date() - this.creationDate;
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
