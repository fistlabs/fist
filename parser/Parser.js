'use strict';

var _ = require('lodash-node');
var inherit = require('inherit');
var vow = require('vow');

/**
 * @class Parser
 * */
var Parser = inherit(/** @lends Parser.prototype */ {

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

        /**
         * @public
         * @memberOf {Parser}
         * @property
         * @type {Object}
         * */
        this.params = _.extend({}, this.params, params);

        //  compat with https://www.npmjs.org/package/media-typer
        params = this.params.parameters;
        delete this.params.parameters;
        _.extend(this.params, params);

        params = this.params;

        params.limit = +params.limit;

        if ( _.isNaN(params.limit) ) {
            params.limit = Infinity;
        }

        params.length = +params.length;

        if ( _.isNaN(params.length) ) {
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

        return vow.resolve({});
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
