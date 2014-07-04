'use strict';

var REDIRECT_CODES = [300, 301, 302, 303, 305, 307];

var Req = /** @type Req */ require('../req/Req');
var Res = /** @type Res */ require('../res/Res');
var Track = /** @type Track */ require('./Track');

var _ = require('lodash-node');
var inherit = require('inherit');
var mediaTyper = require('media-typer');
var vow = require('vow');

/**
 * @class Connect
 * @extends Track
 * */
var Connect = inherit(Track, /** @lends Connect.prototype */ {

    /**
     * @private
     * @memberOf {Connect}
     * @method
     *
     * @constructs
     * */
    __constructor: function (agent, req, res) {
        this.__base(agent);

        /**
         * @public
         * @memberOf {Connect}
         * @property
         * @type {*}
         * */
        this.match = {};

        /**
         * @public
         * @memberOf {Connect}
         * @property
         * @type {String}
         * */
        this.method = req.method.toUpperCase();

        /**
         * @public
         * @memberOf {Connect}
         * @property
         * @type {Req}
         * */
        this.req = this._createReq(req, agent.params.req);

        /**
         * @public
         * @memberOf {Connect}
         * @property
         * @type {Res}
         * */
        this.res = this._createRes(res, agent.params.res);

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
         * @type {Object}
         * */
        this.url = this.req.getUrl();
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
     * @returns {vow.Promise}
     * */
    body: function (body) {

        if ( 0 === arguments.length ) {

            return this.req.getBody();
        }

        return this.send(body);
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

        return this.redirect(302, this.buildPath(name, params));
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

        if ( 0 === arguments.length ) {

            return this.req.getHeaders();
        }

        if ( _.isObject(name) ) {
            this.res.setHeaders(name, value);

            return this;
        }

        if ( 1 === arguments.length ) {

            return this.req.getHeader(name);
        }

        this.res.setHeader(name, value, soft);

        return this;
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

        if ( 0 === arguments.length ) {

            return this.req.getCookies();
        }

        if ( 1 === arguments.length ) {

            return this.req.getCookie(name);
        }

        this.res.setCookie(name, value, opts);

        return this;
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

        var mime;

        if ( _.isNumber(code) ) {

            if ( !_.contains(REDIRECT_CODES, code) ) {
                code = 302;
            }

        } else {
            url = code;
            code = 302;
        }

        this.res.setHeader('Location', url);

        mime = this.res.getHeader('Content-Type');

        //  TODO смотреть на Accept!
        if ( mime ) {
            mime = mediaTyper.parse(mime);

            if ( 'text' === mime.type && 'html' === mime.subtype ) {
                url = _.escape(url);
                url = '<a href="' + url + '">' + url + '</a>';
            }
        }

        this.res.respond(code, url);

        return this;
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

        if ( _.isNumber(code) ) {
            i = 2;

        } else {
            i = 1;
            id = code;
            code = this.res.getStatus();
        }

        args = _.rest(arguments, i);

        return this.res.respond(code,
            this.agent.renderers[id].apply(this, args));
    },

    /**
     * Выполняет ответ приложения
     *
     * @public
     * @memberOf {Connect}
     * @method
     * */
    send: function (status, body) {

        if ( !_.isNumber(status) ) {
            body = status;
            status = this.res.getStatus();
        }

        return this.res.respond(status, body);
    },

    /**
     * @protected
     * @memberOf {Connect}
     * @method
     *
     * @param {http.IncomingMessage} req
     * @param {Object} params
     *
     * @returns {Req}
     * */
    _createReq: function (req, params) {

        return new Req(req, params);
    },

    /**
     * @protected
     * @memberOf {Connect}
     * @method
     *
     * @param {http.OutgoingMessage} res
     * @param {Object} params
     *
     * @returns {Res}
     * */
    _createRes: function (res, params) {

        return new Res(res, params);
    }

});

module.exports = Connect;
