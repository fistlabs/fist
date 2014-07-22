'use strict';

var Skip = /** @type Skip */ require('./skip');

var inherit = require('inherit');

/**
 * @class SkipRewrite
 * @extends Skip
 * */
var SkipRewrite = inherit(Skip, /** @Lends SkipRewrite */ {

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
         * @memberOf {SkipRewrite}
         * @property
         * @type {String}
         * */
        this.path = path;
    }

});

module.exports = SkipRewrite;
