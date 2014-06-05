'use strict';

var Http = require('http');

var Connect = /** @type Connect */ require('./track/Connect');
var Router = /** @type Router */ require('finger/Router');
var Tracker = /** @type Tracker */ require('./Tracker');

var _ = /** @type _ */ require('lodash-node');
var vow = require('vow');

/**
 * @class Framework
 * @extends Tracker
 * */
var Framework = Tracker.extend(/** @lends Framework.prototype */ {

    /**
     * @protected
     * @memberOf {Framework}
     * @method
     *
     * @constructs
     * */
    constructor: function () {
        Framework.Parent.apply(this, arguments);

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
         * Количество запущенных инициализаций
         *
         * @protected
         * @memberOf {Framework}
         * @property
         * @type {Number}
         * */
        this._pending = 0;

        /**
         * Состояние приложения
         *
         * @protected
         * @memberOf {Framework}
         * @property
         * @type {Number}
         * */
        this._state = -1;

        /**
         * Плагины, задачи на инициализацию
         *
         * @protected
         * @memberOf {Framework}
         * @property
         * @type {Array<Function>}
         * */
        this._tasks = [];

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
        this.ready();

        return server;
    },

    /**
     * Добавляет плагин
     *
     * @public
     * @memberOf {Framework}
     * @method
     * */
    plug: function () {
        Array.prototype.push.apply(this._tasks, arguments);
    },

    /**
     * Запускает инициализацию приложения
     *
     * @public
     * @memberOf {Framework}
     * @method
     * */
    ready: function () {

        var length = this._tasks.length;
        var self = this;

        //  приложение в состоянии ошибки
        if ( 1 === this._state ) {

            return;
        }

        this._state = -1;

        if ( 0 === this._pending ) {
            this.emit('sys:pending');
        }

        //  увеличиваю количество запросов на инициализацию
        this._pending += 1;

        //  нет задач
        if ( 0 === length ) {
            this._pending -= 1;

            if ( 0 === this._pending ) {
                this._state = 0;
                this.emit('sys:ready');
                // TODO RESEARCH: могут ли тут быть отложенные запросы?
            }

            return;
        }

        function ready (err) {

            //  разрешение плагина не требуется,
            // потому что уже произошла ошибка
            if ( 1 === self._state ) {

                return;
            }

            //  плагин разрешен с ошибкой
            if ( arguments.length ) {
                //  Если произошла критическая ошибка то вы можете
                // поджечь сами sys:ready если можете ее разрешить
                self.once('sys:ready', function () {
                    self._pending -= 1;
                    self._state = 0;
                    ready();
                });

                self._state = 1;
                self.emit('sys:error', err);

                return;
            }

            //  уменьшаем количество разрешенных задач
            length -= 1;

            //  все задачи разрешены
            if ( 0 === length ) {
                //  уменьшаем количество запросов на инициализацию
                self._pending -= 1;

                //  все запросы на инициализацию завершены
                if ( 0 === self._pending ) {
                    self._state = 0;
                    self.emit('sys:ready');

                    while ( self._pends.length ) {
                        self._handle(self._pends.shift());
                    }
                }
            }
        }

        while ( this._tasks.length ) {

            if ( 1 === self._state ) {

                break;
            }

            this._tasks.shift().call(this, ready);
        }
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

        Framework.parent.resolve.call(this, track, path, params).
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
     * @public
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
        if ( 1 === this._state ) {
            track.send(502);

            return;
        }

        //  еще не проинициализирован
        if ( -1 === this._state ) {
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
                done(next, function (err) {
                    track.send(500, err);
                });
        }

        next();
    }

});

module.exports = Framework;
