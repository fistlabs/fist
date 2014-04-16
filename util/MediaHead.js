'use strict';

var R_SPACE = /^\s+$/;
var Base = /** @type Base */ require('fist.lang.class/Base');

var _ = /** @type _ */ require('lodash');

/**
 * @class MediaHead
 * @extends Base
 * */
var MediaHead = Base.extend(/** @lends MediaHead.prototype */ {

    /**
     * @protected
     * @memberOf {MediaHead}
     * @method
     *
     * @constructs
     *
     * @param {String} header
     * */
    constructor: function (header) {

        var ast = [];

        /**
         * @public
         * @memberOf {MediaHead}
         * @property
         * @type {String}
         * */
        this.value = void 0;

        if ( 'string' === typeof header ) {
            ast = MediaHead._createAst(header);

            if ( ast.length ) {
                this.value = ast.shift()[0];
            }
        }

        /**
         * @public
         * @memberOf {MediaHead}
         * @property
         * @type {Object}
         * */
        this.params = _.reduce(ast, MediaHead._astReducer, Object.create(null));

        /**
         * @protected
         * @memberOf {MediaHead}
         * @property {*}
         * */
        this._header = header;
    },

    /**
     * @public
     * @memberOf {MediaHead}
     * @method
     *
     * @returns {String}
     * */
    toString: function () {

        if ( void 0 === this.value ) {

            return this._header;
        }

        return _.reduce(this.params, function (header, v, i) {

            function reducer (header, v) {

                if ( void 0 === v ) {

                    return header + ';' + i;
                }

                return header + ';' + i + '=' + v;
            }

            if ( Array.isArray(v) ) {

                return _.reduce(v, reducer, header);
            }

            return reducer(header, v);
        }, this.value);
    }

}, {

    /**
     * @protected
     * @static
     * @memberOf MediaHead
     *
     * @method
     *
     * @param {Object} params
     * @param {Array} param
     *
     * @returns {Object}
     * */
    _astReducer: function (params, param) {

        if ( Array.isArray(params[param[0]]) ) {
            params[param[0]].push(param[1]);

            return params;
        }

        if ( param[0] in params ) {
            params[param[0]] = [params[param[0]], param[1]];

            return params;
        }

        params[param[0]] = param[1];

        return params;
    },

    /**
     * @protected
     * @static
     * @memberOf MediaHead
     * @method
     *
     * @param {String} header
     *
     * @returns {Array}
     * */
    _createAst: function (header) {
        /*eslint complexity: [2,15]*/

        var attrib = [];
        var buffer = '';
        var cursor;
        var i = 0;
        var length = header.length;
        var result = [];
        var spaces = 0;

        var stAttrib = 0;
        var stEscape = 0;
        var stQuotes = 0;

        function endBuf (endParam) {

            if ( 0 < spaces ) {
                buffer = buffer.slice(0, -spaces);
                spaces = 0;
            }

            attrib[stAttrib] = buffer;
            buffer = '';

            if ( endParam ) {

                if ( attrib[0] ) {
                    result[result.length] = attrib;
                    attrib = [];
                }

                stAttrib = 0;
            }
        }

        while ( true ) {

            if ( i === length ) {

                break;
            }

            cursor = header.charAt(i);

            i += 1;

            //  находимся в кавычках
            if ( 1 === stQuotes ) {
                //  в кавычках могут быть экранированные символы
                if ( '\\' === cursor && 0 === stEscape ) {
                    stEscape = 1;

                    continue;
                }

                //  если символ экранирован то он точно подойдет
                if ( 1 === stEscape ) {
                    buffer += cursor;
                    stEscape = 0;

                    continue;
                }

                //  закрывающая кавычка
                if ( '"' === cursor ) {
                    stQuotes = 0;

                    continue;
                }

                buffer += cursor;

                continue;
            }

            //  разделитель параметров
            if ( ';' === cursor ) {
                endBuf(true);

                continue;
            }

            if ( R_SPACE.test(cursor) ) {

                if ( '' === buffer ) {

                    continue;
                }

                buffer += cursor;
                spaces += 1;

                continue;
            }

            if ( 0 === stAttrib ) {

                //  значение
                if ( '=' === cursor ) {
                    endBuf();
                    stAttrib = 1;

                    continue;
                }

                spaces = 0;
                buffer += cursor;

                continue;
            }

            if ( '"' === cursor ) {
                stQuotes = 1;

                continue;
            }

            buffer += cursor;
        }

        endBuf(true);

        return result;
    }

});

module.exports = MediaHead;
