'use strict';

var Raw = /** @type Raw */ require('./Raw');
var QueryString = /** @type QueryString */ require('querystring');
var R_JSON = /^(?:(?:[-\w\.]+\+)?json|json\+[-\w\.]+)$/i;

/**
 * @class Json
 * @extends Raw
 * */
var Json = Raw.extend(/** @lends Json.prototype*/ {

    /**
     * @public
     * @memberOf {Json}
     * @property
     * @type {String}
     * */
    type: 'json',

    /**
     * @public
     * @memberOf {Json}
     * @method
     *
     * @returns {Next}
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
    },

    /**
     * @public
     * @memberOf {Json}
     * @method
     *
     * @param {Object} media
     *
     * @returns {Boolean}
     * */
    matchMedia: function (media) {

        return 'application' === media.type &&
            R_JSON.test(media.subtype);
    }

});

module.exports = Json;
