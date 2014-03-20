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
            } catch (exc) {

                return done(exc);
            }

            return done(null, res);
        });
    }

});

module.exports = Json;
