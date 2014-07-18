'use strict';

var Connect = /** @type Connect */ require('./track/Connect');
var Http = require('http');
var Router = /** @type Router */ require('finger/Router');
var Res = /** @type Res */ require('./res/Res');
var Response = /** @type Response */ require('./util/response');
var Rewrite = /** @type Rewrite */ require('./util/rewrite');
var Tracker = /** @type Tracker */ require('./Tracker');

var _ = require('lodash-node');
var inherit = require('inherit');
var plugRoutes = require('./plug/routes');

/**
 * @class Framework
 * @extends Tracker
 * */
var Framework = inherit(Tracker, /** @lends Framework.prototype */ {

    /**
     * @private
     * @memberOf {Framework}
     * @method
     *
     * @param {Object} [params]
     *
     * @constructs
     * */
    __constructor: function (params) {
        this.__base(params);

        /**
         * Шаблоны для track.render()
         *
         * @public
         * @memberOf {Framework}
         * @property
         * @type {Object<Function>}
         * */
        this.renderers = {};

        /**
         * @public
         * @memberOf {Framework}
         * @property
         * @type {Router}
         * */
        this.router = this._createRouter(this.params.router);

        if ( !this.params.routes ) {
            this.params.routes = 'routes';
        }

        this.plug(plugRoutes);
    },

    /**
     * Возвращает коллбэк для запросов на сервер
     *
     * @public
     * @memberOf {Framework}
     * @method
     *
     * @returns {Function}
     * */
    getHandler: function () {

        var self = this;

        return function (req, res) {

            var date = new Date();
            var track = self._createTrack(req, res);

            self.emit('sys:request', track);

            self.__next(track).done(function (resp) {
                Res.end(res, resp);
                track.time = new Date() - date;
                self.emit('sys:response', track);
            });
        };
    },

    /**
     * Запускает сервер и инициализацию приложения
     *
     * @public
     * @memberOf {Framework}
     * @method
     * */
    listen: function () {

        var server = Http.createServer(this.getHandler());

        server.listen.apply(server, arguments);

        //  автоматически запускаю инициализацию
        this.ready(true);

        return server;
    },

    /**
     * Определяет маршрут встроенного роутера
     *
     * @public
     * @memberOf {Framework}
     * @method
     *
     * @param {String} pattern
     * @param {{unit?:String, name?:String}|String} [data]
     *
     * @returns {Framework}
     * */
    route: function (pattern, data) {

        var route;

        if ( !_.isObject(data) ) {
            data = {name: data};
        }

        route = this.router.addRoute(pattern, data);

        if ( _.isUndefined(route.data.unit) || _.isNull(route.data.unit) ) {
            route.data.unit = route.data.name;
        }

        return this;
    },

    /**
     * @protected
     * @memberOf {Framework}
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
     * @memberOf {Framework}
     * @method
     *
     * @returns {Connect}
     * */
    _createTrack: function (req, res) {

        return new Connect(this, req, res);
    },

    /**
     * @private
     * @memberOf {Framework}
     * @method
     *
     * @param {Connect} track
     *
     * @returns {vow.Promise}
     * */
    __next: function (track) {
        //  выбирается маршрут
        var result = this.router.
            find(track.method, track.url.pathname, track.route);

        //  однозначно нет такого маршрута
        if ( _.isNull(result) ) {
            this.emit('sys:ematch', track);
            //  Not Found
            return track.send(404);
        }

        //  возвращен массив
        if ( _.isArray(result) ) {
            //  это тоже значит что нет такого роута
            this.emit('sys:ematch', track);

            //  если массив пустой, то на сервере совсем нет ни одного
            //  маршрута отвечающего по такому методу запроса
            if ( 0 === _.size(result) ) {
                //  Not Implemented
                return track.send(501);
            }

            //  Иначе есть такие маршруты, но для них не
            // поддерживается такой метод
            track.header('Allow', result.join(', '));

            //  Method Not Allowed
            return track.send(405);
        }

        track.match = result.match;
        track.route = result.route.data.name;

        this.emit('sys:match', track);

        return this.resolve(track, result.route.data.unit).
            then(function (data) {
                //  was sent
                if ( data instanceof Response ) {

                    return this.__handleResponse(track, data);
                }

                //  rewrite
                if ( data instanceof Rewrite ) {

                    return this.__handleRewrite(track, data);
                }

                return this.__next(track);
            }, function (err) {

                return track.send(500, err);
            }, this);
    },

    /**
     * @private
     * @memberOf {Framework}
     * @method
     *
     * @param {Connect} track
     * @param {Response} data
     *
     * @returns {Response}
     * */
    __handleResponse: function (track, data) {

        return data;
    },

    /**
     * @private
     * @memberOf {Framework}
     * @method
     *
     * @param {Connect} track
     * @param {Rewrite} data
     *
     * @returns {vow.Promise}
     * */
    __handleRewrite: function (track, data) {
        //  чтобы начать матчить сначала
        delete track.route;
        //  удаляем все кэши
        track.tasks = {};
        //  переписываем url
        track.url = track.req.createUrl(data.path);

        return this.__next(track);
    }

});

module.exports = Framework;
