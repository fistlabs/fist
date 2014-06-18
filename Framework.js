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
         * Тут откладываются запросы поступившие во время инициализации
         *
         * @protected
         * @memberOf {Framework}
         * @property
         * @type {Array<Track>}
         * */
        this._pends = [];

        /**
         * Плагины, задачи на инициализацию
         *
         * @protected
         * @memberOf {Framework}
         * @property
         * @type {Array<Function>}
         * */
        this._plugs = [];

        /**
         * Шаблоны для track.render()
         *
         * @public
         * @memberOf {Framework}
         * @property
         * @type {Object<Function>}
         * */
        this.renderers = Object.create(null);

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

            res.once('finish', function () {
                track.time = new Date() - date;
                self.emit('sys:response', track);
            });

            self.emit('sys:request', track);

            self._handle(track);
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
     * Добавляет плагин[ы]
     *
     * @public
     * @memberOf {Framework}
     * @method
     * */
    plug: function () {

        var plugs = _.map(arguments, this.__wrapPlugin, this);

        Array.prototype.push.apply(this._plugs, plugs);
    },

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
    },

    /**
     * @protected
     * @memberOf {Framework}
     * @method
     *
     * @returns {vow.Promise}
     * */
    _getReady: function () {

        var promise = this.__base().then(function () {

            return vow.all(_.map(this._plugs, function (plug) {
                return plug();
            }));
        }, this);

        promise.always(function () {

            while ( _.size(this._pends) ) {
                this._handle(this._pends.shift());
            }

        }, this).done();

        return promise;
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

        this.__base(track, path, params).
            always(function (res) {

                if ( track.sent() ) {

                    return;
                }

                defer.resolve(res);
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
        /*eslint complexity: [2, 11]*/
        var self = this;

        //  был сделан send() где-то в обработчке события sys:request
        if ( track.sent() ) {

            return;
        }

        //  При инициализации произошла ошибка
        if ( this.ready().isRejected() ) {
            track.send(502);

            return;
        }

        //  еще не проинициализирован
        if ( !this.ready().isResolved() ) {
            //  отложить запрос
            this._pends.push(track);

            return;
        }

        function next () {
            //  выбирается маршрут
            var route = self.router.
                find(track.method, track.url.pathname, track.route);

            //  однозначно нет такого маршрута
            if ( null === route ) {

                self.emit('sys:ematch', track);
                track.send(404);

                return;
            }

            //  возвращен массив
            if ( _.isArray(route) ) {
                //  это тоже значит что нет такого роута
                self.emit('sys:ematch', track);

                //  если массив пустой, то на сервере совсем нет ни одного
                //  маршрута отвечающего по такому методу запроса
                if ( 0 === route.length ) {
                    //  Not Implemented
                    track.send(501);

                    return;
                }

                //  Иначе есть такие маршруты, но для них не
                // поддерживается такой метод
                track.header('Allow', route.join(', '));

                //  Method Not Allowed
                track.send(405);

                return;
            }

            track.match = route.match;
            route = route.route;
            track.route = route.data.name;

            self.emit('sys:match', track);

            self.resolve(track, route.data.unit).
                done(function () {
                    next();
                }, function (err) {
                    track.send(500, err);
                });
        }

        next();
    }

});

module.exports = Framework;
