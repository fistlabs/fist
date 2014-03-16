'use strict';

var R_JSON = /^application\/(?:(?:[-\w\.]+\+)?json|json\+[-\w\.]+)(?:;|$)/i;
var Loader = /** @type Loader */ require('./Loader');
var QueryString = /** @type QueryString */ require('querystring');

/**
 * @class JSON
 * @extends Loader
 * */
var Json = Loader.extend(/** @lends JSON.prototype*/ {

    /**
     * @protected
     * @memberOf {JSON}
     * @method
     *
     * @param {Function} done
     * */
    _parse: function (done) {
        Json.parent._parse.call(this, function (err, res) {

            if ( 2 > arguments.length ) {

                return done(err);
            }

            try {

                res = JSON.parse(res);
            } catch (err) {

                return done(err);
            }

            return done(null, res);
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
