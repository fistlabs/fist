'use strict';

var QueryString = /** @type QueryString */ require('querystring');

var Reader = /** @type Reader */ require('./Reader');
var Raw = /** @type Raw */ require('./Raw');
var Urlencoded = /** @type Urlencoded */ require('./Urlencoded');
var Json = /** @type Json */ require('./Json');
var Multipart = /** @type Multipart */ require('./Multipart');

/**
 * @class Body
 * @extends Reader
 * */
var Body = Reader.extend(/** @lends Body.prototype */ {

    /**
     * @protected
     * @memberOf {Body}
     * @method
     *
     * @param {*} [opts]
     * @param {Function} done
     * */
    _parse: function (opts, done) {

        var boundary;

        if ( !Body.hasBody(this._readable) ) {

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

}, /** @lends Body */ {

    hasBody: function (req) {

        var clen = req.headers['content-length'];

        return 'string' === typeof req.headers['transfer-encoding'] ||
            'string' === typeof clen && '0' !== clen;
    }
});

module.exports = Body;
