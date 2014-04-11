'use strict';

var Class = /** @type Class */ require('fist.lang.class/Class');
var ContentType = /** @type ContentType */ require('./ContentType');
var Json = /** @type Json */ require('../parser/Json');
var Multipart = /** @type Multipart */ require('../parser/Multipart');
var Parser = /** @type Parser */ require('../parser/Parser');
var Raw = /** @type Raw */ require('../parser/Raw');
var Urlencoded = /** @type Urlencoded */ require('../parser/Urlencoded');

var _ = /** @type _*/ require('lodash');

/**
 * @class BodyParser
 * @extends Class
 * */
var BodyParser = Class.extend(/** @lends BodyParser.prototype */ {

    /**
     * Этих парсеров достаточно более чем с головой,
     * Но при желании теперь можно добавить дополнительные парсеры
     *
     * @protected
     * @memberOf {BodyParser}
     * @property
     * @type {Array<Function>}
     * */
    _parsers: [
        Urlencoded,
        Multipart,
        Json
    ],

    /**
     * @public
     * @memberOf {BodyParser}
     * @method
     *
     * @param {Object} req
     * */
    parse: function (req) {

        var StreamParser;

        var header = req.headers;
        var contentType = new ContentType(header['content-type']);
        var params = this.params;
        var parsers = [Parser];

        if ( 'string' === typeof header['transfer-encoding'] ||
            'string' === typeof header['content-length'] ) {
            parsers = this._parsers.concat(Raw);
        }

        params = _.extend({}, params, contentType.params, {
            length: header['content-length']
        });

        StreamParser = _.find(parsers, function (Parser) {

            return Parser.matchMedia(contentType);
        });

        return new StreamParser(params).
            parse(req).next(function (res, done) {

                if ( Array.isArray(res) ) {
                    res = {
                        input: res[0],
                        files: res[1]
                    };

                } else {
                    res = {
                        input: res
                    };
                }

                res.type = StreamParser.type;

                done(null, res);
            });
    }

});

module.exports = BodyParser;
