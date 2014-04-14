'use strict';

var Class = /** @type Class */ require('fist.lang.class/Class');
var Next = /** @type Next */ require('fist.util.next/Next');

var _ = /** @type _ */ require('lodash');

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
     * @returns {Next}
     * */
    parse: function () {

        var next = new Next();

        next.accept(Object.create(null));

        return next;
    }

}, {

    /**
     * @public
     * @static
     * @memberOf Parser
     * @property
     * */
    type: void 0,

    /**
     * @public
     * @static
     * @memberOf Parser
     * @method
     *
     * @returns {Boolean}
     * */
    matchMedia: function () {

        return true;
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
    ELIMIT: function (opts) {

        return _.extend(new Error(), {
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

        return _.extend(new Error(), {
            code: 'ELENGTH'
        }, opts);
    }

});

module.exports = Parser;
