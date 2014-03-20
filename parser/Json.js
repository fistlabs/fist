'use strict';

var Raw = /** @type Raw */ require('./Raw');
var QueryString = /** @type QueryString */ require('querystring');

/**
 * @class Json
 * @extends Raw
 * */
var Json = Raw.extend(/** @lends JSON.prototype*/ {

    /**
     * @protected
     * @memberOf {Json}
     * @method
     * */
    parse: function (stream) {

        return Json.parent.parse.call(this, stream).
            next(function (res, done) {

                try {

                    res = JSON.parse(res);
                } catch (err) {

                    return done(err);
                }

                return done(null, res);
            });
    }

});

module.exports = Json;
