'use strict';

var Server = /** @type Server */ require('./core/server');

var _ = require('lodash-node');
var inherit = require('inherit');
var path = require('path');
var dirname = path.dirname(module.parent.filename);

var Unit = inherit(require('./core/unit'), {

    /**
     * @inheritDoc
     *
     * @param {String} name
     * @param {Context} context
     * */
    _callMethod: /* istanbul ignore next */ function (name, context) {

        return this[name](context.track, context);
    }

});

/**
 * @param {Object} [params]
 * @param {Object} [members]
 * @param {Object} [statics]
 *
 * @returns {Server}
 * */
function fist (params, members, statics) {
    var Fist = fist.inherit(members, statics);

    params = _.extend({cwd: dirname}, params);

    return new Fist(params).
        plug(path.join(__dirname, 'plugins', '**', '*.js'));
}

fist.inherit = function (members, statics) {
    statics = _.extend({Unit: Unit}, statics);

    return inherit(Server, members, statics);
};

module.exports = fist;
