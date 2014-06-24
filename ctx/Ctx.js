'use strict';

var R_WHITESPACE = /^\s+$/;

var _ = require('lodash-node');
var cache = Object.create(null);
var inherit = require('inherit');
var vow = require('vow');

/**
 * @class Ctx
 * @extends Deferred
 * */
var Ctx = inherit(vow.Deferred, /** @lends Ctx.prototype */ {

    /**
     * @protected
     * @memberOf {Ctx}
     * @method
     *
     * @param {Object} [params]
     *
     * @constructs
     * */
    __constructor: function (params) {
        this.__base();

        /**
         * @public
         * @memberOf {Ctx}
         * @property
         * @type {Object}
         * */
        this.ers = this.errors = {};

        /**
         * @public
         * @memberOf {Ctx}
         * @property
         * @type {Object}
         * */
        this.res = this.result = {};

        /**
         * @public
         * @memberOf {Ctx}
         * @property
         * @type {Object}
         * */
        this.params = _.extend({}, this.params, params);
    },

    /**
     * @public
     * @static
     * @memberOf Ctx.prototype
     * @property
     * @type {Object}
     * */
    params: {},

    /**
     * @public
     * @memberOf {Ctx}
     * @method
     *
     * @param {String} path
     *
     * @returns {*}
     * */
    getRes: function (path) {

        return Ctx.use(this.res, path);
    },

    /**
     * @public
     * @memberOf {Ctx}
     * @method
     *
     * @param {String} path
     *
     * @returns {*}
     * */
    getErr: function (path) {

        return Ctx.use(this.ers, path);
    },

    /**
     * @public
     * @memberOf {Ctx}
     * @method
     *
     * @param {String} path
     * @param {*} data
     * */
    setRes: function (path, data) {

        return Ctx.add(this.res, path, data);
    },

    /**
     * @public
     * @memberOf {Ctx}
     * @method
     *
     * @param {String} path
     * @param {*} data
     * */
    setErr: function (path, data) {

        return Ctx.add(this.ers, path, data);
    },

    /**
     * @public
     * @memberOf {Ctx}
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
    }

}, {

    /**
     * @public
     * @memberOf Ctx
     * @method
     *
     * @param {Object} root
     * @param {String} path
     * @param {*} data
     * */
    add: function (root, path, data) {

        var existingData = Ctx.use(root, path);

        if ( _.isObject(existingData) ) {

            return _.extend(existingData, data);
        }

        return Ctx.link(root, path, data);
    },

    /**
     * @public
     * @static
     * @memberOf Ctx
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
        var parts = this.parsePath(path);

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
     * @memberOf Ctx
     *
     * @param {String} path
     *
     * @returns {?}
     *
     * @throws {SyntaxError}
     * */
    parsePath: function (path) {

        if ( path in cache ) {

            return cache[path];
        }

        cache[path] = parse(path);

        return cache[path];
    },

    /**
     * @public
     * @static
     * @memberOf Ctx
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
        var parts = this.parsePath(path);

        for ( i = 0, l = parts.length; i < l; i += 1 ) {

            if ( _.isObject(root) ) {
                root = root[parts[i]];

                continue;
            }

            return void 0;
        }

        return root;
    }

});

/**
 * @private
 * @static
 * @memberOf Ctx
 * @method
 *
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
 * @private
 * @memberOf {Ctx}
 * @method
 *
 * @param {String} str
 *
 * @returns {Boolean}
 * */
function isSpace (str) {

    return R_WHITESPACE.test(str);
}

module.exports = Ctx;
