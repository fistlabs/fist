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
         * TODO remove this behaviour
         *
         * Шаблоны для track.render()
         *
         * @public
         * @memberOf {Server}
         * @property
         * @type {Object<Function>}
         * */
        this.renderers = {};

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
        var sys = self.channel('sys');

        return function (req, res) {
            var date = new Date();
            var track = self._createTrack(req, res);

            sys.emit('request', track);
            self.handle(track).done(function (resp) {
                Response.end(res, resp);
                track.time = new Date() - date;
                sys.emit('response', track);
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
     * @param {String} rule
     * @param {{unit?:String, name?:String}|String} [data]
     *
     * @returns {Server}
     * */
    route: function (rule, data) {
        var route;

        if (!_.isObject(data)) {
            data = {name: data};
        }

        route = this.router.addRule(rule, data);

        if (_.isUndefined(route.data.unit) || _.isNull(route.data.unit)) {
            route.data.unit = route.data.name;
        }

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
            this.route(unit.rule, unit.path);
        }

        return unit;
    }

});

module.exports = Server;
