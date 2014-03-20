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
     * @param {Object} stream
     * @param {Object} params
     *
     * @returns {Object}
     * */
    _getParser: function (stream, params) {

        var boundary;
        var parser;

        if ( Body.hasBody(stream) ) {

            if ( Body.isUrlencoded(stream) ) {

                return {
                    parser: new Urlencoded(params),
                    template: function (res) {

                        return {
                            input: res,
                            type: 'urlencoded'
                        };
                    }
                };
            }

            if ( Body.isJSON(stream) ) {

                return {
                    parser: new Json(params),
                    template: function (res) {

                        return {
                            input: res,
                            type: 'json'
                        };
                    }
                };
            }

            boundary = Body.isMultipart(stream);

            if ( boundary ) {
                parser =  new Multipart(params);
                parser.params.boundary = boundary;

                return {
                    parser: parser,
                    template: function (res) {

                        return {
                            input: res[0],
                            files: res[1],
                            type: 'multipart'
                        };
                    }
                };
            }

            return {
                parser: new Raw(params),
                template: function (res) {

                    return {
                        input: res,
                        type: 'raw'
                    };
                }
            };
        }

        return {
            parser: new Parser(params),
            template: function (res) {

                return {
                    input: res,
                    type: void 0
                };
            }
        };
    },

    /**
     * @public
     * @memberOf {Body}
     * @method
     *
     * @param {Object} stream
     * */
    parse: function (stream) {

        var tools = this._getParser(stream, this.params);

        return tools.
            parser.parse(stream).next(function (res, done) {
                done(null, tools.template(res));
            }, this);
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
