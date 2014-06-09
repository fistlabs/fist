'use strict';

var Class = /** @type Class */ require('../util/Class');
var vow = require('vow');

var _ = require('lodash-node');
var inherit = require('inherit');

/**
 * @class Parser
 * @extends Class
 * */
var Parser = inherit(Class, /** @lends Parser.prototype */ {

    /**
     * @protected
     * @memberOf {Parser}
     * @method
     *
     * @constructs
     *
     * @param {*} [params]
     * */
    __constructor: function (params) {
        this.__base(params);

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
     *
     * @returns {vow.Promise}
     * */
    parse: function (media) {
        /* eslint no-unused-vars: 0*/

        var defer = vow.defer();

        defer.resolve({});

        return defer.promise();
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
