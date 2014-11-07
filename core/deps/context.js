'use strict';

//  TODO Avoid!
var Deps = /** @type {Deps}*/ require('./deps');

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
    }

});

module.exports = Context;
