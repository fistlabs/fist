'use strict';

var R_WHITESPACE = /^\s+$/;

var Class = /** @type Class */ require('parent/Class');
var vow = /** @type vow */ require('vow');

var _ = require('lodash-node');
var cache = Object.create(null);

/**
 * @class Context
 * @extends Deferred
 * */
var Context = Class.extend.call(vow.Deferred, /** @lends Context.prototype */ {

    /**
     * @protected
     * @memberOf {Context}
     * @method
     *
     * @constructs
     * */
    constructor: function () {
        Context.Parent.apply(this, arguments);

        /**
         * @public
         * @memberOf {Context}
         * @property
         * @type {Object}
         * */
        this.ers = this.errors = {};

        /**
         * @public
         * @memberOf {Context}
         * @property
         * @type {Object}
         * */
        this.res = this.result = {};
    },

    /**
     * @public
     * @memberOf {Context}
     * @method
     *
     * @param {String} path
     * @param {*} data
     * */
    setResult: function (path, data) {
        this._link(this.res, path, data);
    },

    /**
     * @public
     * @memberOf {Context}
     * @method
     *
     * @param {String} path
     * @param {*} data
     * */
    setError: function (path, data) {
        this._link(this.ers, path, data);
    },

    /**
     * @public
     * @memberOf {Context}
     * @method
     *
     * @returns {Function}
     * */
    getResolver: function () {

        var self = this;

        return function (err, res) {

            if ( 2 > arguments.length ) {
                self.reject(err);

                return;
            }

            self.resolve(res);
        };
    },

    /**
     * @protected
     * @memberOf {Context}
     * @method
     *
     * @param {Object} root
     * @param {String} path
     * @param {*} data
     * */
    _link: function (root, path, data) {

        var existingData = Context.use(root, path);

        if ( _.isObject(existingData) ) {
            _.extend(existingData, data);

            return;
        }

        Context.link(root, path, data);
    }

}, {

    /**
     * @public
     * @static
     * @memberOf Context
     *
     * @param {String} path
     *
     * @returns {?}
     *
     * @throws {SyntaxError}
     * */
    parsePath: function (path) {
        /*eslint complexity: [2, 14] */
        var cur;
        var index;
        var isEscape;
        var isChunk;
        var chunk;
        var parts;

        if ( path in cache ) {

            return cache[path];
        }

        isEscape = false;
        isChunk = true;
        chunk = '';
        parts = [];

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

                if ( Context._isSpace(cur) ) {

                    continue;
                }

                if ( '.' === cur ) {
                    chunk = '';
                    isChunk = true;

                    continue;
                }

                throw new SyntaxError(path);
            }

            if ( Context._isSpace(cur) ) {

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

        cache[path] = parts;

        return parts;
    },

    /**
     * @public
     * @static
     * @memberOf Context
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
        var parts = Context.parsePath(path);

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
    },

    /**
     * @public
     * @static
     * @memberOf Context
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
        var parts = Context.parsePath(path);

        for ( i = 0, l = parts.length; i < l; i += 1 ) {

            if ( _.isObject(root) ) {
                root = root[parts[i]];

                continue;
            }

            return void 0;
        }

        return root;
    },

    /**
     * @private
     * @memberOf {Context}
     * @method
     *
     * @param {String} str
     *
     * @returns {Boolean}
     * */
    _isSpace: function (str) {

        return R_WHITESPACE.test(str);
    }

});

module.exports = Context;
