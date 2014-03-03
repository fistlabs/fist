'use strict';

var Class = /** @type Class */ require('fist.lang.class/Class');
var unique = require('fist.lang.unique');

/**
 * @class Knot
 * @extends Class
 * */
var Knot = Class.extend(/** @lends Knot.prototype */ {

    /**
     * @protected
     * @memberOf {Knot}
     * @method
     *
     * @constructs
     * */
    constructor: function () {
        Knot.Parent.apply(this, arguments);

        this.deps = unique(this.deps);
    },

    /**
     * adds dependencies
     *
     * @public
     * @memberOf {Knot}
     * @method
     * */
    addDeps: function () {
        this.deps = unique([].concat.apply(this.deps, arguments));
    },

    /**
     * deletes dependencies
     *
     * @public
     * @memberOf {Knot}
     * @method
     * */
    delDeps: function () {

        var i = arguments.length;

        while (i) {
            i -= 1;

            if ( -1 === this.deps.indexOf(arguments[i]) ) {

                continue;
            }

            this.deps.splice(i, 1);
        }
    },

    /**
     * @public
     * @memberOf {Knot}
     * @property {Array<String>}
     * */
    deps: [],

    /**
     * @public
     * @memberOf {Knot}
     * @method
     *
     * @param {Activity} track
     * @param {Object} errors
     * @param {Object} result
     * @param {Function} done
     * */
    data: function (track, errors, result, done) {
        done(null, this.params);
    }

});

module.exports = Knot;
