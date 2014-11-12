'use strict';

var Connect = /** @type Connect */ require('./track/connect');
var Router = /** @type Router */ require('finger/core/router');
var Response = /** @type Response */ require('./track/response');
var Tracker = /** @type Tracker */ require('./tracker');

var _ = require('lodash-node');
var http = require('http');
var inherit = require('inherit');

/**
 * @class Server
 * @extends Tracker
 * */
var Server = inherit(Tracker, /** @lends Server.prototype */ {

    /**
     * @private
     * @memberOf {Server}
     * @method
     *
     * @param {Object} [params]
     *
     * @constructs
     * */
    __constructor: function (params) {
        this.__base(params);

        /**
         * @public
         * @memberOf {Server}
         * @property
         * @type {Router}
         * */
        this.router = this._createRouter(this.params.router);
    },

    /**
     * Возвращает коллбэк для запросов на сервер
     *
     * @public
     * @memberOf {Server}
     * @method
     *
     * @returns {Function}
     * */
    getHandler: function () {
        var self = this;

        return function (req, res) {
            var execStartDate = new Date();
            var track = self._createTrack(req, res);

            track.logger.info('Incoming %s %s\n', req.method, req.url, req.headers);

            self.handle(track).done(function (resp) {
                var statusCode = res.statusCode;
                var statusText = http.STATUS_CODES[statusCode] || String(statusCode);
                var logRecorder;

                Response.end(res, resp);

                switch (true) {

                    case statusCode >= 500:
                        //  Server errors
                        logRecorder = 'error';

                        break;

                    case statusCode >= 400:
                        //  Client errors
                        logRecorder = 'warn';

                        break;

                    case statusCode >= 300:
                        //  Redirects
                        logRecorder = 'log';

                        break;

                    default:
                        //  Usual cases
                        logRecorder = 'info';

                        break;
                }

                track.logger[logRecorder]('%d (%s) %dms', statusCode, statusText, new Date() - execStartDate);
            });
        };
    },

    /**
     * @public
     * @memberOf {Server}
     * @method
     *
     * @returns {vow.Promise}
     * */
    handle: function (track) {
        var promise = this.ready();

        //  -1 possible tick
        if (promise.isFulfilled()) {
            return track.run();
        }

        //  wait for init
        return promise.then(track.run, track.handleReject, track);
    },

    /**
     * Запускает сервер и инициализацию приложения
     *
     * @public
     * @memberOf {Server}
     * @method
     * */
    listen: function () {
        var server = http.createServer(this.getHandler());

        server.listen.apply(server, arguments);

        //  автоматически запускаю инициализацию
        this.ready();

        return server;
    },

    /**
     * Определяет маршрут встроенного роутера
     *
     * @public
     * @memberOf {Server}
     * @method
     *
     * @param {String} ruleString
     * @param {{unit?:String, name?:String}|String} [ruleData]
     *
     * @returns {Server}
     * */
    route: function (ruleString, ruleData) {

        if (!_.isObject(ruleData)) {
            ruleData = {name: ruleData};
        }

        if (_.isUndefined(ruleData.unit) || _.isNull(ruleData.unit)) {
            ruleData.unit = ruleData.name;
        }

        this.router.addRule(ruleString, ruleData);

        return this;
    },

    /**
     * @protected
     * @memberOf {Server}
     * @method
     *
     * @param {*} [params]
     *
     * @returns {Router}
     * */
    _createRouter: function (params) {

        return new Router(params);
    },

    /**
     * @protected
     * @memberOf {Server}
     * @method
     *
     * @returns {Connect}
     * */
    _createTrack: function (req, res) {

        return new Connect(this, null, req, res);
    },

    /**
     * @protected
     * @memberOf {Server}
     * @method
     *
     * @param {Function} Unit
     *
     * @returns {Unit}
     * */
    _instUnit: function (Unit) {
        var unit = this.__base(Unit);

        if (_.isString(unit.rule)) {
            this.route(unit.rule, unit.name);
        }

        return unit;
    }

});

module.exports = Server;
