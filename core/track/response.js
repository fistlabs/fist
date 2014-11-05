'use strict';

var R_SET_COOKIE_HEADER = /^set-cookie$/i;
var STATUS_CODES = require('http').STATUS_CODES;

var Respond = /** @type Respond */ require('../control/respond');

var _ = require('lodash-node');
var cookie = require('cookieparser');
var inherit = require('inherit');
var vow = require('vow');

/**
 * @class Response
 * */
var Response = inherit(/** @lends Response.prototype */ {

    /**
     * @private
     * @memberOf {Response}
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
         * @memberOf {Response}
         * @property
         * @type {Object}
         * */
        this.params = params || {};

        /**
         * @protected
         * @memberOF {Response}
         * @property
         * @type {OutgoingMessage}
         * */
        this._res = res;
    },

    /**
     * @public
     * @memberOf {Response}
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
     * @memberOf {Response}
     * @method
     *
     * @param {String} name
     * @param {*} value
     * @param {Boolean} [soft]
     *
     * @returns {Response}
     * */
    setHeader: function (name, value, soft) {
        Response.__setHeaderOn(this._res, name, value, soft);

        return this;
    },

    /**
     * @public
     * @memberOf {Response}
     * @method
     *
     * @param {Object} headers
     * @param {Boolean} [soft]
     *
     * @returns {Response}
     * */
    setHeaders: function (headers, soft) {
        Response.__setHeadersOn(this._res, headers, soft);

        return this;
    },

    /**
     * @public
     * @memberOf {Response}
     * @method
     *
     * @param {String} name
     * @param {*} value
     * @param {Object} [opts]
     *
     * @returns {Response}
     * */
    setCookie: function (name, value, opts) {
        value = cookie.serialize(name, value, opts);
        this.setHeader('Set-Cookie', value);

        return this;
    },

    /**
     * @public
     * @memberOf {Response}
     * @method
     *
     * @returns {Number}
     * */
    getStatus: function () {

        return this._res.statusCode;
    },

    /**
     * @public
     * @memberOf {Response}
     * @method
     *
     * @param {Number} code
     *
     * @returns {Response}
     * */
    setStatus: function (code) {
        this._res.statusCode = code;

        return this;
    },

    /**
     * @public
     * @memberOf {Response}
     * @method
     *
     * @returns {vow.Promise}
     * */
    respond: function (status, body) {
        body = this.__createResp(status, body);

        return vow.when(body, null, function (data) {

            return this.respond(500, data);
        }, this);
    },

    /**
     * @private
     * @memberOf {Response}
     * @method
     *
     * @param {Number} status
     * @param {*} body
     *
     * @returns {*}
     * */
    __createResp: function (status, body) {
        /*eslint complexity: [2, 8] */
        if (_.isUndefined(body)) {

            return this.__createByUndefined(status);
        }

        if (_.isString(body)) {

            return this.__createByString(status, body);
        }

        if (Buffer.isBuffer(body)) {

            return this.__createByBuffer(status, body);
        }

        if (_.isObject(body) && _.isFunction(body.pipe)) {

            return this.__createByReadable(status, body);
        }

        if (body instanceof Error) {

            return this.__createByError(status, body);
        }

        if (vow.isPromise(body)) {

            return this.__createByPromise(status, body);
        }

        if (body instanceof Respond) {

            return this.__createByResp(status, body);
        }

        return this.__createByJson(status, body);
    },

    /**
     * @private
     * @memberOf {Response}
     * @method
     *
     * @param {Number} status
     * @param {Buffer} body
     *
     * @returns {*}
     * */
    __createByBuffer: function (status, body) {

        return new Respond(status, {
            'Content-Type': 'application/octet-stream',
            'Content-Length': body.length
        }, body);
    },

    /**
     * @private
     * @memberOf {Response}
     * @method
     *
     * @param {Number} status
     * @param {Error} body
     *
     * @returns {*}
     * */
    __createByError: function (status, body) {

        if (this.params.hideStackTrace) {

            return this.__createByJson(status, body);
        }

        if (_.isString(body.stack)) {

            return this.__createByString(status, body.stack);
        }

        return this.__createByString(status, String(body));
    },

    /**
     * @private
     * @memberOf {Response}
     * @method
     *
     * @param {Number} status
     * @param {*} body
     *
     * @returns {*}
     * */
    __createByJson: function (status, body) {
        body = JSON.stringify(body);

        return new Respond(status, {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
        }, body);
    },

    /**
     * @private
     * @memberOf {Response}
     * @method
     *
     * @param {Number} status
     * @param {Buffer} body
     *
     * @returns {vow.Promise}
     * */
    __createByPromise: function (status, body) {

        return vow.when(body, function (body) {

            return this.__createResp(status, body);
        }, this);
    },

    /**
     * @private
     * @memberOf {Response}
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

        function cleanup() {
            body.removeListener('data', data);
            body.removeListener('error', error);
            body.removeListener('end', end);
            body.removeListener('close', cleanup);
        }

        function data(chunk) {

            if (!Buffer.isBuffer(chunk)) {
                chunk = new Buffer(String(chunk));
            }

            buf[buf.length] = chunk;
        }

        function error(err) {

            if (_.isFunction(body.pause)) {
                body.pause();
            }

            cleanup();
            def.reject(err);
        }

        function end() {
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
     * @memberOf {Response}
     * @method
     *
     * @param {Number} status
     * @param {Respond} body
     *
     * @returns {Respond}
     * */
    __createByResp: function (status, body) {

        if (!_.isNumber(status)) {
            status = body.status;
        }

        return new Respond(status, body.header, body.body);
    },

    /**
     * @private
     * @memberOf {Response}
     * @method
     *
     * @param {Number} status
     * @param {String} body
     *
     * @returns {*}
     * */
    __createByString: function (status, body) {

        return new Respond(status, {
            'Content-Type': 'text/plain',
            'Content-Length': Buffer.byteLength(body)
        }, body);
    },

    /**
     * @private
     * @memberOf {Response}
     * @method
     *
     * @returns {*}
     * */
    __createByUndefined: function (status, body) {

        if (!_.isNumber(status)) {
            status = this._res.statusCode;
        }

        body = Response.getDefaultBody(status);

        return this.__createByString(status, body);
    }

}, {

    /**
     * @public
     * @static
     * @memberOf Response
     * @method
     *
     * @param {OutgoingMessage} res
     * @param {Respond} resp
     * */
    end: function (res, resp) {

        if (_.isNumber(resp.status)) {
            res.statusCode = resp.status;
        }

        Response.__setHeadersOn(res, resp.header, true);
        res.end(resp.body);
    },

    /**
     * @public
     * @static
     * @memberOf Response
     * @method
     *
     * @param {Number} status
     *
     * @returns {String}
     * */
    getDefaultBody: function (status) {

        return STATUS_CODES[status] || String(status);
    },

    /**
     * @private
     * @static
     * @memberOf Response
     * @method
     *
     * @param {OutgoingMessage} res
     * @param {String} name
     * @param {*} value
     * @param {Boolean} [soft]
     * */
    __setHeaderOn: function (res, name, value, soft) {

        if (soft && res.getHeader(name)) {

            return;
        }

        if (R_SET_COOKIE_HEADER.test(name)) {
            value = (res.getHeader(name) || []).concat(value);
        }

        res.setHeader(name, value);
    },

    /**
     * @private
     * @static
     * @memberOf Response
     * @method
     *
     * @param {OutgoingMessage} res
     * @param {Object} headers
     * @param {Boolean} [soft]
     * */
    __setHeadersOn: function (res, headers, soft) {
        _.forEach(headers, function (value, name) {
            Response.__setHeaderOn(res, name, value, soft);
        });
    }

});

module.exports = Response;
