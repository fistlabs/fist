'use strict';

var Base = /** @type Base */ require('parent/Base');

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
         * @property
         * @type {Tracker}
         * */
        this.agent = agent;

        /**
         * @public
         * @memberOf {Track}
         * @property {Object}
         * */
        this.tasks = {};
    },

    /**
     * Запускает операцию разрешения узла
     *
     * @public
     * @memberOf {Track}
     * @method
     *
     * @param {String} path
     * @param {*} [params]
     *
     * @returns {vow.Promise}
     * */
    invoke: function (path, params) {

        return this.agent.resolve(this, path, params);
    }

});

module.exports = Track;
