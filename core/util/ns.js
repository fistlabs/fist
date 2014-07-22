'use strict';

var R_WHITESPACE = /^\s+$/;

var _ = require('lodash-node');
var cache = Object.create(null);

/**
 * @param {Object} root
 * @param {String} path
 * @param {*} data
 *
 * @returns {*}
 * */
exports.add = function (root, path, data) {

    var existing = exports.use(root, path);

    if ( _.isObject(existing) ) {

        return _.extend(existing, data);
    }

    return exports.link(root, path, data);
};

/**
 * @param {Object} root
 * @param {String} path
 * @param {*} data
 *
 * @returns {*}
 * */
exports.link = function (root, path, data) {

    var i;
    var l;
    var part;
    var parts = exports.parse(path);

    for ( i = 0, l = parts.length - 1; i < l; i += 1 ) {
        part = parts[i];

        if ( _.has(root, part) ) {

            if ( !_.isObject(root[part]) ) {
                root[part] = {};
            }

        } else {
            root[part] = {};
        }

        root = root[part];
    }

    part = parts[l];
    root[part] = data;

    return root[part];
};

/**
 * @param {String} path
 *
 * @returns {*}
 *
 * @throws {SyntaxError}
 * */
exports.parse = function (path) {

    if ( path in cache ) {

        return cache[path];
    }

    cache[path] = parse(path);

    return cache[path];
};

/**
 * @param {Object} root
 * @param {String} path
 *
 * @returns {*}
 * */
exports.use = function (root, path) {

    var i;
    var l;
    var parts = exports.parse(path);

    for ( i = 0, l = parts.length; i < l; i += 1 ) {

        if ( _.isObject(root) ) {
            root = root[parts[i]];

            continue;
        }

        return void 0;
    }

    return root;
};

/**
 * @param {String} path
 *
 * @returns {Array<String>}
 * */
function parse (path) {
    /*eslint complexity: [2, 13] */
    var cur;
    var index;
    var isEscape = false;
    var isChunk = true;
    var chunk = '';
    var parts = [];

    /* eslint no-cond-assign: 0 */
    for ( index = 0; cur = path.charAt(index); index += 1 ) {

        if ( '\\' === cur && !isEscape ) {
            isEscape = true;

            continue;
        }

        if ( isEscape ) {

            if ( !isChunk ) {

                throw new SyntaxError(path);
            }

            chunk += cur;
            isEscape = false;

            continue;
        }

        if ( !isChunk ) {

            if ( isSpace(cur) ) {

                continue;
            }

            if ( '.' === cur ) {
                chunk = '';
                isChunk = true;

                continue;
            }

            throw new SyntaxError(path);
        }

        if ( isSpace(cur) ) {

            if ( chunk.length ) {
                parts.push(chunk);
                isChunk = false;
            }

            continue;
        }

        if ( '.' === cur ) {
            parts.push(chunk);
            isChunk = false;
            index -= 1;

            continue;
        }

        chunk += cur;
    }

    if ( isEscape ) {

        throw new SyntaxError(path);
    }

    if ( isChunk ) {
        parts.push(chunk);
    }

    return parts;
}

/**
 * @param {String} str
 *
 * @returns {Boolean}
 * */
function isSpace (str) {

    return R_WHITESPACE.test(str);
}
