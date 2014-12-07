'use strict';

var Deque = /** @type Deque */ require('double-ended-queue');

var vow = require('vow');

module.exports = function (agent) {
    /**
     * @class _fist_contrib_unit_serial
     * @extends _fist_contrib_unit
     * */
    agent.unit({

        /**
         * @public
         * @memberOf {_fist_contrib_unit_serial}
         * @property
         * @type {String}
         * */
        base: '_fist_contrib_unit',

        /**
         * @public
         * @memberOf {_fist_contrib_unit_serial}
         * @property
         * @type {String}
         * */
        name: '_fist_contrib_unit_serial',

        /**
         * @public
         * @memberOf {_fist_contrib_unit_serial}
         * @property
         * @type {Array<String>}
         * */
        series: [],

        /**
         * @public
         * @memberOf {_fist_contrib_unit_serial}
         * @method
         *
         * @param {Track} track
         * @param {Object} context
         * */
        main: function (track, context) {
            context.series = new Deque(this.series);
            return next(this, track, context);
        }
    });
};

function next(self, track, context) {
    var name;

    if (context.series.isEmpty() || track.isFlushed()) {
        return context.prev;
    }

    name = context.series.shift();

    context.logger.debug('Start processing "%s"', name);

    return vow.invoke(function () {
        return self[name].call(self, track, context);
    }).then(function (result) {
        context.prev = result;
        return next(self, track, context);
    }, function (err) {
        var func = self['e' + name];

        context.prev = err;
        context.series.clear();

        if (typeof func === 'function') {
            context.logger.warn('Failed to execute "%s", running "e%s"', name, name);
            return func.call(self, track, context);
        }

        context.logger.warn('Failed to execute "%s"', name);
        throw context.prev;
    });
}
