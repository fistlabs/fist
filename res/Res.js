'use strict';

var R_SET_COOKIE_HEADER = /^set-cookie$/i;
var STATUS_CODES = require('http').STATUS_CODES;
var RespResolver = /** @type RespResolver */ require('../util/resp-resolver');

var _ = require('lodash-node');
var cookie = require('cookieparser');
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
     *
     * @constructs
     *
     * @param {OutgoingMessage} res
     * @param {*} [params]
     * */
    __constructor: function (res, params) {

        /**
         * @public
         * @memberOf {Res}
         * @property
         * @type {Object}
         * */
        this.params = params || {};

        /**
         * @protected
         * @memberOF {Res}
         * @property
         * @type {http.OutgoingMessage}
         * */
        this._res = res;
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
        Res.__setHeaderOn(this._res, name, value, soft);

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
        Res.__setHeadersOn(this._res, headers, soft);

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
     * @returns {vow.Promise}
     * */
    respond: function (status, body) {
        this.setStatus(status);

        body = this.__createBody(body);

        return vow.when(body, null, function (data) {

            return this.respond(500, data);
        }, this);
    },

    /**
     * @private
     * @memberOf {Res}
     * @method
     *
     * @param {*} body
     *
     * @returns {*}
     * */
    __createBody: function (body) {

        if ( _.isUndefined(body) ) {

            return this.__createByUndefined();
        }

        if ( _.isString(body) ) {

            return this.__createByString(body);
        }

        if ( Buffer.isBuffer(body) ) {

            return this.__createByBuffer(body);
        }

        if ( _.isObject(body) && _.isFunction(body.pipe) ) {

            return this.__createByReadable(body);
        }

        if ( body instanceof Error ) {

            return this.__createByError(body);
        }

        return this.__createByJson(body);
    },

    /**
     * @private
     * @static
     * @memberOf Res
     * @method
     *
     * @param {Buffer} body
     *
     * @returns {*}
     * */
    __createByBuffer: function (body) {

        return new RespResolver({
            'Content-Type': 'application/octet-stream',
            'Content-Length': body.length
        }, body);
    },

    /**
     * @private
     * @memberOf {Res}
     * @method
     *
     * @returns {*}
     * */
    __createByError: function (body) {

        if ( this.params.hideStackTrace ) {

            return this.__createByJson(body);
        }

        return this.__createByString(body.stack);
    },

    /**
     * @private
     * @static
     * @memberOf Res
     * @method
     *
     * @param {*} body
     *
     * @returns {*}
     * */
    __createByJson: function (body) {
        body = JSON.stringify(body);

        return new RespResolver({
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
        }, body);
    },

    /**
     * @private
     * @static
     * @memberOf Res
     * @method
     *
     * @param {Readable|EventEmitter} body
     *
     * @returns {*}
     * */
    __createByReadable: function (body) {

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

        return def.promise().then(this.__createByBuffer, this);
    },

    /**
     * @private
     * @memberOf {Res}
     * @method
     *
     * @param {String} body
     *
     * @returns {*}
     * */
    __createByString: function (body) {

        return new RespResolver({
            'Content-Type': 'text/plain',
            'Content-Length': Buffer.byteLength(body)
        }, body);
    },

    /**
     * @private
     * @memberOf {Res}
     * @method
     *
     * @returns {*}
     * */
    __createByUndefined: function (body) {
        body = Res.getStatusMessage(this._res.statusCode);

        return this.__createByString(body);
    }

}, {

    /**
     * @public
     * @static
     * @memberOf Res
     * @method
     *
     * @param {OutgoingMessage} res
     * @param {RespResolver} resp
     * */
    end: function (res, resp) {
        Res.__setHeadersOn(res, resp.header, true);
        res.end(resp.body);
    },

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
    },

    /**
     * @private
     * @static
     * @memberOf Res
     * @method
     *
     * @param {OutgoingMessage} res
     * @param {String} name
     * @param {*} value
     * @param {Boolean} [soft]
     * */
    __setHeaderOn: function (res, name, value, soft) {

        if ( soft && res.getHeader(name) ) {

            return;
        }

        if ( R_SET_COOKIE_HEADER.test(name) ) {
            value = (res.getHeader(name) || []).concat(value);
        }

        res.setHeader(name, value);
    },

    /**
     * @private
     * @static
     * @memberOf Res
     * @method
     *
     * @param {OutgoingMessage} res
     * @param {Object} headers
     * @param {Boolean} [soft]
     * */
    __setHeadersOn: function (res, headers, soft) {
        _.forEach(headers, function (value, name) {
            Res.__setHeaderOn(res, name, value, soft);
        });
    }

});

module.exports = Res;
