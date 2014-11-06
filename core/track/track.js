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
    },

    /**
     * @public
     * @memberOf {Track}
     * @method
     *
     * @param {String} path
     * @param {Object} [args]
     *
     * @returns {vow.Promise}
     *  */
    invoke: function (path, args) {
        var result;

        if (_.isObject(args)) {
            args = _.extend({}, this.args, args);
            //  Do not check cache!
            return this.__executeUnit(path, args);
        }

        //  check cache
        result = this._tasks[path];

        if (result) {

            return result;
        }

        result = this._tasks[path] = this.__executeUnit(path, this.args);

        return result;
    },

    /**
     * @protected
     * @memberOf {Track}
     * @method
     *
     * @param {String} path
     * @param {Object} [args]
     *
     * @returns {Deps}
     * */
    _createContext: function (path, args) {

        return new Deps(this, path, args);
    },

    /**
     * @private
     * @memberOf {Track}
     * @method
     *
     * @param {String} path
     * @param {Object} [args]
     *
     * @returns {vow.Promise}
     * */
    __executeUnit: function (path, args) {

        return this._createContext(path, args).execute();
    }

});

module.exports = Track;
