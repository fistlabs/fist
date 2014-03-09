'use strict';

var R_SEPARATOR = /[;,]\s*/;
var R_QUOTED = /^"(?:\\[\s\S]|[^"])+"$/;
var R_ESCCHAR = /\\([\s\S])/g;

/**
 * @param {*} cookies
 *
 * @returns {Object}
 * */
module.exports = function (cookies) {

    var i;
    var l;
    var e;
    var name;
    var cookie;
    var result = Object.create(null);

    if ( 'string' !== typeof cookies ) {

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
};
