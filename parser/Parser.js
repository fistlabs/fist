'use strict';

var Class = /** @type Class */ require('fist.lang.class/Class');
var Next = /** @type Next */ require('fist.util.next/Next');

var extend = require('fist.lang.extend');

/**
 * @abstract
 * @class Parser
 * @extends Class
 * */
var Parser = Class.extend(/** @lends Parser.prototype */ {

    /**
     * @protected
     * @memberOf {Parser}
     * @method
     *
     * @constructs
     *
     * @param {*} [params]
     * */
    constructor: function (params) {
        Parser.Parent.apply(this, arguments);

        params = this.params;

        params.limit = +params.limit;

        if ( isNaN(params.limit) ) {
            params.limit = Infinity;
        }

        params.length = +params.length;

        if ( isNaN(params.length) ) {
            params.length = Infinity;
        }
    },

    /**
     * @protected
     * @memberOf {Parser}
     * @method
     *
     * */
    _parse: function (stream) {

        var next = new Next();

        next.args([null, Object.create(null)]);

        return next;
    },

    /**
     * @public
     * @memberOf {Parser}
     * @property
     * */
    type: void 0,

    /**
     * @protected
     * @memberOf {Parser}
     * @method
     *
     * @param {*} res
     *
     * @returns {Object}
     * */
    _template: function (res) {

        return {
            input: res,
            type: this.type
        };
    },

    /**
     * @public
     * @memberOf {Parser}
     * @method
     *
     * @param {Object} stream
     * */
    parse: function (stream) {

        return this._parse(stream).next(function (res, done) {
            done(null, this._template(res));
        }, this);
    }

}, {

    /**
     * @public
     * @static
     * @memberOf Parser
     *
     * @method
     *
     * @returns {Error}
     * */
    ELIMIT: function (opts) {

        return extend(new Error(), {
            code: 'ELIMIT'
        }, opts);
    },

    /**
     * @public
     * @static
     * @memberOf Parser
     *
     * @method
     *
     * @returns {Error}
     * */
    ELENGTH: function (opts) {

        return extend(new Error(), {
            code: 'ELENGTH'
        }, opts);
    }

});

module.exports = Parser;
