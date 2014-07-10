'use strict';

var REDIRECT_CODES = [300, 301, 302, 303, 305, 307];

var Negotiator = /** @type Negotiator */ require('negotiator');
var Req = /** @type Req */ require('../req/Req');
var Res = /** @type Res */ require('../res/Res');
var Track = /** @type Track */ require('./Track');

var _ = require('lodash-node');
var inherit = require('inherit');
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
     * */
    redirect: function (status, url) {

        if ( _.isNumber(status) ) {

            if ( !_.contains(REDIRECT_CODES, status) ) {
                status = 302;
            }

        } else {
            url = status;
            status = 302;
        }

        this.res.setHeader('Location', url);

        if ( this.neg.mediaTypes(['text/html']).length ) {
            url = _.escape(url);
            url = '<a href="' + url + '">' + url + '</a>';
        }

        return this.res.respond(status, url);
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
            status = this.res.getStatus();
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
     * @param {OutgoingMessage} res
     * @param {Object} params
     *
     * @returns {Res}
     * */
    _createRes: function (res, params) {

        return new Res(res, params);
    }

});

module.exports = Connect;
