'use strict';

var Class = /** @type Class */ require('../util/Class');

var _ = require('lodash-node');
var inherit = require('inherit');

/**
 * @class Unit
 * @extends Class
 * */
var Unit = inherit(Class, /** @lends Unit.prototype */ {

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
    params: {}

});

module.exports = Unit;
