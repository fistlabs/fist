'use strict';

var _ = require('lodash-node');
var inherit = require('inherit');

/**
 * @class EqualMap
 * */
var EqualMap = inherit(/** @lends EqualMap.prototype */ {

    /**
     * @private
     * @memberOf {EqualMap}
     * @method
     *
     * @constructs
     * */
    __constructor: function () {

        /**
         * @private
         * @memberOf {EqualMap}
         * @property
         * @type {Array}
         * */
        this.__complex = [];
    },

    /**
     * @public
     * @memberOf {EqualMap}
     * @method
     *
     * @param {*} k
     * @param {*} v
     *
     * @returns {EqualMap}
     * */
    set: function (k, v) {
        var e;
        var i;
        var l;

        for ( i = 0, l = this.__complex.length; i < l; i += 1 ) {
            e = this.__complex[i];

            if ( _.isEqual(e.key, k) ) {
                e.val = v;

                return this;
            }
        }

        this.__complex.push({key: k, val: v});

        return this;
    },

    /**
     * @public
     * @memberOf {EqualMap}
     * @method
     *
     * @param {*} k
     *
     * @returns {*}
     * */
    get: function (k) {
        var e;
        var i;
        var l;

        for ( i = 0, l = this.__complex.length; i < l; i += 1 ) {
            e = this.__complex[i];

            if ( _.isEqual(e.key, k) ) {

                return e.val;
            }
        }

        return void 0;
    }

});

module.exports = EqualMap;
