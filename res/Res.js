'use strict';

var STATUS_CODES = require('http').STATUS_CODES;

var _ = require('lodash-node');
var cookie = require('cookie');
var inherit = require('inherit');
var vow = require('vow');

/**
 * @class Res
 * */
var Res = inherit(/** @lends Res.prototype */ {

    /**
     * @private
     * @memberOf {Res}
     * @method
     * */
    __constructor: function (res, params) {

        /**
         * @protected
         * @memberOF {Res}
         * @property
         * @type {http.OutgoingMessage}
         * */
        this._res = res;

        /**
         * @public
         * @memberOf {Res}
         * @property
         * @type {Object}
         * */
        this.params = _.extend({}, this.params, params);

        /**
         * @public
         * @memberOf {Res}
         * @property
         * @type {Deferred}
         * */
        this.respondDefer = vow.defer();
    },

    /**
     * @public
     * @memberOf {Res}
     * @method
     *
     * @param {String} name
     *
     * @returns {String}
     * */
    getHeader: function (name) {

        return this._res.getHeader(name);
    },

    /**
     * @public
     * @memberOf {Res}
     * @method
     *
     * @param {String} name
     * @param {*} value
     * @param {Boolean} [soft]
     *
     * @returns {Res}
     * */
    setHeader: function (name, value, soft) {

        if ( soft && this._res.getHeader(name) ) {

            return this;
        }

        name = String(name).toLowerCase();

        if ( 'set-cookie' === name ) {
            value = (this._res.getHeader(name) || []).concat(value);
        }

        this._res.setHeader(name, value);

        return this;
    },

    /**
     * @public
     * @memberOf {Res}
     * @method
     *
     * @param {Object} headers
     * @param {Boolean} [soft]
     *
     * @returns {Res}
     * */
    setHeaders: function (headers, soft) {
        _.forOwn(headers, function (value, name) {
            this.setHeader(name, value, soft);
        }, this);

        return this;
    },

    /**
     * @public
     * @memberOf {Res}
     * @method
     *
     * @param {String} name
     * @param {*} value
     * @param {Object} [opts]
     *
     * @returns {Res}
     * */
    setCookie: function (name, value, opts) {
        value = cookie.serialize(name, value, opts);

        this.setHeader('Set-Cookie', value);

        return this;
    },

    /**
     * @public
     * @memberOf {Res}
     * @method
     *
     * @returns {Number}
     * */
    getStatus: function () {

        return this._res.statusCode;
    },

    /**
     * @public
     * @memberOf {Res}
     * @method
     *
     * @param {Number} code
     *
     * @returns {Res}
     * */
    setStatus: function (code) {
        this._res.statusCode = code;

        return this;
    },

    /**
     * @public
     * @memberOf {Res}
     * @method
     *
     * @param {*} status
     * @param {*} [body]
     *
     * @returns {vow.Promise}
     * */
    respond: function (status, body) {

        if ( this.hasResponded() ) {

            return this.respondDefer.promise();
        }

        body = this.__createBody(status, body);

        this._respondPromise = vow.when(body, function (args) {
            this.__end(args[0], args[1], args[2]);
        }, function (err) {
            //  надо снова сделать respond но по-другому
            delete this._respondPromise;

            return this.respond(500, err);
        }, this);

        this.respondDefer.resolve(this._respondPromise);

        return this.respondDefer.promise();
    },

    /**
     * @public
     * @memberOf {Res}
     * @method
     *
     * @returns {Boolean}
     * */
    hasResponded: function () {

        return vow.isPromise(this._respondPromise);
    },

    /**
     * @private
     * @memberOf {Res}
     * @method
     *
     * @param {Number} status
     * @param {Object} headers
     * @param {*} data
     * */
    __end: function (status, headers, data) {
        this._res.statusCode = status;
        this.setHeaders(headers, true);
        this._res.end(data);
    },

    /**
     * @private
     * @memberOf {Res}
     * @method
     *
     * @param {Number} status
     * @param {*} body
     *
     * @returns {*}
     * */
    __createBody: function (status, body) {

        if ( void 0 === body ) {
            body = Res.getStatusMessage(status);
        }

        if ( _.isString(body) ) {

            return this.__createByString(status, body);
        }

        if ( Buffer.isBuffer(body) ) {

            return this.__createByBuffer(status, body);
        }

        if ( _.isObject(body) && _.isFunction(body.pipe) ) {

            return this.__createByReadable(status, body);
        }

        if ( body instanceof Error ) {

            return this.__createByError(status, body);
        }

        return this.__createByJson(status, body);
    },

    /**
     * @private
     * @memberOf {Res}
     * @method
     *
     * @param {Number} status
     * @param {String} body
     *
     * @returns {*}
     * */
    __createByString: function (status, body) {

        return [status, {
            'Content-Type': 'text/plain',
            'Content-Length': Buffer.byteLength(body)
        }, body];
    },

    /**
     * @private
     * @memberOf {Res}
     * @method
     *
     * @param {Number} status
     * @param {Buffer} body
     *
     * @returns {*}
     * */
    __createByBuffer: function (status, body) {

        return [status, {
            'Content-Type': 'application/octet-stream',
            'Content-Length': body.length
        }, body];
    },

    /**
     * @private
     * @memberOf {Res}
     * @method
     *
     * @param {Number} status
     * @param {Readable|EventEmitter} body
     *
     * @returns {*}
     * */
    __createByReadable: function (status, body) {

        var buf = [];
        var def = vow.defer();

        function cleanup () {
            body.removeListener('data', data);
            body.removeListener('error', error);
            body.removeListener('end', end);
            body.removeListener('close', cleanup);
        }

        function data (chunk) {

            if ( !Buffer.isBuffer(chunk) ) {
                chunk = new Buffer(String(chunk));
            }

            buf[buf.length] = chunk;
        }

        function error (err) {

            if ( 'function' === typeof body.pause ) {
                body.pause();
            }

            cleanup();
            def.reject(err);
        }

        function end () {
            cleanup();
            def.resolve(Buffer.concat(buf));
        }

        body.on('data', data);
        body.on('error', error);
        body.on('end', end);
        body.on('close', cleanup);

        return def.promise().then(function (body) {

            return this.__createByBuffer(status, body);
        }, this);
    },

    /**
     * @private
     * @memberOf {Res}
     * @method
     *
     * @param {Number} status
     * @param {Error} body
     *
     * @returns {*}
     * */
    __createByError: function (status, body) {

        if ( this.params.hideStackTrace ) {

            return this.__createByString(status, Res.
                getStatusMessage(status));
        }

        return this.__createByString(status, body.stack);
    },

    /**
     * @private
     * @memberOf {Res}
     * @method
     *
     * @param {Number} status
     * @param {*} body
     *
     * @returns {*}
     * */
    __createByJson: function (status, body) {
        body = JSON.stringify(body);

        return [status, {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
        }, body];
    }

}, {

    /**
     * @public
     * @static
     * @memberOf Res
     * @method
     *
     * @param {Number} code
     *
     * @returns {String}
     * */
    getStatusMessage: function (code) {

        return STATUS_CODES[code] || String(code);
    }

});

module.exports = Res;
