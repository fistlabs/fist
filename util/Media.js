'use strict';

var R_SPACE = /^\s+$/;
var Base = /** @type Base */ require('fist.lang.class/Base');

var parseCache = Object.create(null);
var _ = /** @type _ */ require('lodash');

/**
 * @class Media
 * @extends Base
 * */
var Media = Base.extend(/** @lends Media.prototype */ {

    /**
     * @protected
     * @memberOf {Media}
     * @method
     *
     * @constructs
     * */
    constructor: function (contentType) {
        _.extend(this, Media.parseMedia(contentType));
    }

}, {

    /**
     * @public
     * @static
     * @memberOf Media
     * @method
     *
     * @param {String} src
     *
     * @returns {Object}
     * */
    parseMedia: function (src) {

        if ( src in parseCache ) {

            return parseCache[src];
        }

        parseCache[src] = Media._parseContentTypeHeader(src);

        return parseCache[src];
    },

    /**
     * @protected
     * @static
     * @memberOf Media
     * @method
     *
     * @param {String} header
     *
     * @returns {Object}
     * */
    _parseContentTypeHeader: function (header) {

        var ast = Media._createParamsAst(header);

        return _.extend(Media._parseMimeType(ast.shift()[0]), {
            params: Media._reduceParamsAst(ast)
        });
    },

    /**
     * @protected
     * @static
     * @memberOf Media
     * @method
     *
     * @param {String} type
     *
     * @returns {Object}
     * */
    _parseMimeType: function (type) {

        var mime = type.split('/');

        return {
            type: mime[0],
            subtype: mime.slice(1).join('/')
        };
    },

    /**
     * @protected
     * @static
     * @memberOf Media
     * @method
     *
     * @param {Object} ast
     *
     * @returns {Object}
     * */
    _reduceParamsAst: function (ast) {

        return _.reduce(ast, Media._paramsAstReducer, Object.create(null));
    },

    /**
     * @protected
     * @static
     * @memberOf Media
     *
     * @method
     *
     * @param {Object} params
     * @param {Array} param
     *
     * @returns {Object}
     * */
    _paramsAstReducer: function (params, param) {

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
     * @memberOf Media
     * @method
     *
     * @param {String} src
     *
     * @returns {Array}
     * */
    _createParamsAst: function (src) {
        /*eslint complexity: [2,15]*/
        var i = 0;
        var l = src.length;
        var cursor;

        var param = [];
        var result = [];

        var stAttrib = -1;
        var stEscape = 0;
        var stQuotes = 0;

        var buf = '';
        var spaceBuf = 0;

        function endBuf () {

            if ( 0 < spaceBuf ) {
                buf = buf.slice(0, -spaceBuf);
                spaceBuf = 0;
            }

            param[stAttrib] = buf;
            buf = '';
        }

        while ( true ) {

            if ( i === l ) {

                break;
            }

            cursor = src.charAt(i);

            i += 1;

            if ( -1 === stAttrib ) {
                param = [];
                stAttrib = 0;
            }

            //  находимся в кавычках
            if ( 1 === stQuotes ) {
                //  в кавычках могут быть экранированные символы
                if ( '\\' === cursor && 0 === stEscape ) {
                    stEscape = 1;

                    continue;
                }

                //  если символ экранирован то он точно подойдет
                if ( 1 === stEscape ) {
                    buf += cursor;
                    stEscape = 0;

                    continue;
                }

                //  закрывающая кавычка
                if ( '"' === cursor ) {
                    //  добавляем значение параметра
                    stQuotes = 0;

                    continue;
                }

                buf += cursor;

                continue;
            }

            //  разделитель параметров
            if ( ';' === cursor ) {
                endBuf();
                result[result.length] = param;
                stAttrib = -1;

                continue;
            }

            if ( R_SPACE.test(cursor) ) {

                if ( '' === buf ) {

                    continue;
                }

                buf += cursor;
                spaceBuf += 1;

                continue;
            }

            if ( 0 === stAttrib ) {

                //  значение
                if ( '=' === cursor ) {
                    endBuf();
                    stAttrib = 1;

                    continue;
                }

                spaceBuf = 0;
                buf += cursor;

                continue;
            }

            if ( '"' === cursor ) {
                stQuotes = 1;

                continue;
            }

            buf += cursor;
        }

        if ( buf ) {
            endBuf();
            result[result.length] = param;
        }

        return result;
    }

});

module.exports = Media;
