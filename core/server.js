'use strict';

var Core = /** @type Server */ require('./core');
var Connect = /** @type Connect */ require('./connect');
var Router = /** @type Router */ require('finger/core/router');

var _ = require('lodash-node');
var http = require('http');
var proxyAddr = require('proxy-addr');

/**
 * @class Server
 * @extends Core
 * */
function Server(params) {
    params = _.extend({
        trustProxy: 'loopback'
    }, params);

    Core.call(this, params);

    //  compile parameter
    this.params.trustProxy = proxyAddr.compile(this.params.trustProxy);

    /**
     * @public
     * @memberOf {Server}
     * @property
     * @type {Router}
     * */
    this.router = new Router(this.params.router);
}

Server.prototype = Object.create(Core.prototype);

/**
 * @public
 * @memberOf {Server}
 * @method
 *
 * @constructs
 * */
Server.prototype.constructor = Server;

/**
 * Возвращает коллбэк для запросов на сервер
 *
 * @public
 * @memberOf {Server}
 * @method
 *
 * @returns {Function}
 * */
Server.prototype.getHandler = function () {
    var self = this;

    return function (req, res) {
        var dExecStart = new Date();
        var track = new Connect(self, req, res);

        track.logger.info('Incoming %(method)s %(url)s %s', function () {
            var name;
            var headers = '';
            for (name in req.headers) {
                if (req.headers.hasOwnProperty(name)) {
                    headers += '\n\t' + name + ': ' + req.headers[name];
                }
            }

            return headers;
        }, req);

        res.on('finish', function () {
            var statusCode = res.statusCode;
            var statusText = http.STATUS_CODES[statusCode];
            var recordType;

            switch (true) {

                case statusCode >= 500:
                    //  Server errors
                    recordType = 'error';

                    break;

                case statusCode >= 400:
                    //  Client errors
                    recordType = 'warn';

                    break;

                case statusCode >= 300:
                    //  Redirects
                    recordType = 'log';

                    break;

                default:
                    //  Usual cases
                    recordType = 'info';

                    break;
            }

            track.logger[recordType]('%d %s (%dms)',
                statusCode, statusText, new Date() - dExecStart);
        });

        self.handle(track).done();
    };
};

/**
 * @public
 * @memberOf {Server}
 * @method
 *
 * @returns {vow.Promise}
 * */
Server.prototype.handle = function (track) {
    var promise = this.ready();

    //  -1 possible tick
    if (promise.isFulfilled()) {
        return track.run();
    }

    //  wait for init
    return promise.then(track.run, track);
};

/**
 * Запускает сервер и инициализацию приложения
 *
 * @public
 * @memberOf {Server}
 * @method
 * */
Server.prototype.listen = function () {
    var server = http.createServer(this.getHandler());

    //  автоматически запускаю инициализацию
    this.ready().done();

    server.listen.apply(server, arguments);

    return server;
};

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
Server.prototype.route = function (ruleString, ruleData) {
    if (!_.isObject(ruleData)) {
        ruleData = {name: ruleData};
    }

    if (!ruleData.unit) {
        ruleData.unit = ruleData.name;
    }

    this.router.addRule(ruleString, ruleData);

    return this;
};

module.exports = Server;
