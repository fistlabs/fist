'use strict';

var Class = /** @type Class */ require('fist.lang.class/Class');

var extend = require('fist.lang.extend');
var once = require('../util/once');

/**
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
     * @param {Object} readable
     * @param {*} [opts]
     * */
    constructor: function (readable, opts) {
        Parser.Parent.call(this, opts);

        opts = this.params;

        opts.limit = +opts.limit;

        if ( isNaN(opts.limit) ) {
            opts.limit = Infinity;
        }

        opts.length = +opts.length;

        if ( isNaN(opts.length) ) {
            opts.length = Infinity;
        }

        this._task = once(this._parse.bind(this));

        /**
         * @protected
         * @memberOf {Parser}
         * @property {Object}
         * */
        this._readable = readable;
    },

    /**
     * @protected
     * @memberOf {Parser}
     * @method
     *
     * @param {Function} done
     * */
    _parse: function (done) {
        done(null, new Buffer(0));
    },

    /**
     * @public
     * @memberOf {Parser}
     * @method
     *
     * @param {Function} done
     * @param {*} [ctxt]
     * */
    parse: function (done, ctxt) {
        this._task(done, ctxt);
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
