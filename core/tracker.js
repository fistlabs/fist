'use strict';

var Agent = /** @type Agent */ require('./agent');

var _ = require('lodash-node');
var inherit = require('inherit');
var path = require('path');
var vow = require('vow');
var vowFs = require('vow-fs');

/**
 * @class Tracker
 * @extends Agent
 * */
var Tracker = inherit(Agent, /** @lends Tracker.prototype */ {

    /**
     * @private
     * @memberOf {Tracker}
     * @method
     *
     * @constructs
     *
     * @param {Object} [params]
     * */
    __constructor: function (params) {
        this.__base(params);

        /**
         * @public
         * @memberOf {Tracker}
         * @property
         * @type {Object}
         * */
        this.tasks = {};

        /**
         *
         * @private
         * @memberOf {Tracker}
         * @property
         * @type {Array<Function>}
         * */
        this.__plugs = [];
    },

    /**
     * @public
     * @memberOf {Tracker}
     * @method
     *
     * @param {String|Array<String>...} plugins
     *
     * @returns {Tracker}
     * */
    include: function (plugins) {
        plugins = _.flatten(arguments);
        plugins = _.map(plugins, this.__createInclude, this);

        return this.plug(plugins);
    },

    /**
     * @public
     * @memberOf {Tracker}
     * @method
     *
     * @returns {Tracker}
     * */
    plug: function (plugins) {
        plugins = _.flatten(arguments);
        Array.prototype.push.apply(this.__plugs, plugins);

        return this;
    },

    /**
     * @protected
     * @memberOf {Tracker}
     * @method
     *
     * @returns {vow.Promise}
     * */
    _getReady: function () {

        return this.__callPlugins(this.__plugs).then(this.__base, this);
    },

    /**
     * @private
     * @memberOf {Tracker}
     * @method
     *
     * @param {Array<Function>} funcs
     *
     * @returns {vow.Promise}
     * */
    __callPlugins: function (funcs) {

        return _.reduce(funcs, function (promise, func) {

            return promise.then(function () {

                return this.__callPlugin(func);
            }, this);
        }, vow.resolve(), this);
    },

    /**
     * @private
     * @memberOf {Tracker}
     * @method
     *
     * @param {*} plugin
     *
     * @returns {vow.Promise}
     * */
    __callPlugin: function (plugin) {

        if (!_.isFunction(plugin)) {

            return vow.resolve(plugin);
        }

        if (!plugin.length) {

            return vow.invoke(function (thisp) {

                return plugin.call(thisp);
            }, this);
        }

        return vow.invoke(function (thisp) {
            var defer = vow.defer();

            plugin.call(thisp, function (err) {

                if (!arguments.length) {
                    defer.resolve();

                } else {
                    defer.reject(err);
                }
            });

            return defer.promise();
        }, this);
    },

    /**
     * @private
     * @memberOf {Tracker}
     * @method
     *
     * @param {String} pattern
     *
     * @returns {Function}
     * */
    __createInclude: function (pattern) {

        return function () {

            return this.__findPlugins(pattern).
                then(this.__callPlugins, this);
        };
    },

    /**
     * @private
     * @memberOf {Tracker}
     * @method
     *
     * @param {String} pattern
     *
     * @returns {vow.Promise}
     * */
    __findPlugins: function (pattern) {

        return vowFs.glob(pattern, {silent: true}).then(this.__requirePlugins, this);
    },

    /**
     * @private
     * @memberOf {Tracker}
     * @method
     *
     * @param {Array<String>} paths
     *
     * @returns {vow.Promise}
     * */
    __requirePlugins: function (paths) {

        return _.map(paths, this.__requirePlugin, this);
    },

    /**
     * @private
     * @memberOf {Tracker}
     * @method
     *
     * @param {String} fileName
     *
     * @returns {vow.Promise}
     * */
    __requirePlugin: function (fileName) {
        fileName = path.resolve(this.params.cwd, fileName);

        return require(fileName);
    }

});

module.exports = Tracker;
