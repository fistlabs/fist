'use strict';

var R_JSON = /^application\/(?:(?:[-\w\.]+\+)?json|json\+[-\w\.]+)(?:;|$)/i;
var StreamLoader = /** @type StreamLoader */ require('../StreamLoader');
var QueryString = /** @type QueryString */ require('querystring');

/**
 * @class JSON
 * @extends StreamLoader
 * */
var Json = StreamLoader.extend(/** @lends JSON.prototype*/ {

    /**
     * @protected
     * @memberOf {JSON}
     * @method
     *
     * @param {*} opts
     * @param {Function} done
     * */
    _parse: function (opts, done) {
        Json.parent._parse.call(this, opts, function (err, res) {

            var result;

            if ( 2 > arguments.length ) {

                return done(err);
            }

            try {

                result = {
                    input: JSON.parse(res),
                    files: Object.create(null)
                };
            } catch (ex) {

                return done(ex);
            }

            return done(null, result);
        });
    }
}, {

    /**
     * @public
     * @static
     * @memberOf JSON
     * @method
     *
     * @param {Object} req
     *
     * @returns {Boolean}*/
    isJSON: function (req) {

        return R_JSON.test(req.headers['content-type']);
    }
});

module.exports = Json;
