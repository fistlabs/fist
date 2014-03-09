'use strict';

var QueryString = /** @type QueryString */ require('querystring');

var Loader = /** @type Loader */ require('./Loader');
var Raw = /** @type Raw */ require('./parser/Raw');
var Urlencoded = /** @type Urlencoded */ require('./parser/Urlencoded');
var Json = /** @type Json */ require('./parser/Json');
var Multipart = /** @type Multipart */ require('./parser/Multipart');

/**
 * @class BodyParser
 * @extends Loader
 * */
var BodyParser = Loader.extend(/** @lends BodyParser.prototype */ {

    /**
     * @protected
     * @memberOf {BodyParser}
     * @method
     *
     * @param {*} [opts]
     * @param {Function} done
     * */
    _parse: function (opts, done) {

        var boundary;

        if ( !BodyParser.hasBody(this._readable) ) {

            return done(null, {
                input: Object.create(null),
                files: Object.create(null)
            });
        }

        if ( Urlencoded.isUrlencoded(this._readable) ) {

            return Urlencoded.prototype._parse.call(this, opts, done);
        }

        if ( Json.isJSON(this._readable) ) {

            return Json.prototype._parse.call(this, opts, done);
        }

        boundary = Multipart.isMultipart(this._readable);

        if ( boundary ) {
            opts.boundary = boundary;

            return Multipart.prototype._parse.call(this, opts, done);
        }

        return Raw.prototype._parse.call(this, opts, done);
    }

}, /** @lends BodyParser */ {

    hasBody: function (req) {

        var clen = req.headers['content-length'];

        return 'string' === typeof req.headers['transfer-encoding'] ||
            'string' === typeof clen && '0' !== clen;
    }
});

module.exports = BodyParser;
