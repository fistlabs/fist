'use strict';
var STATUS_CODES = require('http').STATUS_CODES;

var Track = /** @type Track */ require('./track');

var cookieparser = require('cookieparser');
var hasProperty = Object.prototype.hasOwnProperty;
var urlParse = require('url').parse;
var vow = require('vow');
var proxyAddr = require('proxy-addr');

/**
 * @class Connect
 * @extends Track
 *
 * @param {Server} agent
 * @param {IncomingMessage} incoming
 * @param {ServerResponse} outgoing
 * */
function Connect(agent, incoming, outgoing) {
    var self = this;

    Track.call(this, agent);

    outgoing.on('close', function () {
        self._isFlushed = true;
    });

    outgoing.on('finish', function () {
        self._isFlushed = true;
    });

    /**
     * @public
     * @memberOf {Connect}
     * @property
     * @type {IncomingMessage}
     * */
    this.incoming = incoming;

    /**
     * @public
     * @memberOf {Connect}
     * @property
     * @type {ServerResponse}
     * */
    this.outgoing = outgoing;

    /**
     * @public
     * @memberOf {Connect}
     * @property
     * @type {String}
     * */
    this.route = null;

    this._setUrl(incoming.url);
}

Connect.prototype = Object.create(Track.prototype);

/**
 * @public
 * @memberOf {Connect}
 * @method
 *
 * @constructs
 * */
Connect.prototype.constructor = Connect;

/**
 * @public
 * @memberOf {Connect}
 * @method
 *
 * @returns {Boolean}
 * */
Connect.prototype.isFlushed = function () {
    return Track.prototype.isFlushed.call(this) || this.outgoing.headersSent;
};

/**
 * @public
 * @memberOf {Connect}
 * @method
 *
 * @returns {vow.Promise}
 * */
Connect.prototype.run = function () {
    var matches = this._matches;
    var outgoing = this.outgoing;

    if (!matches) {
        this.logger.warn('There is no %(incoming.method)s handlers', this);
        outgoing.statusCode = 501;
        this._sendUndefined();
        return vow.resolve();
    }

    if (!matches.length) {
        matches = this._agent.router.matchVerbs(this.url.path);
        if (matches.length) {
            this.logger.warn('The method %(incoming.method)s is not allowed for resource %(url.path)s', this);
            outgoing.statusCode = 405;
            outgoing.setHeader('Allow', matches.join(', '));
            this._sendUndefined();
            return vow.resolve();
        }
    }

    return this.next();
};

/**
 * @private
 * @memberOf {Connect}
 * @method
 *
 * @returns {vow.Promise}
 * */
Connect.prototype.next = function () {
    var match = this._matches.shift();
    var outgoing = this.outgoing;
    var self = this;

    if (!match) {
        this.logger.warn('There is no matching route');
        outgoing.statusCode = 404;
        this._sendUndefined();
        return vow.resolve();
    }

    this.params = match.args;
    this.route = match.data.name;
    this.logger.note('Match "%(data.name)s" route ~ %(args)j', match);

    return this.eject(match.data.unit).
        then(function () {
            if (!outgoing.headersSent) {
                return self.next();
            }

            return void 0;
        }, function (err) {
            if (!outgoing.headersSent) {
                outgoing.statusCode = 500;
                self.send(err);
            }
        });
};

/**
 * @public
 * @memberOf {Connect}
 * @method
 *
 * @param {Number} [statusCode]
 *
 * @returns {Number|Connect}
 * */
Connect.prototype.status = function (statusCode) {
    if (!arguments.length) {
        return this.outgoing.statusCode;
    }

    this.outgoing.statusCode = statusCode;

    return this;
};

/**
 * Читает заголовок запроса или ставит заголовок ответа
 *
 * @public
 * @memberOf {Connect}
 * @method
 *
 * @param {String} [name]
 * @param {*} [value]
 *
 * @returns {*}
 * */
Connect.prototype.header = function (name, value) {
    var incoming = this.incoming;
    var outgoing = this.outgoing;

    if (!arguments.length) {
        return incoming.headers;
    }

    if (name && typeof name === 'object') {
        value = name;

        for (name in value) {
            if (hasProperty.call(value, name)) {
                outgoing.setHeader(name, value[name]);
            }
        }

        return this;
    }

    if (arguments.length === 1) {
        return incoming.headers[String(name).toLowerCase()];
    }

    outgoing.setHeader(name, value);

    return this;
};

/**
 * @public
 * @memberOf {Connect}
 * @method
 *
 * @param {String} [name]
 * @param {String} [value]
 * @param {Object} [opts]
 * */
Connect.prototype.cookie = function (name, value, opts) {
    var outgoing = this.outgoing;
    var setCookie;
    var l = arguments.length;

    if (!l) {
        return this._getCookies();
    }

    if (l === 1) {
        return this._getCookies()[name];
    }

    setCookie = outgoing.getHeader('Set-Cookie');
    value = cookieparser.serialize(name, value, opts);

    if (!setCookie) {
        outgoing.setHeader('Set-Cookie', value);
    } else if (!Array.isArray(setCookie)) {
        outgoing.setHeader('Set-Cookie', [setCookie, value]);
    } else {
        setCookie[setCookie.length] = value;
    }

    return this;
};

/**
 * @public
 * @memberOf {Connect}
 * @method
 *
 * @param {*} data
 * */
