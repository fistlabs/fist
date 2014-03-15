'use strict';

var Class = /** @type Class */ require('fist.lang.class/Class');
var union = require('lodash.union');

/**
 * @class Unit
 * @extends Class
 * */
var Unit = Class.extend(/** @lends Unit.prototype */ {

    /**
     * @protected
     * @memberOf {Unit}
     * @method
     *
     * @constructs
     * */
    constructor: function () {
        Unit.Parent.apply(this, arguments);

        this.deps = union(this.deps);
    },

    /**
     * adds dependencies
     *
     * @public
     * @memberOf {Unit}
     * @method
     * */
    addDeps: function () {
        this.deps = union([].concat.apply(this.deps, arguments));
    },

    /**
     * deletes dependencies
     *
     * @public
     * @memberOf {Unit}
     * @method
     * */
    delDeps: function () {

        var i = arguments.length;
        var ind;

        while (i) {
            i -= 1;
            ind = this.deps.indexOf(arguments[i]);

            if ( -1 === ind ) {

                continue;
            }

            this.deps.splice(ind, 1);
        }
    },

    /**
     * @public
     * @memberOf {Unit}
     * @property {Array<String>}
     * */
    deps: [],

    /**
     * @public
     * @memberOf {Unit}
     * @method
     *
     * @param {Runtime} track
     * @param {Object} errors
     * @param {Object} result
     * @param {Function} done
     * */
    data: function (track, errors, result, done) {
        done(null, this.params);
    }

});

module.exports = Unit;
