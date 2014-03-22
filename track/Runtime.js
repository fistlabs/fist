'use strict';

var STATUS_CODES = require('http').STATUS_CODES;
var Connect = /** @type Connect */ require('./Connect');

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
