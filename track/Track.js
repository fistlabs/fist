'use strict';

var Base = /** @type Base */ require('fist.lang.class/Base');

/**
 * @Base Track
 * @extends Base
 * */
var Track = Base.extend(/** @lends Track.prototype */{

    /**
     * @protected
     * @memberOf {Track}
     * @method
     *
     * @constructs
     *
     * @returns void
     * */
    constructor: function (agent) {

        /**
         * @public
         * @memberOf {Track}
         * @property {Tracker}
         * */
        this.agent = agent;

        /**
         * @public
         * @memberOf {Track}
         * @property {Object}
         * */
        this.tasks = Object.create(null);
    },

    /**
     * Запускает операцию разрешения узла
     *
     * @public
     * @memberOf {Track}
     * @method
     *
     * @param {String} path
     * @param {Function} done
     * */
    invoke: function (path, done) {
        this.agent.resolve(this, path, done);
    }

});

module.exports = Track;
