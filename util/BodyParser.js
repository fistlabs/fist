'use strict';

var Base = /** @type Base */ require('fist.lang.class/Base');
var Parser = /** @type Parser */ require('./../parser/Parser');
var Raw = /** @type Raw */ require('./../parser/Raw');
var Urlencoded = /** @type Urlencoded */ require('./../parser/Urlencoded');
var Json = /** @type Json */ require('./../parser/Json');
var Multipart = /** @type Multipart */ require('./../parser/Multipart');
var ContentType = /** @type ContentType */ require('./ContentType');

var _ = /** @type _*/ require('lodash');

/**
 * @class BodyParser
 * @extends Base
 * */
var BodyParser = Base.extend(/** @lends BodyParser.prototype */ {

    /**
     * @protected
     * @memberOf {Base}
     * @method
     *
     * @constructs
     * */
    constructor: function (params) {
        this.params = params;
    },

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

        var CurrentParser = null;
        var contentType;
        var params;

        if ( 'string' === typeof req.headers['transfer-encoding'] ||
            'string' === typeof req.headers['content-length'] ) {
            contentType = new ContentType(req.headers['content-type']);

            _.forEach(this._parsers, function (Parser) {

                if ( Parser.matchMedia(contentType) ) {
                    CurrentParser = Parser;

                    return false;
                }
            });

            if ( null === CurrentParser ) {
                CurrentParser = Raw;
            }

            params = _.extend({}, this.params, contentType.params, {
                length: req.headers['content-length']
            });

        } else {
            CurrentParser = Parser;
            params = this.params;
        }

        return new CurrentParser(params).
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

                res.type = CurrentParser.type;

                done(null, res);
            });
    }

});

module.exports = BodyParser;
