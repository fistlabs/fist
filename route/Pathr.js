'use strict';

var QueryString = require('querystring');
var Route = /** @type Route */ require('./Route');

var _ = /** @type _ */ require('lodash');

/**
 * @class Pathr
 * @extends Route
 * */
var Pathr = Route.extend(/** @lends Pathr.prototype */ {

    /**
     * @protected
     * @memberOf {Pathr}
     * @method
     *
     * @param {Object} ast
     * @param {Object} params
     *
     * @returns {String}
     * */
    _build: function (ast, params) {

        var query = Object.create(null);
        var pathname = Pathr.parent._build(ast, params);

        _.forOwn(params, function (val, name) {

            if ( _.some(ast.map, {body: name}) ) {

                return;
            }

            query[name] = val;
        }, this);

        query = QueryString.stringify(query);

        if ( '' === query ) {

            return pathname;
        }

        return pathname + '?' + query;
    }

});

module.exports = Pathr;
