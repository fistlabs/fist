'use strict';

var QueryString = /** @type QueryString */ require('querystring');

var Loader = /** @type Loader */ require('./Loader');
var Parser = /** @type Parser */ require('./Parser');
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
     * @param {Function} done
     * */
    _parse: function (done) {

        var boundary;
        var type;

        function resolve (err, res) {

            if ( 2 > arguments.length ) {
                done(err);

                return;
            }

            if ( 'multipart' === type ) {
                done(null, {
                    input: res[0],
                    files: res[1],
                    type: type
                });

                return;
            }

            done(null, {
                input: res,
                type: type
            });
        }

        if ( !Body.hasBody(this._readable) ) {
            type = void 0;

            return resolve(null, Object.create(null));
        }

        if ( Urlencoded.isUrlencoded(this._readable) ) {
            type = 'urlencoded';
            return Urlencoded.prototype._parse.call(this, resolve);
        }

        if ( Json.isJSON(this._readable) ) {
            type = 'json';
            return Json.prototype._parse.call(this, resolve);
        }

        boundary = Multipart.isMultipart(this._readable);

        if ( boundary ) {
            type = 'multipart';
            this.params.boundary = boundary;

            return Multipart.prototype._parse.call(this, resolve);
        }

        type = 'raw';

        return Loader.prototype._parse.call(this, resolve);
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
    }
});

module.exports = Body;
