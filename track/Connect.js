'use strict';

var NO_CONTENT = [204, 205, 304].reduce(function (NO_CONTENT, code) {
    NO_CONTENT[code] = true;

    return NO_CONTENT;
}, Object.create(null));

var REDIRECT_STATUS = [300, 301, 302,
    303, 305, 307].reduce(function (REDIRECT_STATUS, code) {
        REDIRECT_STATUS[code] = true;

        return REDIRECT_STATUS;
    }, Object.create(null));

var STATUS_CODES = require('http').STATUS_CODES;

var BodyParser = /** @type BodyParser */ require('../util/BodyParser');
var Cookie = /** @type Cookie */ require('../util/Cookie');
var Next = /** @type Next */ require('fist.util.next/Next');
var Raw = /** @type Raw */ require('../parser/Raw');
var Track = /** @type Track */ require('./Track');
var Url = require('url');

var _ = /** @type _ */ require('lodash');
var htmlEscape = require('../util/html/escape');
var uniqueId = require('fist.lang.id');

/**
 * @class Connect
 * @extends Track
 * */
var Connect = Track.extend(/** @lends Connect.prototype */ {

    /**
     * @protected
     * @memberOf {Connect}
     * @method
     *
     * @constructs
     * */
    constructor: function (agent, req, res) {
        Connect.Parent.call(this, agent);

        /**
         * @public
         * @memberOf {Connect}
         * @property {String}
         * */
        this.id = uniqueId();

        /**
         * @public
         * @memberOf {Connect}
         * @property {String}
         * */
        this.method = req.method;

        /**
         * @public
         * @memberOf {Connect}
         * @property {Object}
         * */
        this.url = Connect.url(req);

        /**
         * @public
         * @memberOf {Connect}
         * @property {*}
         * */
        this.match = null;

        /**
         * @public
         * @memberOf {Connect}
         * @property {String}
         * */
        this.route = null;

        /**
         * @protected
         * @memberOf {Connect}
         * @property {Object}
         * */
        this._req = req;

        /**
         * @protected
         * @memberOf {Connect}
         * @property {http.IncomingMessage}
         * */
        this._res = res;

        /**
         * Это нужно ради автоматического контроля
         * присутствия content-* заголовоков в 204, 205, 304 ответах
         *
         * @protected
         * @memberOf {Connect}
         * @property {Array}
         * */
        this._reshead = Object.create(null);
    },

    /**
     * Возвращает аргумент запроса из pathname или query
     *
     * @public
     * @memberOf {Connect}
     * @method
     *
     * @param {String} name
     * @param {Boolean} [only]
     *
     * @returns {String|void}
     * */
    arg: function (name, only) {

        var result = this.match[name];

        if ( only ) {

            return result;
        }

        return result || this.url.query[name];
    },

    /**
     * Возвращает body в разобранном виде
     *
     * @public
     * @memberOf {Connect}
     * @method
     *
     * @param {*} [params]
     * @param {Function} done
     * */
    body: function (params, done) {

        var opts;

        if ( 'function' === typeof params ) {
            done = params;
            params = null;
        }

        if ( !(this._body instanceof Next) ) {
            opts = _.extend({
                length: this._req.headers['content-length']
            }, params);

            this._body = new BodyParser(opts).parse(this._req);
        }

        this._body.done(done, this);
    },

    /**
     * Создает path по одному из маршрутов
     *
     * @public
     * @memberOf {Connect}
     * @method
     *
     * @param {String} name
     * @param {Object} [params]
     *
     * @returns {String}
     * */
    buildPath: function (name, params) {

        return this.agent.router.getRoute(name).build(params);
    },

    /**
     * Читает заголовок запроса или ставит заголовок ответа
     *
     * @public
     * @memberOf {Connect}
     * @method
     *
     * @param {String} [name]
     * @param {*} [value]
     * @param {Boolean} [soft] set only if not already set
     *
     * @returns {*}
     * */
    header: function (name, value, soft) {
        /*eslint consistent-return: 0*/
        if ( Object(name) === name  ) {
            soft = value;

            _.forOwn(name, function (value, name) {
                this._setHead(name, value, soft);
            }, this);

            return;
        }

        if ( 2 > arguments.length ) {

            if ( 0 === arguments.length ) {

                return this._req.headers;
            }

            return this._getHead(name);
        }

        this._setHead(name, value, soft);
    },

    /**
     * Читает куку или ставит ее
     *
     * @public
     * @memberOf {Connect}
     * @method
     *
     * @param {String} [name]
     * @param {String} [value]
     * @param {Object} [opts]
     * */
    cookie: function (name, value, opts) {

        var cookies;

        if ( 2 > arguments.length ) {

            if ( !this._cookies ) {
                this._cookies = Connect.cookie.parse(this._req.headers.cookie);
            }

            cookies = this._cookies;

            if ( 0 === arguments.length ) {

                return cookies;
            }

            return cookies[name] && decodeURIComponent(cookies[name]);
        }

        if ( null === value ) {
            value = '';

            if ( !opts ) {
                opts = {};
            }

            opts.expires = -1;
        }

        value = Connect.cookie.serialize(name, encodeURIComponent(value), opts);

        return this._setHead('Set-Cookie', value);
    },

    /**
     * Шортхэнд для редиректов
     *
     * @public
     * @memberOf {Connect}
     * @method
     *
     * @param {*} [code]
     * @param {String} url
     * */
    redirect: function (code, url) {

        if ( 'number' === typeof code ) {

            if ( !REDIRECT_STATUS[code] ) {
                code = 302;
            }

        } else {
            url = code;
            code = 302;
        }

        this.header('Location', url);

        url = htmlEscape(url);

        if ( /text\/html/.test( this._res.getHeader('Content-Type') ) ) {
            url = '<a href="' + url + '">' + url + '</a>';
        }

        this.send(code, url);
    },

    /**
     * Выполняет шаблонизацию переданных данных и
     * выполняет ответ приложения
     *
     * @public
     * @memberOf {Connect}
     * @method
     *
     * @param {*} [code]
     * @param {String} id
     * @param {*} [arg...]
     * */
    render: function (code, id, arg) {
        /*eslint no-unused-vars: 0*/
        var args;
        var i;

        if ( 'number' === typeof code ) {
            i = 2;
            this.status(code);

        } else {
            i = 1;
            id = code;
        }

        args = Array.prototype.slice.call(arguments, i);
        this.send(this.agent.renderers[id].apply(this, args));
    },

    /**
     * Выполняет ответ приложения
     *
     * @public
     * @memberOf {Connect}
     * @method
     * */
    send: function () {
        this.send = Connect.noop;
        this._respond.apply(this, arguments);
    },

    /**
     * Проверяет, был ли выполнен ответ приложением
     *
     * @public
     * @memberOf {Connect}
     * @method
     *
     * @returns {Boolean}
     * */
    sent: function () {

        return this.send === Connect.noop;
    },

    /**
     * Ставит статус ответа или возыращает его
     *
     * @public
     * @memberOf {Connect}
     * @method
     *
     * @param {Number} [statusCode]
     *
     * @returns {Number}
     * */
    status: function (statusCode) {

        if ( 0 === arguments.length ) {

            return this._res.statusCode;
        }

        this._res.statusCode = statusCode;

        return statusCode;
    },

    /**
     * @protected
     * @memberOf {Connect}
     * @method
     *
     * @param {String} name
     * @param {*} value
     * @param {Boolean} [soft]
     * */
    _setHead: function (name, value, soft) {
        name = String(name).toLowerCase();

        this._reshead[name] = true;

        if ( soft && this._res.getHeader(name) ) {

            return;
        }

        if ( 'set-cookie' === name ) {
            value = (this._res.getHeader(name) || []).concat(value);
            this._res.setHeader(name, value);

            return;
        }

        this._res.setHeader(name, value);
    },

    /**
     * @protected
     * @memberOf {Connect}
     * @method
     *
     * @param {String} name
     *
     * @returns {String}
     * */
    _getHead: function (name) {

        return this._req.headers[ String(name).toLowerCase() ];
    },

    /**
     * @protected
     * @memberOf {Connect}
     * @method
     *
     * @param {*} [status]
     * @param {*} [body]
     * */
    _respond: function (status, body) {

        if ( 'number' === typeof status && STATUS_CODES[status] ) {
            this._res.statusCode = status;

            if ( 2 > arguments.length ) {
                body = STATUS_CODES[status];
            }

        } else {
            body = status;
        }

        if ( void 0 === body ) {
            body = STATUS_CODES[this._res.statusCode];
        }

        this._writeBody(body);
    },

    /**
     * @protected
     * @memberOf {Connect}
     * @method
     *
     * @param {*} [body]
     * */
    _writeBody: function (body) {

        var name;

        if ( NO_CONTENT[this._res.statusCode] ) {

            for ( name in this._reshead ) {

                if ( 0 === name.indexOf('content-') ) {
                    this._res.removeHeader(name);
                }
            }

            this._res.end();

            return;
        }

        if ( 'string' === typeof body ) {
            this._writeString(body);

            return;
        }

        if ( Buffer.isBuffer(body) ) {
            this._writeBuffer(body);

            return;
        }

        if ( Object(body) === body && 'function' === typeof body.pipe ) {
            this._writeReadable(body);

            return;
        }

        if ( body instanceof Error ) {
            this._writeError(body);

            return;
        }

        this._writeJson(body);
    },

    /**
     * @protected
     * @memberOf {Connect}
     * @method
     *
     * @param {Error} body
     * */
    _writeError: function (body) {

        if ( this._res.statusCode >= 500 ) {

            if ( this.agent.params.staging ) {
                this._writeString(STATUS_CODES[this._res.statusCode]);

                return;
            }

            this._writeString(body.stack);

            return;
        }

        this._writeJson(body);
    },

    /**
     * @protected
     * @memberOf {Connect}
     * @method
     *
     * @param {String} body
     * */
    _writeString: function (body) {
        this._setHead('Content-Type', 'text/plain', true);
        this._setHead('Content-Length', Buffer.byteLength(body), true);

        if ( 'HEAD' === this.method ) {
            this._res.end();

            return;
        }

        this._res.end(body);
    },

    /**
     * @protected
     * @memberOf {Connect}
     * @method
     *
     * @param {Buffer} body
     * */
    _writeBuffer: function (body) {
        this._setHead('Content-Type', 'application/octet-stream', true);
        this._setHead('Content-Length', body.length, true);

        if ( 'HEAD' === this.method ) {
            this._res.end();

            return;
        }

        this._res.end(body);
    },

    /**
     * @protected
     * @memberOf {Connect}
     * @method
     *
     * @param {*} body
     * */
    _writeJson: function (body) {
        body = JSON.stringify(body);

        this._setHead('Content-Type', 'application/json', true);
        this._setHead('Content-Length', Buffer.byteLength(body), true);

        if ( 'HEAD' === this.method ) {
            this._res.end();

            return;
        }

        this._res.end(body);
    },

    /**
     * @protected
     * @memberOf {Connect}
     * @method
     *
     * @param {*} body
     * */
    _writeReadable: function (body) {

        if ( 'HEAD' === this.method ) {
            new Raw().parse(body).done(function (err, body) {

                if ( 2 > arguments.length ) {
                    this._respond(500, err);

                    return;
                }

                this._setHead('Content-Type', 'application/octet-stream', true);
                this._setHead('Content-Length', body.length, true);

                this._res.end();
            }, this);

            return;
        }

        if ( this._res.getHeader('content-length') ) {
            this._setHead('Content-Type', 'application/octet-stream', true);

            body.on('error', this._respond.bind(this, 500));
            body.pipe(this._res);

            return;
        }

        new Raw().parse(body).done(function (err, body) {

            if ( 2 > arguments.length ) {
                this._respond(500, err);

                return;
            }

            this._setHead('Content-Type', 'application/octet-stream', true);
            this._setHead('Content-Length', body.length, true);

            this._res.end(body);

        }, this);
    }

}, {

    /**
     * @public
     * @static
     * @memberOf Connect
     *
     * @property {Cookie}
     * */
    cookie: new Cookie(),

    /**
     * @public
     * @static
     * @memberOf Connect
     * @method
     * */
    noop: function () {},

    /**
     * @public
     * @static
     * @memberOf Connect
     * @property {RegExp}
     * */
    R_COMMA: /\s*,\s*/,

    /**
     * @public
     * @static
     * @memberOf Connect
     * @method
     *
     * @returns {String}
     * */
    host: function (req) {

        var headers = req.headers;
        var host = headers['x-forwarded-host'] || headers.host;

        if ( 'string' === typeof host ) {

            return host.split(Connect.R_COMMA)[0];
        }

        return host;
    },

    /**
     * @public
     * @static
     * @memberOf Connect
     * @method
     *
     * @returns {String}
     * */
    proto: function (req) {

        var proto;

        if ( req.socket.encrypted ) {

            return 'https';
        }

        proto = req.headers['x-forwarded-proto'];

        if ( 'string' === typeof proto ) {

            return proto.split(Connect.R_COMMA)[0];
        }

        return 'http';
    },

    /**
     * @public
     * @static
     * @memberOf Connect
     * @method
     *
     * @returns {String}
     * */
    href: function (req) {

        var url = Url.parse(req.url);

        url.host = Connect.host(req);
        url.protocol = Connect.proto(req);

        return Url.format(url);
    },

    /**
     * @public
     * @static
     * @memberOf Connect
     * @method
     *
     * @returns {Object}
     * */
    url: function (req) {

        return Url.parse(Connect.href(req), true);
    }

});

module.exports = Connect;
