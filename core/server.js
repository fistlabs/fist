'use strict';

var Core = /** @type Server */ require('./core');
var Connect = /** @type Connect */ require('./connect');
var FistError = /** @type FistError */ require('./fist-error');
var Router = /** @type Router */ require('finger');

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
        var track;

        //  TODO write tests for this stuff
        if (!req.id) {
            req.id = req.headers['x-request-id'] || uniqueId();
        }

        track = new Connect(this, this.logger.bind(req.id), req, res);

        track.logger.info('Incoming %(method)s %(url)s %s', function () {
            return _.reduce(req.headers, addHeaderString, '');
        }, req);

        res.on('finish', function () {
            var code = res.statusCode;
            track.logger.info('%d %s (%dms)', code, STATUS_CODES[code], new Date() - dExecStart);
        });

        $Server$handleRequest(this, track);
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

function $Server$handleRequest(self, track) {
    var promise = self.ready();

    //  -1 possible tick
    if (promise.isFulfilled()) {
        $Server$runTrack(self, track);
        return;
    }

    //  wait for init
    promise.done(function () {
        $Server$runTrack(self, track);
    });
}

function $Server$runTrack(self, track) {
    var matches;
    var method = track.req.method;
    var path = track.req.url = track.req.url.replace(/^\w+:\/\/[^\/]+\/?/, '/');
    var router = self.router;
    var allowedRules = router.getAllowedRules(method);

    if (!allowedRules.length) {
        track.status(501).send();
        return;
    }

    matches = track.matches = router.findMatchesFor(path, allowedRules);

    if (matches.length) {
        $Server$nextRun(self, track);
        return;
    }

    matches = router.findVerbs(path);

    if (matches.length) {
        track.status(405).header('Allow', matches.join(', ')).send();
    } else {
        track.status(404).send();
    }
}

function $Server$nextRun(self, track) {
    var index = track.routeIndex + 1;
    var match;
    var matches = track.matches;

    if (index === matches.length) {
        track.logger.debug('No one controller did responded');
        track.status(404).send();
        return;
    }

    match = matches[index];
    track.params = match.args;
    track.route = match.data.name;
    track.routeIndex = index;
    track.logger.debug('Match %(data.name)j route, running controller %(data.unit)s(%(args)j)', match);

    self.getUnit(match.data.unit).run(track, null, $Server$onControllerDone);
}

function $Server$onControllerDone(runtime) {
    if (runtime.track.wasSent()) {
        return;
    }

    if (runtime.isRejected()) {
        runtime.track.status(500).send();
        return;
    }

    $Server$nextRun(runtime.unit.app, runtime.track);
}

module.exports = Server;
