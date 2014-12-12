'use strict';

var Core = /** @type Server */ require('./core');
var Connect = /** @type Connect */ require('./connect');
var Router = /** @type Router */ require('finger/core/router');

var _ = require('lodash-node');
var http = require('http');
var proxyAddr = require('proxy-addr');
var uniqueId = require('unique-id');

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
        //  TODO tests for this stuff
        var requestId = getRequestId(req);
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
            var code = res.statusCode;
            var type;

            switch (true) {

                case code >= 500:
                    //  Server errors
                    type = 'error';
                    break;

                case code >= 400:
                    //  Client errors
                    type = 'warn';
                    break;

                case code >= 300:
                    //  Redirects
                    type = 'log';
                    break;

                default:
                    //  Usual cases
                    type = 'info';
                    break;
            }

            logger[type]('%d %s (%dms)', code, STATUS_CODES[code], new Date() - dExecStart);
        });

        self.handle(req, res, logger);
    };
};

/**
 * Creates express middleware
 *
 * @public
 * @memberOf {Server}
 * @method
 *
 * @param {String} unit
 *
 * @returns {Function}
 * */
Server.prototype.express = function (unit) {
    var self = this;

    return function (req, res, next) {
        var track = req._fistTrack;

        if (!track) {
            track = req._fistTrack = new Connect(self, self.logger.bind(getRequestId(req)), req, res);
            track.params = req.params;
        }

        self.ready().then(function () {
            self.callUnit(track, unit, null, next);
        }, next);
    };
};

/**
 * @public
 * @memberOf {Server}
 * @method
 * */
Server.prototype.handle = function (req, res, logger) {
    var promise = this.ready();

    //  -1 possible tick
    if (promise.isFulfilled()) {
        this._runTrack(req, res, logger);
        return;
    }

    //  wait for init
    promise.done(function () {
        this._runTrack(req, res, logger);
    }, this);
};

/**
 * @protected
 * @memberOf {Server}
 * @method
 * */
Server.prototype._runTrack = function (req, res, logger) {
    var matches;
    var path = req.url;
    var router = this.router;
    var verb = req.method;

    if (!router.isImplemented(verb)) {
        logger.warn('There is no %s handlers', verb);
        res.statusCode = 501;
        res.end(STATUS_CODES[501]);
        return;
    }

    matches = router.matchAll(verb, path);

    if (matches.length) {
        this._nextRun(new Connect(this, logger, req, res), matches, 0);
        return;
    }

    matches = router.matchVerbs(path);

    if (matches.length) {
        logger.warn('The method %s is not allowed for resource %s', verb, path);
        res.statusCode = 405;
        res.setHeader('Allow', matches.join(', '));
        res.end(STATUS_CODES[405]);
    } else {
        logger.warn('There is no matching route');
        res.statusCode = 404;
        res.end(STATUS_CODES[404]);
    }
};

/**
 * @private
 * @memberOf {Connect}
 * @method
 * */
Server.prototype._nextRun = function (track, matches, pos) {
    var match;
    var self = this;

    if (pos === matches.length) {
        track.logger.warn('No one controller did responded');
        track.status(404).send();
        return;
    }

    match = matches[pos];
    track.params = match.args;
    track.route = match.data.name;
    track.logger.note('Match "%(data.name)s" route, running controller %(data.unit)s(%(args)j)', match);

    /** @this {Server} */
    this.callUnit(track, match.data.unit, null, function (err) {
        if (track.res.headersSent) {
            return;
        }

        if (arguments.length < 2) {
            track.status(500).send(err);
            return;
        }

        track.logger.note('The "%(data.unit)s" controller did not responded', match);

        self._nextRun(track, matches, pos + 1);
    });
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

function getRequestId(req) {
    return req.id || req.headers['x-request-id'] || uniqueId();
}

module.exports = Server;
