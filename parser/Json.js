'use strict';

var Raw = /** @type Raw */ require('./Raw');
var QueryString = /** @type QueryString */ require('querystring');

/**
 * @class Json
 * @extends Raw
 * */
var Json = Raw.extend(/** @lends JSON.prototype*/ {

    /**
     * @public
     * @memberOf {Json}
     * @property
     * @type {String}
     * */
    type: 'json',

    /**
     * @protected
     * @memberOf {Json}
     * @method
     * */
    _parse: function (stream) {

        return Json.parent._parse.call(this, stream).
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
