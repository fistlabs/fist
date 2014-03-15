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
     * @public
     * @memberOf {Fist}
     * @method
     * */
    listen: function () {
        //  автоматически добавляю таски на инициализацию роутера и узлов
        this.schedule(routes, units);
        Fist.parent.listen.apply(this, arguments);
    }

});

module.exports = Fist;
