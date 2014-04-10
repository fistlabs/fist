'use strict';

var R_SPACE = /^\s+$/;
var Base = /** @type Base */ require('fist.lang.class/Base');

var _ = /** @type _ */ require('lodash');

/**
 * @class ContentType
 * @extends Base
 * */
var ContentType = Base.extend(/** @lends ContentType.prototype */ {

    /**
     * @protected
     * @memberOf {ContentType}
     * @method
     *
     * @constructs
     *
     * @param {String} header
     * */
    constructor: function (header) {

        var ast;
        var type;

        if ( header ) {
            ast = ContentType._createAst(header);
            type = ast.shift()[0].split('/');
        } else {

            ast = [];
            type = [void 0, void 0];
        }

        /**
         * @public
         * @memberOf {ContentType}
         * @property
         * @type {String}
         * */
        this.type = type[0];

        /**
         * @public
         * @memberOf {ContentType}
         * @property
         * @type {String}
         * */
        this.subtype = 2 === type.length ?
            type[1] :
            type.slice(1).join('/');

        /**
         * @public
         * @memberOf {ContentType}
         * @property
         * @type {Object}
         * */
        this.params = _.reduce(ast,
            ContentType._astReducer, Object.create(null));
    },

    /**
     * @public
     * @memberOf {ContentType}
     * @method
     *
     * @returns {String}
     * */
    getMime: function () {

        if ( this.type && this.subtype ) {
            return this.type + '/' + this.subtype;
        }

        return void 0;
    }

}, {

    /**
     * @protected
     * @static
     * @memberOf ContentType
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
     * @memberOf ContentType
     * @method
     *
     * @param {String} src
     *
     * @returns {Array}
     * */
    _createAst: function (src) {
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

module.exports = ContentType;
