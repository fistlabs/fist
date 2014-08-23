'use strict';

var Control = /** @type Control */ require('./control');

var inherit = require('inherit');

/**
 * @class Rewrite
 * @extends Control
 * */
var Rewrite = inherit(Control, /** @Lends Rewrite */ {

    /**
     * @private
     * @memberOf {Rewrite}
     * @method
     *
     * @constructs
     *
     * @param {String} path
     * */
    __constructor: function (path) {

        /**
         * @public
         * @memberOf {Rewrite}
         * @property
         * @type {String}
         * */
        this.path = path;
    }

});

module.exports = Rewrite;
