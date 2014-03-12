'use strict';

var Router = /** @type Router */ require('./Router');
var Pathr = /** @type Pathr */ require('./route/Pathr');

var unique = require('fist.lang.unique');

/**
 * @class Classic
 * @extends Router
 * */
var Classic = Router.extend(/** @lends Classic.prototype */ {

    /**
     * @protected
     * @memberOf {Classic}
     * @method
     *
     * @constructs
     * */
    constructor: function () {
        Classic.Parent.apply(this, arguments);

        /**
         * @public
         * @memberOf {Classic}
         * @property {Object}
         * */
        this.verbs = Object.create(null);
    },

    /**
     * @public
     * @memberOf {Classic}
     * @method
     *
     * @param {String} verb
     * @param {String} expr
     * @param {*} name
     * @param {*} [data]
     * @param {*} [opts]
     *
     * @returns {Route}
     * */
    addRoute: function (verb, expr, name, data, opts) {

        var i;
        var route;

        i = this.routes.length;

        while ( i ) {
            i -= 1;

            if ( name === this.routes[i].name ) {
                this.verbs[this.routes[i].verb] -= 1;
                this.routes.splice(i, 1);
            }
        }

        route = Classic.parent.addRoute.call(this, expr, opts);

        route.data = data;
        route.name = name;

        verb = verb.toUpperCase();

        route.verb = verb;

        if ( verb in this.verbs ) {
            this.verbs[verb] += 1;
        } else {
            this.verbs[verb] = 1;
        }

        return route;
    },

    /**
     * @public
     * @memberOf {Classic}
     * @method
     *
     * @param {String} verb
     * @param {String} message
     *
     * @returns {null|Object|Array<String>}
     * */
    find: function (verb, message) {
        /*eslint complexity: [2,9]*/
        var i;
        var l;
        var match;
        var verbs = [];
        var found = [];

        verb = verb.toUpperCase();

        //  Нет ни одного маршрута такого типа
        if ( !(verb in this.verbs) ) {

            if ( !('HEAD' === verb && 'GET' in this.verbs ) ) {

                //  501
                return [];
            }
        }

        for ( i = 0, l = this.routes.length; i < l; i += 1 ) {
            match = this._match(this.routes[i], message);

            if ( null === match ) {

                continue;
            }

            if ( verb === this.routes[i].verb ) {

                //  Строгое соответствие method+pattern
                return {
                    match: match,
                    route: this.routes[i]
                };
            }

            //  временно сохраняем маршруты подходящие по матчу,
            // но не подходящие по методу
            found[found.length] = {
                match: match,
                route: this.routes[i]
            };

            verbs[verbs.length] = this.routes[i].verb;
        }

        //  ни одного совпадения
        if ( 0 === found.length ) {

            return null;
        }

        //  для HEAD метода сойдет GET
        if ( 'HEAD' === verb ) {
            i = verbs.indexOf('GET');

            if ( -1 !== i ) {

                return found[i];
            }
        }

        //  405
        return unique(verbs);
    },

    /**
     * @public
     * @memberOf {Classic}
     * @method
     *
     * @param {String} name
     *
     * @returns {Route}
     * */
    getRoute: function (name) {

        var routes = this.routes;
        var l = routes.length;

        while ( l ) {
            l -= 1;

            if ( routes[l].name === name ) {

                return routes[l];
            }
        }

        return null;
    },

    /**
     * @protected
     * @memberOf {Pathr}
     * @method
     *
     * @param {String} expr
     * @param {Object} [opts]
     *
     * @returns {Pathr}
     * */
    _createRoute: function (expr, opts) {

        return new Pathr(expr, opts);
    }

});

module.exports = Classic;
