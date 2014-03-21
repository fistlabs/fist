'use strict';

var Framework = /** @type Framework */ require('./Framework');

var routes = require('./plug/routes');
var units = require('./plug/units');

/**
 * @class Fist
 * @extends Framework
 * */
var Fist = Framework.extend(/** @lends Fist.prototype */ {

    /**
     * @protected
     * @memberOf {Fist}
     * @method
     *
     * @constructs
     * */
    constructor: function () {
        Fist.Parent.apply(this, arguments);
        //  автоматически добавляю таски на инициализацию роутера и узлов
        this.plug(routes, units);
    }

});

module.exports = Fist;
