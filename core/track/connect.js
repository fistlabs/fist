'use strict';

var REDIRECT_CODES = [300, 301, 302, 303, 305, 307];

var Context = /** @type Context */ require('../deps/context');
var Negotiator = /** @type Negotiator */ require('negotiator');
var Request = /** @type Request */ require('./request');
var Response = /** @type Response */ require('./response');
var Rewrite = /** @type Rewrite */ require('../control/rewrite');
var Track = /** @type Track */ require('./track');

var _ = require('lodash-node');
var inherit = require('inherit');
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
        this.args = {};

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
        this.request = new Request(req, agent.params.request);

        /**
         * @public
         * @memberOf {Connect}
         * @property
         * @type {Response}
         * */
        this.response = new Response(res, agent.params.response);

        /**
         * @public
         * @memberOf {Connect}
         * @property
         * @type {Array}
         * */
        this.route = null;

        /**
         * @public
         * @memberOf {Connect}
         * @property
         * @type {Object}
         * */
        this.url = this.request.createUrl(req.url);
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

        return this.agent.router.getRule(name).build(params);
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

        if (!arguments.length) {

            return this.request.getHeaders();
        }

        if (_.isObject(name)) {
            this.response.setHeaders(name, value);

            return this;
        }

        if (arguments.length === 1) {

            return this.request.getHeader(name);
        }

        this.response.setHeader(name, value, soft);

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

        if (!arguments.length) {

            return this.request.getCookies();
        }

        if (arguments.length === 1) {

            return this.request.getCookie(name);
        }

        this.response.setCookie(name, value, opts);

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

        if (!_.isNumber(status)) {
            url = status;
            status = 302;
        }

        this.response.setHeader('Location', url);

        if (!_.contains(REDIRECT_CODES, status)) {
            status = 302;
        }

        if (this.neg.mediaTypes(['text/html']).length) {
            url = hyperLinkTpl({href: _.escape(url)});
        }

        return this.response.respond(status, url);
    },

    /**
     * @public
     * @memberOf {Connect}
     * @method
     *
     * @param {String} path
     *
     * @returns {Rewrite}
     * */
    rewrite: function (path) {

        return new Rewrite(path);
    },

    /**
     * Выполняет ответ приложения
     *
     * @public
     * @memberOf {Connect}
     * @method
     * */
    send: function (status, body) {

        if (!_.isNumber(status)) {
            body = status;
            status = void 0;
        }

        return this.response.respond(status, body);
    },

    /**
     * @protected
     * @memberOf {Track}
     * @method
     *
     * @param {String} path
     * @param {Object} params
     *
     * @returns {Deps}
     * */
    _createContext: function (path, params) {

        return new Context(this, path, params);
    }

});

module.exports = Connect;
