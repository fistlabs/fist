'use strict';

var R_WHITESPACE = /^\s+$/;

var _ = require('lodash-node');
var cache = Object.create(null);
var inherit = require('inherit');
var vow = require('vow');

/**
 * @class Ctx
 * */
var Ctx = inherit(/** @lends Ctx.prototype */ {

    /**
     * @protected
     * @memberOf {Ctx}
     * @method
     *
     * @param {Track} track
     * @param {String} path
     * @param {Object} [params]
     *
     * @constructs
     * */
    __constructor: function (track, path, params) {

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
        this.params = params || {};

        /**
         * @public
         * @memberOf {Ctx}
         * @property
         * @type {Track}
         * */
        this.track = track;

        /**
         * @private
         * @memberOf {Ctx}
         * @property
         * @type {String}
         * */
        this.path = path;

        /**
         * @private
         * @memberOf {Ctx}
         * @property
         * @type {Date}
         * */
        this.__creationDate = new Date();
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
     * @param {Array<String>} deps
     *
     * @returns {vow.Promise}
     * */
    append: function (deps) {
        deps = _.map(deps, this.__resolveAndSet, this);

        return vow.allResolved(deps);
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
     * @param {*} data
     * */
    notify: function (data) {

        return this.trigger('ctx:notify', data);
    },

    /**
     * @public
     * @memberOf {Ctx}
     * @method
     *
     * @param {String} event
     * @param {*} [data]
     * */
    trigger: function (event, data) {
        this.track.agent.emit(event, {
            path: this.path,
            data: data,
            time: new Date() - this.__creationDate,
            trackId: this.track.id
        });
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
     * @private
     * @memberOf {Ctx}
     * @method
     *
     * @param {String} path
     *
     * @returns {vow.Promise}
     * */
    __resolveAndSet: function (path) {

        var promise = this.track.invoke(path, this.params);

        promise.done(function (data) {
            this.setRes(path, data);
        }, function (data) {
            this.setErr(path, data);
        }, this);

        return promise;
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

        cache[path] = parsePath(path);

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
function parsePath (path) {
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
