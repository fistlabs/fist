'use strict';

var RE_WHITESPACE = /^\s+$/;

var Bundle = /** @type Bundle */ require('./Bundle');

var _assign = require('lodash.assign');
var cache = Object.create(null);
var hasProperty = Object.prototype.hasOwnProperty;

/**
 * @class Nested
 * @extends Bundle
 * */
var Nested = Bundle.extend(/** @lends Nested.prototype */ {

    /**
     * @protected
     * @memberOf {Nested}
     * @method
     *
     * @param {Object} root
     * @param {String} path
     * @param {*} data
     * */
    _link: function (root, path, data) {

        var nmsp = Nested.use(root, path);

        if ( Object(nmsp) === nmsp ) {
            _assign(nmsp, data);

            return;
        }

        Nested.link(root, path, data);
    }

}, {

    /**
     * @public
     * @static
     * @memberOf Nested
     *
     * @param {String} path
     *
     * @returns {?}
     *
     * @throws {SyntaxError}
     * */
    parse: function (path) {
        /*eslint complexity: [2, 14] */
        var cursor;
        var i;
        var isEscaped;
        var isPart;
        var l;
        var part;
        var parts;

        if ( path in cache ) {

            return cache[path];
        }

        isEscaped = 0;
        isPart = 1;
        part = '';
        parts = [];

        for ( i = 0, l = path.length; i < l; i += 1 ) {
            cursor = path.charAt(i);

            if ( '\\' === cursor && 0 === isEscaped ) {
                isEscaped = 1;

                continue;
            }

            if ( 1 === isEscaped ) {

                if ( 0 === isPart ) {

                    throw new SyntaxError(path);
                }

                part += cursor;
                isEscaped = 0;

                continue;
            }

            if ( 0 === isPart ) {

                if ( RE_WHITESPACE.test(cursor) ) {

                    continue;
                }

                if ( '.' === cursor ) {
                    part = '';
                    isPart = 1;

                    continue;
                }

                throw new SyntaxError(path);
            }

            if ( RE_WHITESPACE.test(cursor) ) {

                if ( 0 < part.length ) {
                    parts[parts.length] = part;
                    isPart = 0;
                }

                continue;
            }

            if ( '.' === cursor ) {
                parts[parts.length] = part;
                isPart = 0;
                i -= 1;

                continue;
            }

            part += cursor;
        }

        if ( 1 === isEscaped ) {

            throw new SyntaxError(path);
        }

        if ( 1 === isPart ) {
            parts[parts.length] = part;
        }

        cache[path] = parts;

        return parts;
    },

    /**
     * @public
     * @static
     * @memberOf Nested
     *
     * @method
     *
     * @param {Object} root
     * @param {String} path
     * @param {*} data
     *
     * @returns {*}
     * */
    link: function (root, path, data) {

        var i;
        var l;
        var part;
        var parts = Nested.parse(path);

        for ( i = 0, l = parts.length - 1; i < l; i += 1 ) {
            part = parts[i];

            if ( hasProperty.call(root, part) ) {

                if ( Object(root[part]) !== root[part] ) {
                    root[part] = Object.create(null);
                }

            } else {
                root[part] = Object.create(null);
            }

            root = root[part];
        }

        part = parts[l];
        root[part] = data;

        return root[part];
    },

    /**
     * @public
     * @static
     * @memberOf Nested
     *
     * @method
     *
     * @param {Object} root
     * @param {String} path
     *
     * @returns {*}
     * */
    use: function (root, path) {

        var i;
        var l;
        var parts = Nested.parse(path);

        for ( i = 0, l = parts.length; i < l; i += 1 ) {

            if ( Object(root) === root ) {
                root = root[parts[i]];

                continue;
            }

            return void 0;
        }

        return root;
    }
});

module.exports = Nested;
