'use strict';

var R_MULTIPART =
    /^multipart\/[^\s]+?;[\s\r\n]+boundary=(?:"([^"]+)"|([^\s]+))$/i;
var R_JSON = /^application\/(?:(?:[-\w\.]+\+)?json|json\+[-\w\.]+)(?:;|$)/i;
var R_URLENCODED = /^application\/x-www-form-urlencoded(?:;|$)/i;

var QueryString = /** @type QueryString */ require('querystring');
var Parser = /** @type Parser */ require('./Parser');
var Raw = /** @type Raw */ require('./Raw');
var Urlencoded = /** @type Urlencoded */ require('./Urlencoded');
var Json = /** @type Json */ require('./Json');
var Multipart = /** @type Multipart */ require('./Multipart');

/**
 * @class Body
 * @extends Parser
 * */
var Body = Parser.extend(/** @lends Body.prototype */ {

    /**
     * @protected
     * @memberOf {Body}
     * @method
     *
     * @constructs
     * */
    constructor: function (req, params) {
        this._parser = this._getParser(req, params);
    },

    /**
     * @protected
     * @memberOf {Body}
     * @method
     *
     * @param {Object} stream
     * @param {Object} params
     *
     * @returns {Parser}
     * */
    _getParser: function (stream, params) {

        var boundary;
        var parser;

        if ( Body.hasBody(stream) ) {

            if ( Body.isUrlencoded(stream) ) {

                return new Urlencoded(stream, params);
            }

            if ( Body.isJSON(stream) ) {

                return new Json(stream, params);
            }

            boundary = Body.isMultipart(stream);

            if ( boundary ) {
                parser =  new Multipart(stream, params);
                parser.params.boundary = boundary;

                return parser;
            }

            return new Raw(stream, params);
        }

        return new Parser(stream, params);
    },

    /**
     * @public
     * @memberOf {Body}
     * @method
     *
     * @param {Function} done
     * @param {*} [ctxt]
     * */
    parse: function (done, ctxt) {
        this._parser.parse(done, ctxt);
    }

}, /** @lends Body */ {

    /**
     * @public
     * @static
     * @memberOf Body
     * @method
     *
     * @param {Object} req
     *
     * @returns {Boolean}
     * */
    hasBody: function (req) {

        var length = req.headers['content-length'];

        return 'string' === typeof req.headers['transfer-encoding'] ||
            'string' === typeof length && '0' !== length;
    },

    /**
     * @public
     * @static
     * @memberOf Body
     *
     * @param {Object} req
     *
     * @returns {Boolean}
     * */
    isUrlencoded: function (req) {

        return R_URLENCODED.test(req.headers['content-type']);
    },

    /**
     * @public
     * @static
     * @memberOf Body
     * @method
     *
     * @param {Object} req
     *
     * @returns {Boolean}
     * */
    isJSON: function (req) {

        return R_JSON.test(req.headers['content-type']);
    },

    /**
     * @public
     * @static
     * @memberOf Body
     * @method
     *
     * @param {Object} req
     *
     * @returns {*}
     * */
    isMultipart: function (req) {

        var m = R_MULTIPART.exec(req.headers['content-type']);

        if ( null === m ) {

            return m;
        }

        return m[1] || m[2];
    }

});

module.exports = Body;
