'use strict';

var Base = /** @type Base */ require('parent/Base');

/**
 * @class Bundle
 * @extends Base
 * */
var Bundle = Base.extend(/** @lends Bundle.prototype */ {

    /**
     * @protected
     * @memberOf {Bundle}
     * @method
     *
     * @constructs
     * */
    constructor: function () {

        /**
         * @public
         * @memberOf {Bundle}
         * @property {Object}
         * */
        this.errors = Object.create(null);

        /**
         * @public
         * @memberOf {Bundle}
         * @property {Object}
         * */
        this.result = Object.create(null);
    },

    /**
     * @public
     * @memberOf {Bundle}
     * @method
     *
     * @this {Bundle}
     *
     * @param {String} path
     * @param {Array|Arguments} args
     * */
    bundlify: function (path, args) {

        if ( 2 > args.length ) {
            this._link(this.errors, path, args[0]);

            return;
        }

        this._link(this.result, path, args[1]);
    },

    /**
     * @protected
     * @memberOf {Bundle}
     * @method
     *
     * @param {Object} root
     * @param {String} path
     * @param {*} data
     *  */
    _link: function (root, path, data) {
        root[path] = data;
    }

});

module.exports = Bundle;
