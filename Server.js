'use strict';

var Router = /** @type Router */ require('./router/Router');
var Connect = /** @type Connect */ require('./track/Connect');
var Tracker = /** @type Tracker */ require('./Tracker');

/**
 * @class Server
 * @extends Tracker
 * */
var Server = Tracker.extend(/** @lends Server.prototype */ {

    /**
     * @protected
     * @memberOf {Server}
     * @method
     *
     * @constructs
     * */
    constructor: function () {
        Server.Parent.apply(this, arguments);

        /**
         * @public
         * @memberOf {Server}
         * @property {Router}
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

        return Server.parent.resolve.call(this, track, path, resolve);
    },

    /**
     * Определяет маршрут встроенного роутера
     *
     * @public
     * @memberOf {Server}
     * @method
     * */
    route: function () {
        this.router.addRoute.apply(this.router, arguments);

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
     * @public
     * @memberOf {Server}
     * @method
     *
     * @returns {Connect}
     * */
    _createTrack: function (req, res) {

        return new Connect(this, req, res);
    },

    /**
     * @protected
     * @memberOf {Server}
     * @method
     *
     * @param {Connect} track
     * */
    _handle: function (track) {

        var mdata;
        var rdata;

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
    },

    /**
     * @protected
     * @memberOf {Server}
     * @method
     *
     * @param {Connect} track
     *
     * @returns {*}
     * */
    _findRoute: function (track) {

        return this.router.find(track);
    }

});

module.exports = Server;
