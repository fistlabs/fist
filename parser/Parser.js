'use strict';

var Class = /** @type Class */ require('parent/Class');
var Next = /** @type Next */ require('fist.util.next/Next');

var _ = /** @type _ */ require('lodash-node');

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
     * @public
     * @memberOf {Parser}
     * @method
     *
     * @param {Object} media
     * @param {Function} done
     * */
    parse: function (media, done) {

        done(null, Object.create(null));
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
