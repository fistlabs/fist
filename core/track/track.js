'use strict';

var inherit = require('inherit');
var uniqueId = require('unique-id');

/**
 * @class Track
 * */
var Track = inherit(/** @lends Track.prototype */{

    /**
     * @private
     * @memberOf {Track}
     * @method
     *
     * @constructs
     *
     * @returns void
     * */
    __constructor: function (agent) {

        /**
         * @public
         * @memberOf {Track}
         * @property
         * @type {Tracker}
         * */
        this.agent = agent;

        /**
         * @public
         * @memberOf {Track}
         * @property
         * @type {String}
         * */
        this.id = uniqueId();

        /**
         * @public
         * @memberOf {Track}
         * @property
         * @type {Object}
         * */
        this.tasks = {};
    },

    /**
     * @deprecated
     *  */
    invoke: /* istanbul ignore next */ function (path, params) {
        this.agent.channel('sys.migration').emit('deprecated', [
            'track.invoke(\'path, params\')',
            'context.invoke(\'path, params\')'
        ]);

        return this.agent.resolve(this, path, params);
    }

});

module.exports = Track;
