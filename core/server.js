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
 * Creates incoming request handler
 *
 * @public
 * @memberOf {Server}
 * @method
 *
 * @returns {Function}
 * */
Server.prototype.getHandler = function () {
    function $Server$requestHandler(req, res) {
        var dExecStart = new Date();
        var logger;

        //  TODO write tests for this stuff
        if (!req.id) {
            req.id = req.headers['x-request-id'] || uniqueId();
        }

        logger = this.logger.bind(req.id);

        logger.info('Incoming %(method)s %(url)s %s', function () {
            return _.reduce(req.headers, addHeaderString, '');
        }, req);

        res.on('finish', function () {
            var code = res.statusCode;
            logger.info('%d %s (%dms)', code, STATUS_CODES[code], new Date() - dExecStart);
        });

        $Server$handleRequest(this, req, res, logger);
    }

    return _.bind($Server$requestHandler, this);
};

/**
 * Starts listening
 *
 * @public
 * @memberOf {Server}
 * @method
 *
 * @returns {http.Server}
 * */
Server.prototype.listen = function () {
    var server = http.createServer(this.getHandler());

    //  Asynchronous run initialization
    this.ready().done();

    return server.listen.apply(server, arguments);
};

/**
 * Defines a route
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
 *
 * @returns {Promise}
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

function addHeaderString(logString, value, name) {
    return logString + '\n\t' + name + ': ' + value;
}

function $Server$handleRequest(self, req, res, logger) {
    var promise = self.ready();

    //  -1 possible tick
    if (promise.isFulfilled()) {
        $Server$runTrack(self, req, res, logger);
        return;
    }

    //  wait for init
    promise.done(function () {
        $Server$runTrack(self, req, res, logger);
    });
}

function $Server$runTrack(self, req, res, logger) {
    var matches;
    var method = req.method;
    var path = req.url = req.url.replace(/^\w+:\/\/[^\/]+/, '') || '/';
    var router = self.router;
    var track;

    if (!router.isImplemented(method)) {
        res.statusCode = 501;
        res.end(STATUS_CODES[501]);
        return;
    }

    matches = router.matchAll(path, method);

    if (matches.length) {
        track = new Connect(self, logger, req, res);
        track.id = req.id;
        track.matches = matches;
        track.routeIndex = 0;
        res.on('close', function () {
            track._isFlushed = true;
        });
        $Server$nextRun(self, track);
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
}

function $Server$nextRun(self, track) {
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

    self.getUnit(match.data.unit).run(track, null, $Server$onControllerDone);
}

function $Server$onControllerDone() {
    if (this.track.wasSent()) {
        return;
    }

    if (this.isRejected()) {
        this.track.status(500).send();
        return;
    }

    this.track.routeIndex += 1;

    $Server$nextRun(this.unit.app, this.track);
}

module.exports = Server;
