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
        base: '_fistlabs_unit_depends',

        /**
         * @public
         * @memberOf {_fist_contrib_unit_serial}
         * @property
         * @type {String}
         * */
        name: '_fistlabs_unit_serial',

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
         * @param {Object} track
         * */
        main: function (track) {
            return next(this, track);
        },

        createContext: function (track, args) {
            var context = this.__base(track, args);
            context.series = new Deque(this.series);
            return context;
        }
    });
};

function next(self, track) {
    var name;

    if (track.series.isEmpty() || track.isFlushed()) {
        return track.prev;
    }

    name = track.series.shift();

    track.logger.debug('Start processing "%s"', name);

    return vow.invoke(function () {
        return self[name].call(self, track);
    }).then(function (result) {
        track.prev = result;
        return next(self, track);
    }, function (err) {
        var func = self['e' + name];

        track.prev = err;
        track.series.clear();

        if (typeof func === 'function') {
            track.logger.warn('Failed to execute "%s", running "e%s"', name, name);
            return func.call(self, track);
        }

        track.logger.error('Failed to execute "%s"', name);
        throw track.prev;
    });
}
