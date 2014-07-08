'use strict';

var Agent = require('./Agent');
var Ctx = /** @type Ctx */ require('./ctx/Ctx');
var Path = require('path');

var _ = require('lodash-node');
var inherit = require('inherit');
var vow = require('vow');

var plugUnits = require('./plug/units');

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

        var units;

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

        //  добавляю в параметры встроенные узлы
        units = this.params.units;

        //  Может это в сам плагин добавить?
        if ( _.isUndefined(units) || _.isNull(units) ) {
            this.params.units = [Tracker.BUNDLED_UNITS_PATH];

        } else if ( !_.isArray(units) ) {
            //  Добавляю в начало чтобы можно было
            // переопредедить встроенные узлы
            this.params.units = [Tracker.BUNDLED_UNITS_PATH, units];

        } else {
            this.params.units.unshift(Tracker.BUNDLED_UNITS_PATH);
        }

        this.plug(plugUnits);
    },

    /**
     * @public
     * @memberOf {Tracker}
     * @method
     * */
    plug: function () {
        Array.prototype.push.apply(this.__plugs, arguments);
    },

    /**
     * Запускает операцию разрешения узла
     *
     * @public
     * @memberOf {Tracker}
     * @method
     *
     * @param {Track} track
     * @param {String} path
     * @param {*} [params]
     *
     * @returns {Promise}
     * */
    resolve: function (track, path, params) {

        var ready = this.ready();

        //  -1 possible tick
        if ( ready.isResolved() ) {

            return this.__resolveUnit(track, path, params);
        }

        return ready.then(function () {

            return this.__resolveUnit(track, path, params);
        }, this);
    },

    /**
     * @private
     * @memberOf {Tracker}
     * @method
     *
     * @param {Track} track
     * @param {String} path
     * @param {Object} [params]
     *
     * @returns {Promise}
     * */
    __resolveUnit: function (track, path, params) {

        if ( !_.has(track.tasks, path) ) {
            track.tasks[path] = this._createCtx(track, path, params).execute();
        }

        return track.tasks[path];
    },

    /**
     * @protected
     * @memberOf {Tracker}
     * @method
     *
     * @param {Track} track
     * @param {String} path
     * @param {Object} params
     *
     * @returns {Ctx}
     * */
    _createCtx: function (track, path, params) {

        return new Ctx(track, path, params);
    },

    /**
     * @protected
     * @memberOf {Tracker}
     * @method
     *
     * @returns {Promise}
     * */
    _getReady: function () {
        var plugins = _.map(this.__plugs, this.__invokePlugin, this);

        return vow.all(plugins).then(this.__base, this);
    },

    /**
     * @private
     * @memberOf {Tracker}
     * @method
     *
     * @param {Function} plug
     *
     * @returns {Promise}
     * */
    __invokePlugin: function (plug) {

        return vow.invoke(this.__wrapPlugin(plug));
    },

    /**
     * @private
     * @memberOf {Tracker}
     * @method
     *
     * @param {Function} plug
     *
     * @returns {Function}
     * */
    __wrapPlugin: function (plug) {

        var self = this;

        return function () {

            var defer = vow.defer();

            plug.call(self, function (err) {

                if ( 0 === arguments.length ) {
                    defer.resolve();

                    return;
                }

                defer.reject(err);
            });

            return defer.promise();
        };
    }

}, {

    /**
     * @public
     * @static
     * @memberOf Tracker
     * @const
     * @property
     * @type {String}
     * */
    BUNDLED_UNITS_PATH: Path.join(__dirname, 'unit', 'decl', '**', '*.js')
});

module.exports = Tracker;
