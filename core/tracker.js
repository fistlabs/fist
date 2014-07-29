'use strict';

var Agent = /** @type Agent */ require('./agent');

var _ = require('lodash-node');
var glob = require('glob');
var inherit = require('inherit');
var reduce = require('./util/reduce');
var vow = require('vow');

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
     * */
    plug: function () {
        this.__plugs = this.__plugs.concat(_.flatten(arguments));

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

        return reduce(this.__plugs, this.__pluginReducer, [], this).
            then(this.__callPlugins, this).then(this.__base, this);
    },

    /**
     * @private
     * @memberOf {Tracker}
     * @method
     *
     * @param {Array<Function>} funcs
     *
     * @returns {*}
     * */
    __callPlugins: function (funcs) {

        return _.reduce(funcs, function (promise, func) {

            return promise.then(function () {
                var defer;

                if ( !func.length ) {

                    return func.call(this);
                }

                defer = vow.defer();

                func.call(this, function (err) {

                    if ( arguments.length ) {
                        defer.reject(err);

                        return;
                    }

                    defer.resolve();
                });

                return defer.promise();
            }, this);
        }, vow.resolve(), this);
    },

    /**
     * @private
     * @memberOf {Tracker}
     * @method
     *
     * @param {Array<Function>} funcs
     * @param {Function|String} func
     *
     * @returns {*}
     * */
    __pluginReducer: function (funcs, func) {
        var defer;

        if ( _.isFunction(func) ) {

            return funcs.concat(func);
        }

        defer = vow.defer();

        glob(func, {silent: true}, function (err, func) {

            if ( 2 > arguments.length ) {
                defer.reject(err);

                return;
            }

            func = _.map(func, require);

            defer.resolve(funcs.concat(func));
        });

        return defer.promise();
    }

});

module.exports = Tracker;
