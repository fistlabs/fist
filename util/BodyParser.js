'use strict';

var Json = /** @type Json */ require('../parser/Json');
var Multipart = /** @type Multipart */ require('../parser/Multipart');
var Parser = /** @type Parser */ require('../parser/Parser');
var Raw = /** @type Raw */ require('../parser/Raw');
var Urlencoded = /** @type Urlencoded */ require('../parser/Urlencoded');

var _ = require('lodash-node');
var inherit = require('inherit');

/**
 * @class BodyParser
 * @extends Base
 * */
var BodyParser = inherit(/** @lends BodyParser.prototype */ {

    /**
     * @private
     * @memberOf {BodyParser}
     * @method
     *
     * @constructs
     * */
    __constructor: function (params) {

        /**
         * @public
         * @memberOf {BodyParser}
         * @property {Parser}
         * */
        this.parser = this._createParser(params) ||
            //  Если парсер не был содан то создастся
            // дефолтный для прозрачности
            new Parser(params);
    },

    /**
     * @protected
     * @memberOf {BodyParser}
     * @method
     *
     * @param {Object} params
     *
     * @returns {*}
     * */
    _createParser: function (params) {
        /*eslint new-cap: 0, eqeqeq: 0*/
        var i;
        var l;

        if ( !params ||
            'string' !== typeof params.length || params.length == '0' ) {

            return null;
        }

        for ( i = 0, l = this._parsers.length; i < l; i += 1 ) {

            if ( this._parsers[i].matchMedia(params) ) {

                return new this._parsers[i](params);
            }
        }

        //  Если не был обнаружен парсер для конкретного content-type,
        //  то будет возвращено просто raw-body
        return new Raw(params);
    },

    /**
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
     * @param {Object} stream
     *
     * @returns {vow.Promise}
     * */
    parse: function (stream) {

        return this.parser.parse(stream).
            then(this.__applyTemplate, this);
    },

    /**
     * @private
     * @memberOf {BodyParser}
     * @method
     *
     * @param {*} res
     *
     * @returns {Object}
     * */
    __applyTemplate: function (res) {

        if ( _.isArray(res) ) {

            return {
                type: this.parser.type,
                input: res[0],
                files: res[1]
            };
        }

        return {
            type: this.parser.type,
            input: res
        };
    }

});

module.exports = BodyParser;
