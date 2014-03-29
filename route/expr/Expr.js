'use strict';

var Base = /** @type Base */ require('fist.lang.class/Base');
var push = Array.prototype.push;

/**
 * @class Expr
 * @extends Base
 * */
var Expr = Base.extend(/** @lends Expr.prototype */ {

    /**
     * @protected
     * @memberOf {Expr}
     * @method
     *
     * @constructs
     * */
    constructor: function () {

        /**
         * @public
         * @memberOf {Expr}
         * @property {Object}
         * */
        this.parsed = Object.create(null);
    },

    /**
     * @public
     * @memberOf {Expr}
     * @method
     *
     * @param {String} s
     *
     * @returns {String}
     * */
    escape: function (s) {

        return s.replace(/[\\\(\)<>,=]/g, '\\$&');
    },

    /**
     * @public
     * @memberOf {Expr}
     * @method
     *
     * @param {String} ps
     *
     * @returns {Object}
     * */
    parse: function (ps) {

        if ( ps in this.parsed ) {

            return this.parsed[ps];
        }

        this.parsed[ps] = this._parse(ps);

        return this.parsed[ps];
    },

    /**
     * @protected
     * @memberOf {Expr}
     * @method
     *
     * @param {String} src
     *
     * @returns {Object}
     * */
    _parse: function (src) {
        /*eslint complexity: [2, 29]*/
        var ast;
        var buf;
        var cur;
        var esc;
        var prm;
        var prs;
        var stk;
        var body;
        var val;

        ast = buf = [];
        esc = prm = prs = val = 0;
        ast.map = [];
        stk = [];
        body = '';

        for ( var i = 0, l = src.length; i < l; i += 1 ) {
            cur = src.charAt(i);

            if ( '\\' === cur && 0 === esc ) {
                esc = 1;

                continue;
            }

            if ( 1 === esc ) {
                body += cur;
                esc = 0;

                continue;
            }

            if ( '(' === cur ) {

                if ( 1 === prm ) {

                    throw new SyntaxError(src);
                }

                prs += 1;

                if ( 0 < body.length ) {
                    buf[buf.length] = {
                        type: Expr.PART_TYPE_DFT,
                        body: body
                    };

                    body = '';
                }

                stk[stk.length] = buf;

                buf[buf.length] = {
                    type: Expr.PART_TYPE_OPT,
                    body: buf = []
                };

                continue;
            }

            if ( ')' === cur ) {

                if ( 0 === prs ) {

                    throw new SyntaxError(src);
                }

                prs -= 1;

                if ( 0 < body.length ) {
                    buf[buf.length] = {
                        type: Expr.PART_TYPE_DFT,
                        body: body
                    };

                    body = '';
                }

                if ( 0 === buf.length ) {

                    throw new SyntaxError(src);
                }

                buf = stk.pop();

                continue;
            }

            if ( '<' === cur ) {

                if ( 1 === prm ) {

                    throw new SyntaxError(src);
                }

                if ( 0 < body.length ) {
                    buf[buf.length] = {
                        type: Expr.PART_TYPE_DFT,
                        body: body
                    };

                    body = '';
                }

                prm = 1;

                continue;
            }

            if ( '>' === cur ) {

                if ( 0 === prm || '' === body ) {

                    throw new SyntaxError(src);
                }

                if ( 1 === val ) {
                    buf[buf.length] = {
                        type: Expr.PART_TYPE_VAL,
                        body: body
                    };

                    buf = stk.pop();

                    //  закрываем список значений
                    val = 0;

                } else {
                    ast.map[ast.map.length] = buf[buf.length] = {
                        type: Expr.PART_TYPE_PRM,
                        body: body,
                        only: []
                    };
                }

                prm = 0;
                body = '';

                continue;
            }

            if ( '=' === cur ) {

                if ( '' === body || 0 === prm || 1 === val ) {

                    throw new SyntaxError(src);
                }

                //  погружаемся в дерево
                stk[stk.length] = buf;

                ast.map[ast.map.length] = buf[buf.length] = {
                    type: Expr.PART_TYPE_PRM,
                    body: body,
                    only: buf = []
                };

                body = '';

                val = 1;

                continue;
            }

            if ( ',' === cur ) {

                if ( '' === body || 0 === prm || 0 === val ) {

                    throw new SyntaxError(src);
                }

                buf[buf.length] = {
                    type: Expr.PART_TYPE_VAL,
                    body: body
                };

                body = '';

                continue;
            }

            body += cur;
        }

        if ( 0 < prs + esc + prm ) {

            throw new SyntaxError(src);
        }

        if ( 0 < body.length ) {
            ast[ast.length] = {
                type: Expr.PART_TYPE_DFT,
                body: body
            };
        }

        if ( 0 === ast.length ) {

            throw new SyntaxError(src);
        }

        return ast;
    }

}, /** @lends Expr */ {

    /**
     * @public
     * @static
     * @memberOf Expr
     * @property {*}
     * */
    PART_TYPE_DFT: 0,

    /**
     * @public
     * @static
     * @memberOf Expr
     * @property {*}
     * */
    PART_TYPE_OPT: 1,

    /**
     * @public
     * @static
     * @memberOf Expr
     * @property {*}
     * */
    PART_TYPE_PRM: 2,

    /**
     * @public
     * @static
     * @memberOf Expr
     * @property {*}
     * */
    PART_TYPE_VAL: 3
});

module.exports = Expr;
