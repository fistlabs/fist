'use strict';

var REDIRECT_CODES = [300, 301, 302, 303, 305, 307];
var R_URL = /^((?:[a-z0-9.+-]+:|)\/\/[^\/]+|)([\s\S]*)$/;

var Negotiator = /** @type Negotiator */ require('negotiator');
var Request = /** @type Request */ require('./request');
var Response = /** @type Response */ require('./response');
var Rewrite = /** @type Rewrite */ require('../skip/rewrite');
var Route = /** @type Route */ require('finger/route/Route');
var Track = /** @type Track */ require('./track');

var _ = require('lodash-node');
var inherit = require('inherit');
var vow = require('vow');
var hyperLinkTpl = _.template('<a href="\<%= href %\>">\<%= href %\></a>');

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
     *
     * @param {Agent} agent
     * @param {IncomingMessage} req
     * @param {OutgoingMessage} res
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
         * @type {Negotiator}
         * */
        this.neg = new Negotiator(req);

        /**
         * @public
         * @memberOf {Connect}
         * @property
         * @type {Request}
         * */
        this.req = this._createReq(req, agent.params.req);

        /**
         * @public
         * @memberOf {Connect}
         * @property
         * @type {Response}
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
        this.url = this.req.createUrl(req.url);
    },

    /**
     * @deprecated
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
    arg: /*istanbul ignore next */ function (name, only) {
        this.agent.channel('sys.migration').
            emit('deprecated', [
                'track.arg(name, only)',
                'ctx.arg(name)'
            ]);

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
    body: function () {

        return this.req.getBody();
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
     * is it useful?
     *
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
     * @param {*} [status]
     * @param {String} url
     * @param {Object} [opts]
     * */
    redirect: function (status, url, opts) {
        var parts;

        if ( _.isNumber(status) ) {

            if ( !_.contains(REDIRECT_CODES, status) ) {
                status = 302;
            }

        } else {
            opts = url;
            url = status;
            status = 302;
        }

        parts = R_URL.exec(url);
        parts[2] = Route.buildPath(parts[2], opts);
        url = parts[1] + parts[2];

        this.res.setHeader('Location', url);

        if ( this.neg.mediaTypes(['text/html']).length ) {
            url = hyperLinkTpl({href: _.escape(url)});
        }

        return this.res.respond(status, url);
    },

    /**
     * @public
     * @memberOf {Connect}
     * @method
     *
     * @param {String} path
     * @param {Object} [opts]
     *
     * @returns {Rewrite}
     * */
    rewrite: function (path, opts) {
        path = Route.buildPath(path, opts);

        return new Rewrite(path);
    },

    /**
     * Выполняет шаблонизацию переданных данных и
     * выполняет ответ приложения
     *
     * @public
     * @memberOf {Connect}
     * @method
     *
     * @param {*} [status]
     * @param {String} id
     * @param {*} [arg...]
     * */
    render: function (status, id, arg) {
        /*eslint no-unused-vars: 0*/
        var args;
        var i;

        if ( _.isNumber(status) ) {
            i = 2;

        } else {
            i = 1;
            id = status;
            status = this.res.getStatus();
        }

        args = _.rest(arguments, i);

        return this.res.respond(status,
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
            status = void 0;
        }

        return this.res.respond(status, body);
    },

    /**
     * @protected
     * @memberOf {Connect}
     * @method
     *
     * @param {IncomingMessage} req
     * @param {Object} params
     *
     * @returns {Request}
     * */
    _createReq: function (req, params) {

        return new Request(req, params);
    },

    /**
     * @protected
     * @memberOf {Connect}
     * @method
     *
     * @param {OutgoingMessage} res
     * @param {Object} params
     *
     * @returns {Response}
     * */
    _createRes: function (res, params) {

        return new Response(res, params);
    }

});

module.exports = Connect;
