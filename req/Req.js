'use strict';

var AttachParser = require('attach-parser');
var Url = require('fast-url-parser');

var _ = require('lodash-node');
var cookie = require('cookieparser');
var inherit = require('inherit');
var mediaTyper = require('media-typer');
var vow = require('vow');

/**
 * @class Req
 * */
var Req = inherit(/** @lends Req.prototype */ {

    /**
     * @private
     * @memberOf {Req}
     * @method
     *
     * @constructs
     *
     * @param {http.IncomingMessage} req
     * @param {Object} [params]
     * */
    __constructor: function (req, params) {

        /**
         * @private
         * @memberOf {Req}
         * @property
         * @type {http.IncomingMessage}
         * */
        this._req = req;

        /**
         * @public
         * @memberOf {Req}
         * @property
         * @type {Object}
         * */
        this.params = params || {};
    },

    /**
     * @public
     * @memberOf {Req}
     * @method
     *
     * @param {String} name
     *
     * @returns {String}
     * */
    getHeader: function (name) {

        return this.getHeaders()[ String(name).toLowerCase() ];
    },

    /**
     * @public
     * @memberOf {Req}
     * @method
     *
     * @returns {Object}
     * */
    getHeaders: function () {

        return this._req.headers;
    },

    /**
     * @public
     * @memberOf {Req}
     * @method
     *
     * @param {String} name
     *
     * @returns {String}
     * */
    getCookie: function (name) {

        return this.getCookies()[name];
    },

    /**
     * @public
     * @memberOf {Req}
     * @method
     *
     * @returns {Object}
     * */
    getCookies: function () {

        if ( !this.__cookie ) {
            this.__cookie = cookie.parse(this.getHeader('Cookie') || '');
        }

        return this.__cookie;
    },

    /**
     * Возвращает body в разобранном виде
     *
     * @public
     * @memberOf {Req}
     * @method
     *
     * @returns {vow.Promise}
     * */
    getBody: function () {

        var self = this;

        if ( !vow.isPromise(this.__body) ) {
            this.__body = vow.invoke(function () {

                var header = self._req.headers;
                var params = header['content-type'];

                if ( params ) {
                    //  may throw an exception
                    params = mediaTyper.parse(params);

                } else {
                    params = {};
                }

                params = _.extend(params, {
                    length: header['content-length']
                }, self.params.body);

                return self._createBodyParser(params).parse(self._req);
            });
        }

        return this.__body;
    },

    /**
     * @public
     * @memberOf {Req}
     * @method
     *
     * @returns {Object}
     * */
    getUrl: function () {
        var headers = this._req.headers;
        var host = headers['x-forwarded-host'] || headers.host;
        var protocol = this._req.socket.encrypted ?
            'https' : headers['x-forwarded-proto'] || 'http';

        return Url.parse(protocol + '://' + host + this._req.url, true);
    },

    /**
     * @protected
     * @memberOf {Req}
     * @method
     *
     * @param {Object} [params]
     *
     * @returns {AttachParser}
     * */
    _createBodyParser: function (params) {

        return new AttachParser(params);
    }

});

module.exports = Req;
