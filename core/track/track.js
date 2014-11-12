'use strict';

var Deps = /** @type Deps */ require('../deps/deps');

var _ = require('lodash-node');
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
    __constructor: function (agent, args) {

        /**
         * @public
         * @memberOf {Track}
         * @property
         * @type {Object}
         * */
        this.args = Object(args);

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
         * @protected
         * @memberOf {Track}
         * @property
         * @type {Object}
         * */
        this._tasks = {};

        /**
         * @public
         * @memberOf {Track}
         * @property
         * @type {Logger}
         * */
        this.logger = this.agent.logger.bind(this.id);
    },

    /**
     * @public
     * @memberOf {Track}
     * @method
     *
     * @param {String} name
     * @param {Object} [args]
     *
     * @returns {vow.Promise}
     *  */
    invoke: function (name, args) {
        var result;

        //  TODO String(args)!
        if (_.isObject(args)) {
            args = _.extend({}, this.args, args);
            //  Do not check cache!
            return this.__executeUnit(name, args);
        }

        //  check cache
        result = this._tasks[name];

        if (result) {

            return result;
        }

        result = this._tasks[name] = this.__executeUnit(name, this.args);

        return result;
    },

    /**
     * @protected
     * @memberOf {Track}
     * @method
     *
     * @param {String} name
     * @param {Object} [args]
     *
     * @returns {Deps}
     * */
    _createContext: function (name, args) {

        return new Deps(this, name, args);
    },

    /**
     * @private
     * @memberOf {Track}
     * @method
     *
     * @param {String} name
     * @param {Object} [args]
     *
     * @returns {vow.Promise}
     * */
    __executeUnit: function (name, args) {

        return this._createContext(name, args).execute();
    }

});

module.exports = Track;
