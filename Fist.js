'use strict';

var Framework = /** @type Framework */ require('./Framework');

var routes = require('./init/routes');
var units = require('./init/units');

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
        this.schedule(routes, units);
    }

});

module.exports = Fist;
