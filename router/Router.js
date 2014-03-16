'use strict';

var Class = /** @type Class */ require('fist.lang.class/Class');
var Route = /** @type Route */ require('../route/Route');

var extend = require('fist.lang.extend');

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
    },

    /**
     * @protected
     * @memberOf {Router}
     * @method
     *
     * @param {*} expr
     * @param {Object} [opts]
     *
     * @returns {Route}
     * */
    _createRoute: function (expr, opts) {

        return new Route(expr, opts);
    },

    /**
     * @public
     * @memberOf {Router}
     * @method
     *
     * @param {*} expr
     * @param {Object} [opts]
     *
     * @returns {Route}
     * */
    addRoute: function (expr, opts) {

        var route;

        opts = extend(Object.create(null), this.params, opts);
        route = this._createRoute(expr, opts);

        this.routes.push(route);

        return route;
    },

    /**
     * @public
     * @memberOf {Router}
     * @method
     *
     * @param {*} message
     *
     * @returns {Object|null}
     * */
    find: function (message) {

        var i;
        var l;
        var match;

        for ( i = 0, l = this.routes.length; i < l; i += 1 ) {
            match = this._match(this.routes[i], message);

            if ( null === match ) {

                continue;
            }

            return {
                route: this.routes[i],
                match: match
            };
        }

        return null;
    },

    /**
     * @protected
     * @memberOf {Router}
     * @method
     *
     * @param {Route} route
     * @param {String} message
     * */
    _match: function (route, message) {

        return route.match(message);
    }

});

module.exports = Router;
