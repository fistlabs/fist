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
    var Fist = inherit(Server, members, _.extend({
        //  FIXME костыль который позволяет использовать
        //  старый интерфейс узлов
        Unit: Unit
    }, statics));
    var app = new Fist(_.extend({cwd: dirname}, params));

    app.plug(fist.defaultPlugins);

    return app;
}

fist.defaultPlugins = [
    require('./plugins/routes'),
    require('./plugins/units')
];

module.exports = fist;
