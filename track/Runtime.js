'use strict';

var STATUS_CODES = require('http').STATUS_CODES;

var REDIRECT_STATUS = [300, 301, 302,
    303, 305, 307].reduce(function (REDIRECT_STATUS, statusCode) {
        REDIRECT_STATUS[statusCode] = true;

        return REDIRECT_STATUS;
    }, Object.create(null));

var Connect = /** @type Connect */ require('./Connect');

var htmlEscape = require('../util/html/escape');

/**
 * @class Runtime
 * @extends Connect
 * */
var Runtime = Connect.extend(/** @lends Runtime.prototype */ {

    /**
     * @public
     * @memberOf {Runtime}
     * @method
     *
     * @param {String} name
     * @param {Boolean} [only]
     *
     * @returns {String|void}
     * */
    arg: function (name, only) {

        var result = this.match[name];

        if ( only ) {

            return result;
        }

        return result || this.url.query[name];
    },

    /**
     * @public
     * @memberOf {Runtime}
     * @method
     *
     * @param {String} name
     * @param {Object} [params]
     *
     * @returns {String}
     * */
    buildPath: function (name, params) {

        return this.agent.router.getRoute(name).build(params);
    },

    /**
     * @public
     * @memberOf {Runtime}
     * @method
     *
     * @param {*} [code]
     * @param {String} id
     * @param {*} [arg...]
     * */
    render: function (code, id, arg) {
        /*eslint no-unused-vars: 0*/
        var args;
        var i;

        if ( 'number' === typeof code ) {
            i = 2;

        } else {
            id = code;
            code = 200;
            i = 1;
        }

        args = Array.prototype.slice.call(arguments, i);
        this.send(code, this.agent.renderers[id].apply(this, args));
    },

    /**
     * @public
     * @memberOf {Runtime}
     * @method
     *
     * @param {*} [code]
     * @param {String} url
     * */
    redirect: function (code, url) {

        if ( 'number' === typeof code ) {

            if ( !REDIRECT_STATUS[code] ) {
                code = 302;
            }

        } else {
            url = code;
            code = 302;
        }

        this.header('Location', url);
        this.send(code, htmlEscape(url));
    },

    /**
     * @protected
     * @memberOf {Runtime}
     * @method
     *
     * @param {*} body
     * */
    _writeError: function (body) {

        if ( this._res.statusCode >= 500 ) {

            if ( this.agent.params.staging ) {
                this._writeString(STATUS_CODES[this._res.statusCode]);

                return;
            }

            this._writeString(body.stack);

            return;
        }

        this._writeJson(body);
    }

});

module.exports = Runtime;
