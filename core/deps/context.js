'use strict';

var Deps = /** @type {Deps}*/ require('./deps');

var _ = require('lodash-node');
var inherit = require('inherit');

/**
 * @class Context
 * @extends Deps
 * */
var Context = inherit(Deps, /** @lends Context.prototype */ {

    /**
     * @public
     * @memberOf {Context}
     * @method
     *
     * @param {String} name
     *
     * @returns {*}
     * */
    arg: function (name) {
        var result = this.__base(name);

        if ( _.isUndefined(result) || _.isNull(result) ) {
            result = this.track.match[name];

            if ( _.isUndefined(result) || _.isNull(result) ) {
                result = this.track.url.query[name];
            }
        }

        return result;
    }

});

module.exports = Context;
