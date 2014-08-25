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
     * @param {String} renderer
     *
     * @returns {vow.Promise}
     * */
    render: function (renderer) {
        var body = this.track.agent.renderers[renderer](this);

        return this.track.response.respond(void 0, body);
    },

    /**
     * @protected
     * @memberOf {Context}
     * @method
     *
     * @returns {Object}
     * */
    _dumpArgs: function () {

        return _.extend({}, this.track.url.query,
            this.track.match, this.__base());
    }

});

module.exports = Context;
