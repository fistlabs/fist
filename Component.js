'use strict';

var Class = /** @type Class */ require('fist.lang.class/Class');
var unique = require('fist.lang.unique');

/**
 * @class Component
 * @extends Class
 * */
var Component = Class.extend(/** @lends Component.prototype */ {

    /**
     * @protected
     * @memberOf {Component}
     * @method
     *
     * @constructs
     * */
    constructor: function () {
        Component.Parent.apply(this, arguments);

        this.deps = unique(this.deps);
    },

    /**
     * adds dependencies
     *
     * @public
     * @memberOf {Component}
     * @method
     * */
    addDeps: function () {
        this.deps = unique([].concat.apply(this.deps, arguments));
    },

    /**
     * deletes dependencies
     *
     * @public
     * @memberOf {Component}
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
     * @memberOf {Component}
     * @property {Array<String>}
     * */
    deps: [],

    /**
     * @public
     * @memberOf {Component}
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

module.exports = Component;
