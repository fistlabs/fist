'use strict';

var Base = /** @type Base */ require('fist.lang.class/Base');

var _ = /** @type _ */ require('lodash');
var hasProperty = Object.prototype.hasOwnProperty;
var push = Array.prototype.push;
var regesc = require('fist.lang.regesc');

/**
 * @class Route
 * @extends Base
 * */
var Route = Base.extend(/** @lends Route.prototype */ {

    /**
     * @protected
     * @memberOf {Route}
     * @method
     *
     * @param {String} expr
     * @param {Object} [opts]
     *
     * @constructs
     * */
    constructor: function (expr, opts) {

        /**
         * @public
         * @memberOf {Route}
         * @property {Object}
         * */
        this.ast = Route.parse(expr);

        /**
         * @public
         * @memberOf {Route}
         * @property {Object}
         * */
        this.matches = Object.create(null);

        /**
         * @public
         * @memberOf {Route}
         * @property {RegExp}
         * */
        this.regex = this._createRegExp(this.ast,
            _.extend(Object.create(null), opts));
    },

    /**
     * @protected
     * @memberOf {Route}
     * @method
     *
     * @param {Object} ast
     * @param {Object} opts
     *
     * @returns {RegExp}
     * */
    _createRegExp: function (ast, opts) {

        var src = Route._buildRegex(ast);

        if ( !opts.nostart ) {
            src = '^' + src;
        }

        if ( !opts.noend ) {
            src = src + '$';
        }

        return new RegExp(src, opts.nocase ? 'i' : '');
    },

    /**
     * @public
     * @memberOf {Route}
     * @method
     *
     * @param {Object} [params]
     *
     * @returns {String}
     * */
    build: function (params) {

        if ( Object(params) !== params ) {
            params = Object.create(null);
        }

        return this.constructor._build(this.ast, params);
    },

    /**
     * @public
     * @memberOf {Route}
     * @method
     *
     * @param {String} s
     *
     * @returns {Object}
     * */
    match: function (s) {

        if ( s in this.matches ) {

            return this.matches[s];
        }

        this.matches[s] = Route._match(this.regex, s, this.ast.map);

        return this.matches[s];
    }

}, {

    /**
     * @public
     * @static
     * @memberOf Route
     * @property {*}
     * */
    PART_TYPE_DFT: 0,

    /**
     * @public
     * @static
     * @memberOf Route
     * @property {*}
     * */
    PART_TYPE_OPT: 1,

    /**
     * @public
     * @static
     * @memberOf Route
     * @property {*}
     * */
    PART_TYPE_PRM: 2,

    /**
     * @public
     * @static
     * @memberOf Route
     * @property {*}
     * */
    PART_TYPE_VAL: 3,

    /**
     * @public
     * @static
     * @memberOf Route
     * @method
     *
     * @this Route
     *
     * @param {String} expr
     * @param {Object} [params]
     *
     * @returns {String}
     * */
    build: function (expr, params) {

        if ( Object(params) !== params ) {
            params = Object.create(null);
        }

        return this._build(Route.parse(expr), params);
    },

    /**
     * @public
     * @static
     * @memberOf Route
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
     * @static
     * @memberOf Route
     * @property {Object}
     * */
    parsed: Object.create(null),

    /**
     * @public
     * @static
     * @memberOf Route
     * @method
     *
     * @param {String} expr
     *
     * @returns {Object}
     * */
    parse: function (expr) {

        if ( expr in Route.parsed ) {

            return Route.parsed[expr];
        }

        Route.parsed[expr] = Route._parse(expr);

        return Route.parsed[expr];
    },

    /**
     * @protected
     * @static
     * @memberOf Route
     * @method
     *
     * @param {Object} ast
     * @param {Object} params
     *
     * @returns {String}
     * */
    _build: function (ast, params) {
        /*eslint max-depth: [2,6], complexity: [2,30]*/
        var body;
        var buf = '';
        var len = ast.length;
        var opt = false;
        var pos = 0;
        var stk = [];
        var tok;
        var use = Object.create(null);

        var i;

        out:
        while ( true ) {

            if ( pos === len ) {
                ast = stk.pop();

                if ( void 0 === ast ) {

                    break;
                }

                if ( 0 === stk.length ) {
                    opt = false;
                }

                ast.buf += buf;

                pos = ast.pos;
                buf = ast.buf;
                ast = ast.ast;
                len = ast.length;

                continue;
            }

            tok = ast[pos];

            if ( Route.PART_TYPE_OPT === tok.type ) {
                opt = true;

                stk[stk.length] = {
                    buf: buf,
                    ast: ast,
                    pos: pos + 1
                };

                pos = 0;
                ast = tok.body;
                len = ast.length;
                tok = ast[pos];
                buf = '';
            }

            pos += 1;

            if ( Route.PART_TYPE_DFT === tok.type ) {
                buf += Route.escape(tok.body);

                continue;
            }

            body = tok.body;

            //  передан параметр, тут жопа кароч!
            if ( hasProperty.call(params, body) && void 0 !== params[body] ) {

                //  массив паарметров
                if ( Array.isArray(params[body]) ) {

                    //  отмечаем что заюзали
                    if ( 'number' === typeof use[body] ) {
                        use[body] += 1;

                    } else {
                        use[body] = 0;
                    }

                    if ( hasProperty.call(params[body], use[body]) ) {

                        if ( 0 === tok.only.length ) {
                            buf += params[body][use[body]];

                            continue;
                        }

                        i = tok.only.length;

                        while ( i ) {
                            i -= 1;
                            //  тут специально ==
                            /*eslint eqeqeq: 0*/
                            if ( tok.only[i].body == params[body][use[body]] ) {
                                buf += params[body][use[body]];

                                continue out;
                            }
                        }
                    }

                } else {

                    if ( 0 === tok.only.length ) {
                        buf += params[body];

                        continue;
                    }

                    i = tok.only.length;

                    while ( i ) {
                        i -= 1;

                        if ( tok.only[i].body == params[body] ) {
                            buf += params[body];

                            continue out;
                        }
                    }
                }
            }

            if ( opt ) {
                pos = len;
                buf = '';
            }
        }

        return buf;
    },

    /**
     * @protected
     * @static
     * @memberOf Route
     * @method
     *
     * @param {RegExp} regex
     * @param {String} s
     * @param {Array<String>} map
     *
     * @returns {Object}
     * */
    _match: function (regex, s, map) {

        var i;
        var l;
        var m = regex.exec(s);
        var name;
        var params;

        if ( null === m ) {

            return m;
        }

        params = Object.create(null);

        for ( i = 1, l = m.length; i < l; i += 1 ) {
            name = map[i - 1].body;

            if ( hasProperty.call(params, name) ) {

                if ( Array.isArray(params[name]) ) {
                    params[name][params[name].length] = m[i];

                    continue;
                }

                params[name] = [params[name], m[i]];

                continue;
            }

            params[name] = m[i];
        }

        return params;
    },

    /**
     * @protected
     * @static
     * @memberOf Route
     * @method
     *
     * @param {Object} ast
     *
     * @returns {String}
     * */
    _buildRegex: function (ast) {

        var buf = [];
        var len = ast.length;
        var pos = 0;
        var stk = [];
        var tok;

        while ( true ) {

            if ( pos === len ) {
                ast = stk.pop();

                if ( void 0 === ast ) {

                    break;
                }

                ast.buf[ast.buf.length] = '(?:';
                buf[buf.length] = ')?';
                push.apply(ast.buf, buf);
                buf = ast.buf;
                pos = ast.pos;
                ast = ast.ast;
                len = ast.length;

                continue;
            }

            tok = ast[pos];

            if ( Route.PART_TYPE_OPT === tok.type ) {
                stk[stk.length] = {
                    ast: ast,
                    pos: pos + 1,
                    buf: buf
                };

                pos = 0;
                ast = tok.body;
                len = ast.length;
                tok = ast[pos];
                buf = [];
            }

            pos += 1;

            if ( Route.PART_TYPE_DFT === tok.type ) {
                buf[buf.length] = regesc(tok.body);

                continue;
            }

            //  param
            if ( 0 === tok.only.length ) {
                buf[buf.length] = '([^/]+?)';

            } else {
                buf[buf.length] = '(' + tok.only.
                    map(this._escBody, this).join('|') + ')';
            }

        }

        return buf.join('');
    },

    /**
     * @protected
     * @static
     * @memberOf Route
     * @method
     *
     * @param {Object} tok
     *
     * @returns {String}
     * */
    _escBody: function (tok) {

        return regesc(tok.body);
    },

    /**
     * @protected
     * @static
     * @memberOf Route
     * @method
     *
     * @param {String} expr
     *
     * @returns {Object}
     * */
    _parse: function (expr) {
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

        for ( var i = 0, l = expr.length; i < l; i += 1 ) {
            cur = expr.charAt(i);

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

                    throw new SyntaxError(expr);
                }

                prs += 1;

                if ( 0 < body.length ) {
                    buf[buf.length] = {
                        type: Route.PART_TYPE_DFT,
                        body: body
                    };

                    body = '';
                }

                stk[stk.length] = buf;

                buf[buf.length] = {
                    type: Route.PART_TYPE_OPT,
                    body: buf = []
                };

                continue;
            }

            if ( ')' === cur ) {

                if ( 0 === prs ) {

                    throw new SyntaxError(expr);
                }

                prs -= 1;

                if ( 0 < body.length ) {
                    buf[buf.length] = {
                        type: Route.PART_TYPE_DFT,
                        body: body
                    };

                    body = '';
                }

                if ( 0 === buf.length ) {

                    throw new SyntaxError(expr);
                }

                buf = stk.pop();

                continue;
            }

            if ( '<' === cur ) {

                if ( 1 === prm ) {

                    throw new SyntaxError(expr);
                }

                if ( 0 < body.length ) {
                    buf[buf.length] = {
                        type: Route.PART_TYPE_DFT,
                        body: body
                    };

                    body = '';
                }

                prm = 1;

                continue;
            }

            if ( '>' === cur ) {

                if ( 0 === prm || '' === body ) {

                    throw new SyntaxError(expr);
                }

                if ( 1 === val ) {
                    buf[buf.length] = {
                        type: Route.PART_TYPE_VAL,
                        body: body
                    };

                    buf = stk.pop();

                    //  закрываем список значений
                    val = 0;

                } else {
                    ast.map[ast.map.length] = buf[buf.length] = {
                        type: Route.PART_TYPE_PRM,
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

                    throw new SyntaxError(expr);
                }

                //  погружаемся в дерево
                stk[stk.length] = buf;

                ast.map[ast.map.length] = buf[buf.length] = {
                    type: Route.PART_TYPE_PRM,
                    body: body,
                    only: buf = []
                };

                body = '';

                val = 1;

                continue;
            }

            if ( ',' === cur ) {

                if ( '' === body || 0 === prm || 0 === val ) {

                    throw new SyntaxError(expr);
                }

                buf[buf.length] = {
                    type: Route.PART_TYPE_VAL,
                    body: body
                };

                body = '';

                continue;
            }

            body += cur;
        }

        if ( 0 < prs + esc + prm ) {

            throw new SyntaxError(expr);
        }

        if ( 0 < body.length ) {
            ast[ast.length] = {
                type: Route.PART_TYPE_DFT,
                body: body
            };
        }

        if ( 0 === ast.length ) {

            throw new SyntaxError(expr);
        }

        return ast;
    }

});

module.exports = Route;
