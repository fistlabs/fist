'use strict';

var Context = /** @type Context */ require('../context/Context');

var _ = require('lodash-node');
var inherit = require('inherit');

/**
 * @class Unit
 * @extends Object
 * */
var Unit = inherit(Object, /** @lends Unit.prototype */ {

    /**
     * @private
     * @memberOf {Unit}
     * @method
     *
     * @param {Object} params
     *
     * @constructs
     * */
    __constructor: function (params) {

        /**
         * @public
         * @memberOf {Unit}
         * @property
         * @type {Object}
         * */
        this.params = _.extend({}, this.params, params);
    },

    /**
     * @public
     * @memberOf {Unit}
     * @property
     * @type {String}
     * */
    path: 'unit',

    /**
     * @public
     * @memberOf {Unit}
     * @method
     * */
    addDeps: function () {
        this.deps = _.union(this.deps, _.flatten(arguments));
    },

    /**
     * @public
     * @memberOf {Unit}
     * @method
     * */
    delDeps: function () {
        var args = _.flatten(arguments);

        this.deps = _.reject(this.deps, function (path) {

            return _.contains(args, path);
        });
    },

    /**
     * @public
     * @memberOf {Unit}
     * @property
     * @type {Array<String>}
     * */
    deps: [],

    /**
     * @public
     * @memberOf {Unit}
     * @property
     * @type {Object}
     * */
    params: {},

    /**
     * @public
     * @memberOf {Unit}
     * @method
     *
     * @param {Object} params
     *
     * @returns {Context}
     * */
    createCtx: function (params) {

        return new Context(params);
    }

});

module.exports = Unit;
