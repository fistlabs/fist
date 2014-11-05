'use strict';

var Deps = /** @type Deps */ require('../deps/deps');
var TaskCache = /** @type TaskCache */ require('../util/task-cache');

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
         * @private
         * @memberOf {Track}
         * @property
         * @type {Object}
         * */
        this.__tasks = {};
    },

    /**
     * @public
     * @memberOf {Track}
     * @method
     *
     * @param {String} path
     * @param {Object} [locals]
     *
     * @returns {vow.Promise}
     *  */
    invoke: function (path, locals) {
        var result;

        if (!_.has(this.__tasks, path)) {
            this.__tasks[path] = new TaskCache();
        }

        result = this.__tasks[path].get(locals);

        if (result) {

            return result;
        }

        result = this.__executeUnit(path, locals);

        this.__tasks[path].set(locals, result);

        return result;
    },

    /**
     * @protected
     * @memberOf {Track}
     * @method
     *
     * @param {String} path
     * @param {Object} [params]
     *
     * @returns {Deps}
     * */
    _createContext: function (path, params) {

        return new Deps(this, path, params);
    },

    /**
     * @private
     * @memberOf {Track}
     * @method
     *
     * @param {String} path
     * @param {Object} [params]
     *
     * @returns {vow.Promise}
     * */
    __executeUnit: function (path, params) {

        return this._createContext(path, params).execute();
    }

});

module.exports = Track;
