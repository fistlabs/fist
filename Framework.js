'use strict';

var Http = require('http');

var Connect = /** @type Connect */ require('./track/Connect');
var Nested = /** @type Nested */ require('./bundle/Nested');
var Router = /** @type Router */ require('./router/Router');
var Tracker = /** @type Tracker */ require('./Tracker');

var caller = require('./util/caller');

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
         * @property {Object<Function>}
         * */
        this.renderers = Object.create(null);

        /**
         * @public
         * @memberOf {Framework}
         * @property {Router}
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

        //  увеличиваю количество запросов на инициализацию
        this._pending += 1;

        if ( 1 === this._pending ) {
            this.emit('sys:pending');
        }

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
            if ( 1 === arguments.length ) {
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

            caller.callFunc(this._tasks.shift().bind(this), [], ready);
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
     * @param {Function} done
     * */
    resolve: function (track, path, done) {

        function resolve () {

            if ( track.sent() ) {

                return;
            }

            done.apply(this, arguments);
        }

        return Framework.parent.resolve.call(this, track, path, resolve);
    },

    /**
     * Определяет маршрут встроенного роутера
     *
     * @public
     * @memberOf {Framework}
     * @method
     * */
    route: function () {
        this.router.addRoute.apply(this.router, arguments);

        return this;
    },

    /**
     * @protected
     * @memberOf {Framework}
     * @method
     *
     * @param {Function} func
     * @param {Runtime} track
     * @param {Bundle} bundle
     * @param {Function} done
     * */
    _call: function (func, track, bundle, done) {

        if ( 'function' === typeof func ) {
            caller.callFunc.call(this, func,
                [track, bundle.errors, bundle.result], done);

            return;
        }

        caller.callRet.call(this, func, done, true);
    },

    /**
     * @protected
     * @memberOf {Framework}
     * @method
     *
     * @returns {Nested}
     * */
    _createBundle: function () {

        return new Nested();
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
     *
     * @returns {*}
     * */
    _findRoute: function (track) {

        return this.router.find(track);
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
        var mdata;
        var rdata;

        if ( 1 === this._state ) {

            return;
        }

        if ( 0 !== this._state || 0 !== this._pending ) {
            this._pends.push(track);

            return;
        }

        if ( track.sent() ) {

            return;
        }

        mdata = this._findRoute(track);

        //  по сути такой роутер может сделать send
        //  если он сделал send то он конечно понимает что он сделал
        //  такой поступок не может быть необдуманным, мы прекращаем
        //  обработку запроса
        if ( track.sent() ) {

            return;
        }

        //  однозначно нет такого маршрута
        if ( null === mdata ) {
            this.emit('sys:ematch', track);
            track.send(404);

            return;
        }

        //  возвращен массив
        if ( Array.isArray(mdata) ) {
            //  это тоже значит что нет такого роута
            this.emit('sys:ematch', track);

            //  если массив пустой, то на сервере совсем нет ни одного
            //  маршрута отвечающего по такому методу запроса
            if ( 0 === mdata.length ) {
                //  Not Implemented
                track.send(501);

                return;
            }

            //  Иначе есть такие маршруты, но для них не
            // поддерживается такой метод
            track.header('Allow', mdata.join(', '));
            //  Method Not Allowed
            track.send(405);

            return;
        }

        this.emit('sys:match', track);

        track.match = mdata.match;
        track.route = mdata.route.name;

        rdata = mdata.route.data;

        if ( Object(rdata) === rdata ) {
            rdata = rdata.unit;
        }

        this.resolve(track, rdata || track.route, function (err, res) {

            if ( 2 > arguments.length ) {
                track.send(500, err);

                return;
            }

            track.send(200, res);
        });
    }

});

module.exports = Framework;
