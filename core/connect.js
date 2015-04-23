'use strict';

var STATUS_CODES = require('http').STATUS_CODES;

var Track = /** @type Track */ require('./track');

var _ = require('lodash-node');
var accepts = require('accepts');
var cookieparser = require('cookieparser');
var libFastUrl = require('fast-url-parser');
var urlFastParse = libFastUrl.parse;
var urlFastFormat = libFastUrl.format;
var f = require('util').format;
var proxyAddr = require('proxy-addr');

/**
 * @class Connect
 * @extends Track
 *
 * @param {Server} app
 * @param {Logger} logger
 * @param {IncomingMessage} req
 * @param {ServerResponse} res
 * */
function Connect(app, logger, req, res) {

    /**
     * @public
     * @memberOf {Connect}
     * @property
     * @type {IncomingMessage}
     * */
    this.req = req;

    /**
     * @public
     * @memberOf {Connect}
     * @property
     * @type {ServerResponse}
     * */
    this.res = res;

    //  TODO give connect and track same signature
    Track.call(this, app, logger);

    /**
     * @public
     * @memberOf {Connect}
     * @property
     * @type {String}
     * */
    this.route = null;

    /**
     * @public
     * @memberOf {Connect}
     * @property
     * @type {Array<String>}
     * */
    this.matches = [];

    /**
     * @public
     * @memberOf {Connect}
     * @property
     * @type {Number}
     * */
    this.routeIndex = -1;

    /**
     * @private
     * @memberOf {Connect}
     * @property
     * @type {Object}
     * */
    this._url = null;
}

Connect.prototype = Object.create(Track.prototype);

/**
 * @public
 * @memberOf {Connect}
 * @getter
 * @type {Object}
 * */
Object.defineProperty(Connect.prototype, 'url', {
    get: function () {
        if (!this._url) {
            this._url = this._getUrlObj();
        }
        return this._url;
    }
});

/**
 * @public
 * @memberOf {Connect}
 * @method
 *
 * @constructs
 * */
Connect.prototype.constructor = Connect;

/**
 * @protected
 * @memberOf {Connect}
 * @method
 *
 * @returns {String}
 * */
Connect.prototype._createId = function () {
    return this.req.id;
};

/**
 * @public
 * @memberOf {Connect}
 * @method
 *
 * @returns {Boolean}
 * */
Connect.prototype.wasSent = function () {
    return this.res.headersSent || !this.req.socket.writable;
};

/**
 * @public
 * @memberOf {Connect}
 * @method
 *
 * @returns {Boolean}
 * */