Connect.prototype.send = function (data) {
    if (data === void 0) {
        return this._sendUndefined();
    }

    if (typeof data === 'string') {
        return this._sendString(data);
    }

    if (Buffer.isBuffer(data)) {
        return this._sendBuffer(data);
    }

    if (data && typeof data === 'object' && typeof data.pipe === 'function') {
        return this._sendReadable(data);
    }

    if (data instanceof Error) {
        return this._sendError(data);
    }

    return this._sendJSON(data);
};

/**
 * @protected
 * @memberOf {Connect}
 * @method
 *
 * @returns {Object}
 * */
Connect.prototype._getCookies = function () {
    if (!this.__cookies) {
        this.__cookies = cookieparser.parse(this.incoming.headers.cookie || '');
    }

    return this.__cookies;
};

/**
 * @protected
 * @memberOf {Connect}
 * @method
 */
Connect.prototype._sendUndefined = function () {
    return this._sendString(STATUS_CODES[this.outgoing.statusCode]);
};

/**
 * @protected
 * @memberOf {Connect}
 * @method
 *
 * @param {String} data
 */
Connect.prototype._sendString = function (data) {
    var outgoing = this.outgoing;

    if (!outgoing.getHeader('Content-Type')) {
        outgoing.setHeader('Content-Type', 'text/plain');
    }

    outgoing.removeHeader('Content-Length');
    outgoing.setHeader('Content-Length', Buffer.byteLength(data));

    outgoing.end(data);
};

/**
 * @protected
 * @memberOf {Connect}
 * @method
 *
 * @param {Buffer} data
 */
Connect.prototype._sendBuffer = function (data) {
    var outgoing = this.outgoing;

    if (!outgoing.getHeader('Content-Type')) {
        outgoing.setHeader('Content-Type', 'application/octet-stream');
    }

    outgoing.removeHeader('Content-Length');
    outgoing.setHeader('Content-Length', data.length);

    outgoing.end(data);
};

/**
 * @protected
 * @memberOf {Connect}
 * @method
 *
 * @param {Stream.Readable} data
 */
Connect.prototype._sendReadable = function (data) {
    var outgoing = this.outgoing;

    if (!outgoing.getHeader('Content-Type')) {
        outgoing.setHeader('Content-Type', 'application/octet-stream');
    }

    data.pipe(outgoing);
};

/**
 * @protected
 * @memberOf {Connect}
 * @method
 *
 * @param {Error} data
 */
Connect.prototype._sendError = function (data) {
    if (typeof data.stack === 'string') {
        return this._sendString(data.stack);
    }

    return this._sendString(String(data));
};

/**
 * @protected
 * @memberOf {Connect}
 * @method
 *
 * @param {*} data
 */
Connect.prototype._sendJSON = function (data) {
    var outgoing = this.outgoing;

    data = JSON.stringify(data);

    if (!outgoing.getHeader('Content-Type')) {
        outgoing.setHeader('Content-Type', 'application/json');
    }

    outgoing.removeHeader('Content-Length');
    outgoing.setHeader('Content-Length', Buffer.byteLength(data));

    outgoing.end(data);
};

/**
 * @public
 * @memberOf {Connect}
 * @method
 *
 * @returns {String}
 * */
Connect.prototype.getIp = function () {
    return proxyAddr(this.incoming, this._agent.params.trustProxy);
};

/**
 * @public
 * @memberOf {Connect}
 * @method
 *
 * @returns {String}
 * */
Connect.prototype.getIps = function () {
    return proxyAddr.all(this.incoming, this._agent.params.trustProxy);
};

/**
 * @public
 * @memberOf {Connect}
 * @method
 *
 * @returns {String}
 * */
Connect.prototype.getHost = function () {
    var incoming = this.incoming;
    var connection = incoming.connection;
    var headers = incoming.headers;
    var host = headers['x-forwarded-host'];

    if (!host || !this._agent.params.trustProxy(connection.remoteAddress)) {
        host = headers.host;
    }

    return host || 'localhost';
};

/**
 * @public
 * @memberOf {Connect}
 * @method
 *
 * @returns {String}
 * */
Connect.prototype.getHostname = function () {
    var host = this.getHost();

    if (host.charAt(0) === '[') {
        return (host.match(/\[([^\[\]]+)]/) || [0, host])[1];
    }

    return (host.match(/([^:]+)/) || [0, host])[1];
};

/**
 * @public
 * @memberOf {Connect}
 * @method
 *
 * @returns {String}
 * */
Connect.prototype.getProtocol = function () {
    var incoming = this.incoming;
    var connection = incoming.connection;
    var protocol = connection.encrypted ? 'https' : 'http';

    if (incoming.headers['x-forwarded-proto'] && this._agent.params.trustProxy(connection.remoteAddress)) {
        return incoming.headers['x-forwarded-proto'].split(/\s*,\s*/)[0];
    }

    return protocol;
};

/**
 * @private
 * @memberOf {Connect}
 * @method
 *
 * @param {String} url
 * */
Connect.prototype._setUrl = function (url) {
    this.params = {};

    /**
     * @public
     * @memberOf {Connect}
     * @property
     * @type {Object}
     * */
    this.url = urlParse(this.getProtocol() + '://' + this.getHost() + url, true);

    /**
     * @public
     * @memberOf {Connect}
     * @property
     * @type {Array<Object>}
     * */
    this._matches = null;

    if (this._agent.router.isImplemented(this.incoming.method)) {
        this._matches = this._agent.router.matchAll(this.incoming.method, url);
    }
};

module.exports = Connect;
