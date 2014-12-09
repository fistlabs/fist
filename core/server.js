'use strict';

var Core = /** @type Server */ require('./core');
var Connect = /** @type Connect */ require('./connect');
var Router = /** @type Router */ require('finger/core/router');

var _ = require('lodash-node');
var http = require('http');
var proxyAddr = require('proxy-addr');
var uniqueId = require('unique-id');
var vow = require('vow');

var STATUS_CODES = http.STATUS_CODES;

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
        var requestId = req.id || req.headers['x-request-id'] || uniqueId();
        var logger = self.logger.bind(requestId);

        logger.info('Incoming %(method)s %(url)s %s', function () {
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

            logger[recordType]('%d %s (%dms)', statusCode, STATUS_CODES[statusCode], new Date() - dExecStart);
        });

        self.handle(req, res, logger).done();
    };
};

/**
 * @public
 * @memberOf {Server}
 * @method
 *
 * @returns {vow.Promise}
 * */
Server.prototype.handle = function (req, res, logger) {
    var promise = this.ready();

    //  -1 possible tick
    if (promise.isFulfilled()) {
        return this._initTrack(req, res, logger);
    }

    //  wait for init
    return promise.then(function () {
        return this._initTrack(req, res, logger);
    }, this);
};

/**
 * @protected
 * @memberOf {Server}
 * @method
 *
 * @returns {vow.Promise}
 * */
Server.prototype._initTrack = function (req, res, logger) {
    var matches;
    var path = req.url;
    var router = this.router;
    var verb = req.method;

    if (!router.isImplemented(verb)) {
        logger.warn('There is no %s handlers', verb);
        res.statusCode = 501;
        res.end(STATUS_CODES[501]);
        return vow.resolve();
    }

    matches = router.matchAll(verb, path);

    if (!matches.length) {
        matches = router.matchVerbs(path);

        if (matches.length) {
            logger.warn('The method %s is not allowed for resource %s', verb, path);
            res.statusCode = 405;
            res.setHeader('Allow', matches.join(', '));
            res.end(STATUS_CODES[405]);
            return vow.resolve();
        }

        //  matches === [] here
    }

    return this._nextRun(new Connect(this, logger, req, res), matches);
};

/**
 * @private
 * @memberOf {Connect}
 * @method
 *
 * @returns {vow.Promise}
 * */
Server.prototype._nextRun = function (track, matches) {
    var match;
    var outgoing;

    if (!matches.length) {
        track.logger.warn('There is no matching route');
        track.status(404).send();
        return vow.resolve();
    }

    match = matches.shift();
    track.params = match.args;
    track.route = match.data.name;
    track.logger.note('Match "%(data.name)s" route ~ %(args)j', match);
    outgoing = track.outgoing;

    /** @this {Server} */
    return track.eject(match.data.unit).
        then(function () {
            if (!outgoing.headersSent) {
                return this._nextRun(track, matches);
            }

            return void 0;
        }, function (err) {
            if (!outgoing.headersSent) {
                track.status(500).send(err);
            }
        }, this);
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
