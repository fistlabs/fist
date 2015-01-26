'use strict';

var Core = /** @type Server */ require('./core');
var Connect = /** @type Connect */ require('./connect');
var FistError = /** @type FistError */ require('./fist-error');
var Router = /** @type Router */ require('finger/core/router');

var _ = require('lodash-node');
var f = require('util').format;
var http = require('http');

var proxyAddr = require('proxy-addr');
var uniqueId = require('unique-id');

var STATUS_CODES = http.STATUS_CODES;

/**
 * @class Server
 * @extends Core
 * */
function Server(params) {
    Core.call(this, params);

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
        var logger;

        //  TODO write tests for this stuff
        if (!req.id) {
            req.id = req.headers['x-request-id'] || uniqueId();
        }

        logger = self.logger.bind(req.id);

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
            logger.info('%d %s (%dms)', code, STATUS_CODES[code], new Date() - dExecStart);
        });

        self.handle(req, res, logger);
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
    promise.then(function () {
        this._runTrack(req, res, logger);
    }, this);
};

/**
 * @protected
 * @memberOf {Server}
 * @method
 *
 * @param {*} [params]
 *
 * @returns {Object}
 * */
Server.prototype._createParams = function (params) {
    params = _.extend({
        trustProxy: 'loopback'
    }, params);

    params = Core.prototype._createParams.call(this, params);

    params.trustProxy = proxyAddr.compile(params.trustProxy);

    return params;
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
    var track;

    if (!router.isImplemented(verb)) {
        res.statusCode = 501;
        res.end(STATUS_CODES[501]);
        return;
    }

    matches = router.matchAll(path, verb);

    if (matches.length) {
        track = new Connect(this, logger, req, res);
        track.id = req.id;
        track.matches = matches;
        track.routeIndex = 0;
        res.on('close', function () {
            track._isFlushed = true;
        });
        this._nextRun(track);
        return;
    }

    matches = router.matchVerbs(path);

    if (matches.length) {
        res.statusCode = 405;
        res.setHeader('Allow', matches.join(', '));
        res.end(STATUS_CODES[405]);
    } else {
        res.statusCode = 404;
        res.end(STATUS_CODES[404]);
    }
};

/**
 * @private
 * @memberOf {Connect}
 * @method
 * */
Server.prototype._nextRun = function (track) {
    var match;

    if (track.routeIndex === track.matches.length) {
        track.logger.debug('No one controller did responded');
        track.status(404).send();
        return;
    }

    match = track.matches[track.routeIndex];
    track.params = match.args;
    track.route = match.data.name;
    track.logger.debug('Match "%(data.name)s" route, running controller %(data.unit)s(%(args)j)', match);

    this.getUnit(match.data.unit).run(track, null, onControllerRun);
};

/**
 * @this {Runtime}
 * */
function onControllerRun() {
    if (this.track.wasSent()) {
        return;
    }

    if (this.isRejected()) {
        this.track.status(500).send();
        return;
    }

    this.track.routeIndex += 1;
    this.app._nextRun(this.track);
}

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

/**
 * @protected
 * @memberOf {Server}
 * @method
 *
 * @returns {vow.Promise}
 * */
Server.prototype._getReady = function () {
    return Core.prototype._getReady.call(this).then(function () {
        _.forEach(this.router.rules, function (rule) {
            var controller = this.getUnit(rule.data.unit);
            if (controller instanceof this.Unit) {
                return;
            }
            throw new FistError(FistError.NO_SUCH_UNIT,
                f('There is no controller %j for route %j', rule.data.unit, rule.data.name));
        }, this);
    }, this);
};

module.exports = Server;
