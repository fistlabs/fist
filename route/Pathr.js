'use strict';

var Route = /** @type Route */ require('./Route');
var Url = require('url');

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
        var result = Pathr.parent._build(ast, params);
        var url;

        _.forOwn(params, function (val, name) {

            if ( _.some(ast.map, {body: name}) ) {

                return;
            }

            query[name] = val;
        }, this);

        url = Url.parse(result);
        url.query = query;

        return Url.format(url);
    }

});

module.exports = Pathr;
