'use strict';

var R_COMMA = /\s*,\s*/;
var REDIRECT_STATUS = [300, 301, 302, 303, 305, 307];
var STATUS_CODES = require('http').STATUS_CODES;

var BodyParser = /** @type BodyParser */ require('../util/BodyParser');
var ContentType = /** @type ContentType */ require('../util/ContentType');
var Cookie = /** @type Cookie */ require('../util/Cookie');
var Next = /** @type Next */ require('fist.util.next/Next');
var Raw = /** @type Raw */ require('../parser/Raw');
var Track = /** @type Track */ require('./Track');
var Url = require('url');

var _ = /** @type _ */ require('lodash');
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
         * @property {*}
         * */
        this.match = null;

        /**
         * @public
         * @memberOf {Connect}
         * @property {String}
         * */
        this.method = req.method;

        /**
         * @public
         * @memberOf {Connect}
         * @property {String}
         * */
        this.route = null;

        /**
         * @public
         * @memberOf {Connect}
         * @property {Object}
         * */
        this.url = Connect.url(req);

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
     * @param {Function} done
     * */
    body: function (done) {

        var body;
        var params;

        if ( !(this._body instanceof Next) ) {
            params = _.extend(this.mime().toParams(),
                //  в глобальных опциях body можно определить настройки,
                // которые будут ограничивать параметры запроса
                this.agent.params.body, {
                    //  кроме этого!
                    // По наличию этого параметра определяется в принципе
                    // есть ли body у запроса причем оно
                    // должно всегда соответствовать реально длине тела
                    length: this.header('Content-Length')
                });

            body = this._body = new Next();

            this._createBodyParser(params).parse(this._req, function () {
                body.args(arguments);
            });
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
     * @public
     * @memberOf {Connect}
     * @method
     *
     * @param {String} name
     * @param {Object} [params]
     * */
    goToPath: function (name, params) {

        this.redirect(this.buildPath(name, params));
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
     * @public
     * @memberOf {Connect}
     * @method
     *
     * @param {String} [mime]
     * @param {Object} [params]
     *
     * @returns {ContentType|void}
     * */
    mime: function (mime, params) {

        //  getter
        if ( 0 === arguments.length ) {

            if ( !this._reqMime ) {
                this._reqMime = new ContentType(this.header('Content-Type'));
            }

            return this._reqMime;
        }

        //  setter
        this.header('Content-Type', ContentType.create(mime, params));
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

            if ( -1 === REDIRECT_STATUS.indexOf(code) ) {
                code = 302;
            }

        } else {
            url = code;
            code = 302;
        }

        this.header('Location', url);

        url = _.escape(url);

        //  TODO смотреть на Accept!
        if ( 'text/html' === new ContentType(this._res.
            getHeader('Content-Type')).value ) {

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
     * @param {*} [params]
     *
     * @returns {BodyParser}
     * */
    _createBodyParser: function (params) {

        return new BodyParser(params);
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

        var self = this;

        if ( this._res.getHeader('Content-Length') ) {
            this._setHead('Content-Type', 'application/octet-stream', true);

            body.on('error', function (err) {
                self._res.removeHeader('Content-Type');
                self._respond(500, err);
            });

            body.pipe(this._res);

            return;
        }

        new Raw().parse(body, function (err, body) {

            if ( 2 > arguments.length ) {
                self._respond(500, err);

                return;
            }

            self._setHead('Content-Type', 'application/octet-stream', true);
            self._setHead('Content-Length', body.length, true);

            self._res.end(body);
        });
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
     * @method
     *
     * @returns {String}
     * */
    host: function (req) {

        var headers = req.headers;
        var host = headers['x-forwarded-host'] || headers.host;

        if ( 'string' === typeof host ) {

            return host.split(R_COMMA)[0];
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

            return proto.split(R_COMMA)[0];
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
