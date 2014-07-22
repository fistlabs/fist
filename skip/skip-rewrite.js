'use strict';

var Skip = /** @type Skip */ require('./skip');

var inherit = require('inherit');

/**
 * @class SkipRewrite
 * @extends Skip
 * */
var Rewrite = inherit(Skip, /** @Lends SkipRewrite */ {

    /**
     * @private
     * @memberOf {SkipRewrite}
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
