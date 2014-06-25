'use strict';

var Http = require('http');

var Connect = /** @type Connect */ require('./track/Connect');
var Router = /** @type Router */ require('finger/Router');
var Tracker = /** @type Tracker */ require('./Tracker');

var _ = require('lodash-node');
var inherit = require('inherit');
var vow = require('vow');

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

            self._handle(track).always(function () {
                track.time = new Date() - date;
                this.emit('sys:response', track);
            }, self);
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
     * Запускает операцию разрешения узла.
     * Если один из узлов, участвующих в операции
     * разрешения выполнил ответ приложения самостоятельно,
     * то коллбэк вызван не будет
     *
     * @public
     * @memberOf {Tracker}
     * @method
     *
     * @param {Connect} track
     * @param {String} path
     * @param {*} [params]
     *
     * @returns {vow.Promise}
     * */
    resolve: function (track, path, params) {

        var defer = vow.defer();

        if ( track.res.hasResponded() ) {

            return defer.promise();
        }

        this.__base(track, path, params).
            always(function (promise) {

                if ( track.res.hasResponded() ) {

                    return;
                }

                defer.resolve(promise);
            });

        return defer.promise();
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
     * @protected
     * @memberOf {Framework}
     * @method
     *
     * @param {Connect} track
     * */
    _handle: function (track) {

        //  был сделан send() где-то в обработчике события sys:request
        if ( track.res.hasResponded() ) {

            return track.res.respondDefer.promise();
        }

        function next () {
            //  выбирается маршрут
            var result = this.router.
                find(track.method, track.url.pathname, track.route);

            //  однозначно нет такого маршрута
            if ( null === result ) {
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
                if ( 0 === result.length ) {
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

            this.resolve(track, result.route.data.unit).
                done(next, function (err) {

                    return track.send(500, err);
                }, this);

            return track.res.respondDefer.promise();
        }

        return next.call(this);
    }

});

module.exports = Framework;
