'use strict';

var R_SEPARATOR = /[;,]\s*/;
var R_QUOTED = /^"(?:\\[\s\S]|[^"])+"$/;
var R_ESCCHAR = /\\([\s\S])/g;

var _ = require('lodash-node');
var inherit = require('inherit');

/**
 * @class Cookie
 * @extends Base
 * */
var Cookie = inherit(/** @lends Cookie.prototype */ {

    /**
     * @public
     * @memberOf {Cookie}
     * @method
     *
     * @param {*} cookies
     *
     * @returns {Object}
     * */
    parse: function (cookies) {

        var i;
        var l;
        var e;
        var name;
        var cookie;
        var result = {};

        if ( !_.isString(cookies) ) {

            return result;
        }

        cookies = cookies.split(R_SEPARATOR);

        for ( i = 0, l = cookies.length; i < l; i += 1 ) {
            cookie = cookies[i];
            e = cookie.indexOf('=');

            if ( -1 === e ) {

                continue;
            }

            name = cookie.slice(0, e).trim();
            cookie = cookie.slice(e + 1, cookie.length).trim();

            if ( R_QUOTED.test(cookie) ) {
                //  unquote, unescape
                cookie = cookie.slice(1, -1).replace(R_ESCCHAR, '$1');
            }

            result[name] = cookie;
        }

        return result;
    },

    /**
     * @public
     * @memberOf {Cookie}
     * @method
     *
     * @param {String} name
     * @param {String} value
     * @param {Object} [opts]
     *
     * @returns {String}
     * */
    serialize: function (name, value, opts) {
        /*eslint complexity: [2,9]*/
        var expires;
        var buf = [name + '=' + value];

        if ( !_.isObject(opts) ) {

            return buf[0];
        }

        if ( opts.domain ) {
            buf[buf.length] = 'domain=' + opts.domain;
        }

        if ( opts.path ) {
            buf[buf.length] = 'path=' + opts.path;
        }

        if ( opts.expires || 0 === opts.expires ) {
            expires = Cookie._buildGMTTime(opts.expires);

            if ( _.isString(expires) ) {
                buf[buf.length] = 'expires=' + expires;
            }
        }

        if ( opts.secure ) {
            buf[buf.length] = 'secure';
        }

        if ( opts.httpOnly ) {
            buf[buf.length] = 'httponly';
        }

        return buf.join('; ');
    }

}, {

    /**
     * @protected
     * @static
     * @memberOf Cookie
     * @method
     *
     * @param {*} expires
     *
     * @returns {String}
     * */
    _buildGMTTime: function (expires) {

        if ( _.isNumber(expires) ) {
            expires = new Date(Date.now() + expires);

        } else {

            if ( !(expires instanceof Date) ) {
                expires = new Date(expires);
            }
        }

        //  Invalid Date
        if ( isNaN(expires.getTime()) ) {

            return null;
        }

        return expires.toUTCString();
    }

});

module.exports = Cookie;
