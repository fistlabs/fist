'use strict';

var Route = /** @type Route */ require('./Route');
var Url = require('url');

var hasProperty = Object.prototype.hasOwnProperty;

/**
 * @class Pathr
 * @extends Route
 * */
var Pathr = Route.extend(/** @lends Pathr.prototype */ {}, {

    /**
     * @protected
     * @static
     * @memberOf Pathr
     * @method
     *
     * @param {Object} ast
     * @param {Object} params
     *
     * @returns {String}
     * */
    _build: function (ast, params) {

        var i;
        var query = {};
        var result = Pathr.Parent._build(ast, params);
        var url;

        for ( i in params ) {

            if ( hasProperty.call(params, i) ) {

                if ( -1 === this._indexOfParam(ast, i) ) {
                    query[i] = params[i];
                }
            }
        }

        url = Url.parse(result);
        url.query = query;

        return Url.format(url);
    },

    /**
     * @protected
     * @memberOf {Pathr}
     * @method
     *
     * @param {Object} ast
     * @param {String} name
     *
     * @returns {Number}
     * */
    _indexOfParam: function (ast, name) {

        var l = ast.map.length;

        while ( l ) {
            l -= 1;

            if ( ast.map[l].body === name ) {

                return l;
            }
        }

        return -1;
    }

});

module.exports = Pathr;
