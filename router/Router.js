'use strict';

var Class = /** @type Class */ require('fist.lang.class/Class');
var Route = /** @type Route */ require('../route/Route');

var _ = /** @type _*/ require('lodash');

/**
 * @class Router
 * @extends Class
 * */
var Router = Class.extend(/** @lends Router.prototype */ {

    /**
     * @protected
     * @memberOf {Router}
     * @method
     *
     * @constructs
     * */
    constructor: function () {
        Router.Parent.apply(this, arguments);

        /**
         * @public
         * @memberOf {Router}
         * @property {Array<Route>}
         * */
        this.routes = [];

        /**
         * @public
         * @memberOf {Router}
         * @property {Object}
         * */
        this.verbs = Object.create(null);
    },

    /**
     * @public
     * @memberOf {Router}
     * @method
     *
     * @param {String} verb     метод запроса
     * @param {String} tmpl     шаблон урла запроса
     * @param {*} name          id маршрута (должен быть уникальным)
     * @param {*} [data]        любые закрепленные данные
     * @param {*} [opts]        опции для роута
     *
     * @returns {Route}
     * */
    addRoute: function (verb, tmpl, name, data, opts) {

        var i = this.routes.length;
        var route;

        while ( i ) {
            i -= 1;
            route = this.routes[i];

            if ( name === route.name ) {
                this.verbs[route.verb] -= 1;
                this.routes.splice(i, 1);
            }
        }

        opts = _.extend(Object.create(null), this.params, opts);
        route = this._createRoute(tmpl, opts);

        route.data = data;
        route.name = name;
        route.verb = verb;

        if ( verb in this.verbs ) {
            this.verbs[verb] += 1;
        } else {

            this.verbs[verb] = 1;
        }

        this.routes.push(route);

        return route;
    },

    /**
     * @public
     * @memberOf {Router}
     * @method
     *
     * @param {String} verb
     * @param {String} pathname
     * @param {String} [resume]
     *
     * @returns {null|Object|Array<String>}
     * */
    find: function (verb, pathname, resume) {

        var i;

        if ( void 0 === resume || null === resume ) {

            if ( false === verb in this.verbs &&
                false === ( 'HEAD' === verb && 'GET' in this.verbs ) ) {

//                501
                return [];
            }

            i = 0;

        } else {
            i = this._getRouteIndex(resume);

            if ( -1 === i || i === this.routes.length ) {
                //  404
                return null;
            }

            i += 1;
        }

        return this._find(verb, pathname, i);
    },

    /**
     * @public
     * @memberOf {Router}
     * @method
     *
     * @param {String} name
     *
     * @returns {Route}
     * */
    getRoute: function (name) {

        var i = this._getRouteIndex(name);

        if ( -1 === i ) {

            return null;
        }

        return this.routes[i];
    },

    /**
     * @protected
     * @memberOf {Router}
     * @method
     *
     * @param {String} verb
     * @param {String} pathname
     * @param {Number} i
     *
     * @returns {*}
     * */
    _find: function (verb, pathname, i) {

        var l;
        var heads = [];
        var match;
        var route;
        var verbs = [];

        for ( l = this.routes.length; i < l; i += 1 ) {
            route = this.routes[i];
            match = route.match(pathname);

            //  не сматчился
            if ( null === match ) {

                continue;
            }

            if ( verb === route.verb ) {
                //  Строгое соответствие method+pattern
                return {
                    match: match,
                    route: route
                };
            }

            //  сохраняем методы сматчившихся запросов
            verbs[verbs.length] = route.verb;

            if ( 'HEAD' === verb && 'GET' === route.verb ) {
                heads[heads.length] = {
                    match: match,
                    route: route
                };
            }
        }

        if ( 0 === verbs.length ) {

            //  404
            return null;
        }

        if ( 0 === heads.length ) {

            //  405
            return _.uniq(verbs);
        }

        //  HEAD 200
        return heads[0];

    },

    /**
     * @protected
     * @memberOf {Router}
     * @method
     *
     * @param {String} name
     *
     * @returns {Number}
     * */
    _getRouteIndex: function (name) {

        var routes = this.routes;
        var i = routes.length;

        while ( i ) {
            i -= 1;

            if ( routes[i].name === name ) {

                return i;
            }
        }

        return -1;
    },

    /**
     * @protected
     * @memberOf {Route}
     * @method
     *
     * @param {String} expr
     * @param {Object} [opts]
     *
     * @returns {Route}
     * */
    _createRoute: function (expr, opts) {

        return new Route(expr, opts);
    }

});

module.exports = Router;