Connect.prototype.isFlushed = function () {
    return Track.prototype.isFlushed.call(this) || this.wasSent();
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
        return this.res.statusCode;
    }

    this.res.statusCode = statusCode;

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
    var req = this.req;
    var res = this.res;

    if (!arguments.length) {
        return req.headers;
    }

    if (name && typeof name === 'object') {
        _.forOwn(name, function (v, k) {
            res.setHeader(k, v);
        });

        return this;
    }

    if (arguments.length === 1) {
        return req.headers[String(name).toLowerCase()];
    }

    res.setHeader(name, value);

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
    var res = this.res;
    var setCookie;
    var l = arguments.length;

    if (!l) {
        return this._getCookies();
    }

    if (l === 1) {
        return this._getCookies()[name];
    }

    setCookie = res.getHeader('Set-Cookie');
    value = cookieparser.serialize(name, value, opts);

    if (!setCookie) {
        res.setHeader('Set-Cookie', value);
    } else if (!Array.isArray(setCookie)) {
        res.setHeader('Set-Cookie', [setCookie, value]);
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
 * @param {String|Array<String>} types
 *
 * @returns {String}
 * */
Connect.prototype.acceptTypes = function (types) {
    return accepts(this.req).types(types);
};

/**
 * @public
 * @memberOf {Connect}
 * @method
 *
 * @param {String|Array<String>} encodings
 *
 * @returns {String}
 * */
Connect.prototype.acceptEncodings = function (encodings) {
    return accepts(this.req).encodings(encodings);
};

/**
 * @public
 * @memberOf {Connect}
 * @method
 *
 * @param {String|Array<String>} charsets
 *
 * @returns {String}
 * */
Connect.prototype.acceptCharsets = function (charsets) {
    return accepts(this.req).charsets(charsets);
};

/**
 * @public
 * @memberOf {Connect}
 * @method
 *
 * @param {String|Array<String>} languages
 *
 * @returns {String}
 * */
Connect.prototype.acceptLanguages = function (languages) {
    return accepts(this.req).languages(languages);
};

/**
 * @public
 * @memberOf {Connect}
 * @method
 *
 * @param {String} url
 * @param {Number} [status]
 * */
Connect.prototype.redirect = function (url, status) {
    var redirectUrl = urlFastParse(url, false, true);

    //   make URL absolute
    redirectUrl = urlFastFormat({
        // inherit protocol from incoming request if needed
        protocol: redirectUrl.protocol || this.url.protocol,
        // inherit host from incoming request if needed
        host: redirectUrl.host || this.url.host,
        // may be encoded while parsing
        pathname: decodeURIComponent(redirectUrl.pathname),
        search: redirectUrl.search,
        hash: redirectUrl.hash
    });

    this.res.statusCode = status || 302;
    this.res.setHeader('Location', redirectUrl);

    if (this.acceptTypes(['html'])) {
        redirectUrl = _.escape(redirectUrl);
        this.res.setHeader('Content-Type', 'text/html; charset=utf-8');
        this.res.end(f('<a href="%s">%s</a>', redirectUrl, redirectUrl));
    } else {
        this.res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        this.res.end(redirectUrl);
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
 * @public
 * @memberOf {Connect}
 * @method
 *
 * @returns {String}
 * */
Connect.prototype.getIp = function () {
    return proxyAddr(this.req, this._app.params.trustProxy);
};

/**
 * @public
 * @memberOf {Connect}
 * @method
 *
 * @returns {String}
 * */
Connect.prototype.getIps = function () {
    return proxyAddr.all(this.req, this._app.params.trustProxy);
};

/**
 * @public
 * @memberOf {Connect}
 * @method
 *
 * @returns {String}
 * */
Connect.prototype.getHost = function () {
    var host = this.req.headers['x-forwarded-host'];

    if (host && this._isAddressTrusted()) {
        return host;
    }

    return this.req.headers.host || 'localhost';
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
    var headers = this.req.headers;
    var protocol = this.req.connection.encrypted ? 'https' : 'http';

    if (headers['x-forwarded-proto'] && this._isAddressTrusted()) {
        return headers['x-forwarded-proto'].split(/\s*,\s*/)[0];
    }

    return protocol;
};

//  aliases
Connect.prototype.acceptEncoding = Connect.prototype.acceptEncodings;
Connect.prototype.acceptType = Connect.prototype.acceptTypes;
Connect.prototype.acceptCharset = Connect.prototype.acceptCharsets;
Connect.prototype.acceptLanguage = Connect.prototype.acceptLanguages;

/**
 * @public
 * @memberOf {Connect}
 * @method
 *
 * @returns {Boolean}
 * */
Connect.prototype._isAddressTrusted = function () {
    return this._app.params.trustProxy(this.req.connection.remoteAddress);
};

/**
 * @protected
 * @memberOf {Connect}
 * @method
 *
 * @returns {Object}
 * */
Connect.prototype._getUrlObj = function $Connect$getUrlObj() {
    return urlFastParse(this._getUrlHref(), true);
};

/**
 * @protected
 * @memberOf {Connect}
 * @method
 *
 * @returns {String}
 * */
Connect.prototype._getUrlHref = function $Connect$getUrlHref() {
    return this.getProtocol() + '://' + this.getHost() + this.req.url;
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
        this.__cookies = cookieparser.parse(this.req.headers.cookie || '');
    }

    return this.__cookies;
};

/**
 * @protected
 * @memberOf {Connect}
 * @method
 */
Connect.prototype._sendUndefined = function () {
    return this._sendString(STATUS_CODES[this.res.statusCode]);
};

/**
 * @protected
 * @memberOf {Connect}
 * @method
 *
 * @param {String} data
 */
Connect.prototype._sendString = function (data) {
    var res = this.res;

    if (!res.getHeader('Content-Type')) {
        res.setHeader('Content-Type', 'text/plain');
    }

    res.removeHeader('Content-Length');
    res.setHeader('Content-Length', Buffer.byteLength(data));

    res.end(data);
};

/**
 * @protected
 * @memberOf {Connect}
 * @method
 *
 * @param {Buffer} data
 */
Connect.prototype._sendBuffer = function (data) {
    var res = this.res;

    if (!res.getHeader('Content-Type')) {
        res.setHeader('Content-Type', 'application/octet-stream');
    }

    res.removeHeader('Content-Length');
    res.setHeader('Content-Length', data.length);

    res.end(data);
};

/**
 * @protected
 * @memberOf {Connect}
 * @method
 *
 * @param {Stream.Readable} data
 */
Connect.prototype._sendReadable = function (data) {
    var res = this.res;

    if (!res.getHeader('Content-Type')) {
        res.setHeader('Content-Type', 'application/octet-stream');
    }

    // force flushing
    this._isFlushed = true;

    data.pipe(res);
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
    var outgoing = this.res;

    data = JSON.stringify(data);

    if (!outgoing.getHeader('Content-Type')) {
        outgoing.setHeader('Content-Type', 'application/json');
    }

    outgoing.removeHeader('Content-Length');
    outgoing.setHeader('Content-Length', Buffer.byteLength(data));

    outgoing.end(data);
};

module.exports = Connect;
