'use strict';

var Base = /** @type Base */ require('fist.lang.class/Base');
var QueryString = require('querystring');

var _ = /** @type _ */ require('lodash');
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

        return this._build(params);
    },

    /**
     * @public
     * @memberOf {Route}
     * @method
     *
     * @param {String} url
     *
     * @returns {Object}
     * */
    match: function (url) {

        if ( false === url in this.matches ) {
            this.matches[url] = this._match(url);
        }

        return this.matches[url];
    },

    /**
     * @protected
     * @memberOf {Route}
     * @method
     *
     * @param {Object} params
     *
     * @returns {String}
     * */
    _build: function (params) {
        /*eslint max-depth: [2,5]*/
        var ast = this.ast;
        var body;
        var buf = '';
        var len = ast.length;
        var map = ast.map;
        var num;
        var opt = false;
        var pos = 0;
        var query;
        var stk = [];
        var tok;
        var use = Object.create(null);
        var val;

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
            if ( _.has(params, body) &&
                 void 0 !== params[body] ) {
                val = params[body];

                //  массив паарметров
                if ( _.isArray(val) ) {
                    //  отмечаем что заюзали
                    if (_.isNumber(use[body]) ) {
                        num = use[body] += 1;

                    } else {
                        num = use[body] = 0;
                    }

                    if ( _.has(val, num) ) {

                        if ( 0 === tok.only.length ||
                            _.find(tok.only, {body: void 0}) ||
                            _.find(tok.only, {body: String(val[num])}) ) {
                            buf += val[num];

                            continue;
                        }
                    }

                } else {

                    if ( 0 === tok.only.length ||
                        _.find(tok.only, {body: void 0}) ||
                        _.find(tok.only, {body: String(val)}) ) {
                        buf += val;

                        continue;
                    }
                }
            }

            if ( opt ) {
                pos = len;
                buf = '';
            }
        }

        query = _.omit(params, function (val, name) {

            return _.some(map, {body: name});
        });

        query = QueryString.stringify(query);

        if ( '' === query ) {

            return buf;
        }

        return buf + '?' + query;
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

        var src = '^' + Route._buildRegex(ast) + '$';

        return new RegExp(src, opts.nocase ? 'i' : '');
    },

    /**
     * @protected
     * @static
     * @memberOf Route
     * @method
     *
     * @param {String} url
     *
     * @returns {Object}
     * */
    _match: function (url) {

        var len;
        var map = this.ast.map;
        var pos;
        var name;
        var params;
        var rex = this.regex;
        var res = rex.exec(url);

        if ( null === res ) {

            return res;
        }

        params = Object.create(null);

        for ( pos = 1, len = res.length; pos < len; pos += 1 ) {
            name = map[pos - 1].body;

            if ( _.has(params, name) ) {

                if ( _.isArray(params[name]) ) {
                    params[name][params[name].length] = res[pos];

                    continue;
                }

                params[name] = [params[name], res[pos]];

                continue;
            }

            params[name] = res[pos];
        }

        return params;
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
     * @param {String} s
     *
     * @returns {String}
     * */
    escape: function (s) {

        return s.replace(/[\\\(\)<>,=*]/g, '\\$&');
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
                buf[buf.length] = '([^/]+)';

                continue;
            }

            if ( _.find(tok.only, {body: void 0}) ) {
                buf[buf.length] = '([\\s\\S]+)';

                continue;
            }

            buf[buf.length] = '(' + _.map(tok.only,
                this._escBody, this).join('|') + ')';

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
     * @param {String} src
     *
     * @returns {Object}
     * */
    parse: function (src) {
        /*eslint complexity: [2, 32]*/
        var ast;
        var buf;
        var cur;
        var esc;
        var len;
        var pos;
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

        for ( pos = 0, len = src.length; pos < len; pos += 1 ) {
            cur = src.charAt(pos);

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

                    throw new SyntaxError(src);
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

                    throw new SyntaxError(src);
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

                    throw new SyntaxError(src);
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

            if ( '*' === cur ) {
                cur = src.charAt(pos + 1);

                if ( 1 === val && '' === body &&
                    ( ',' ===  cur || '>' === cur ) ) {

                    body = '*';

                    buf[buf.length] = {
                        type: Route.PART_TYPE_VAL
                    };

                    continue;
                }

                throw new SyntaxError(src);
            }

            if ( ',' === cur ) {

                if ( '' === body || 0 === prm || 0 === val ) {

                    throw new SyntaxError(src);
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

        if ( prs + esc + prm ) {

            throw new SyntaxError(src);
        }

        if ( body.length ) {
            ast[ast.length] = {
                type: Route.PART_TYPE_DFT,
                body: body
            };
        }

        if ( 0 === ast.length ) {

            throw new SyntaxError(src);
        }

        return ast;
    }

});

module.exports = Route;
