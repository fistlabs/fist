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
    },

    /**
     * @public
     * @memberOf {Context}
     * @method
     *
     * @param {String} renderer
     *
     * @returns {vow.Promise}
     * */
    render: function (renderer) {
        var body = this.track.agent.renderers[renderer](this);

        return this.track.response.respond(void 0, body);
    },

    /**
     * @public
     * @memberOf {Context}
     * @method
     *
     * @returns {Object}
     * */
    toJSON: function () {

        return {
            errors: this.errors,
            result: this.result
        };
    }

});

module.exports = Context;
