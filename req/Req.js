'use strict';

var BodyParser = require('../util/BodyParser');
var ContentType = require('../util/ContentType');
var Url = require('url');

var _ = require('lodash-node');
var cookie = require('cookie');
var inherit = require('inherit');
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
        this.params = _.extend({}, this.params, params);
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

        var headers;
        var params;

        if ( !vow.isPromise(this.__body) ) {
            headers = this._req.headers;
            params = new ContentType(headers['content-type']).toParams();
            params = _.extend(params, this.params.body, {
                length: headers['content-length']
            });

            this.__body = this._createBodyParser(params).parse(this._req);
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
        var url = Url.parse(this._req.url);
        var value = headers['x-forwarded-host'] || headers.host;

        url.host = value.split(/\s*,\s*/)[0];

        if ( this._req.socket.encrypted ) {
            value = 'https';

        } else {
            value = headers['x-forwarded-proto'] || 'http';
        }

        url.protocol = value;
        url = Url.format(url);

        return Url.parse(url, true);
    },

    /**
     * @protected
     * @memberOf {Req}
     * @method
     *
     * @param {Object} [params]
     *
     * @returns {BodyParser}
     * */
    _createBodyParser: function (params) {

        return new BodyParser(params);
    }

});

module.exports = Req;
