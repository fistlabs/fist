'use strict';

var Deps = require('../deps/deps');

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
         * @public
         * @memberOf {Track}
         * @property
         * @type {Object}
         * */
        this.tasks = {};
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

        if ( 1 < arguments.length ) {

            return this.__executeUnit(path, locals);
        }

        if ( !_.has(this.tasks, path) ) {
            this.tasks[path] = this.__executeUnit(path, locals);
        }

        return this.tasks[path];
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
