'use strict';

var glob = require('glob');
var vow = require('vow');

function vowGlob (pattern, options) {

    return vow.invoke(function () {
        var defer = vow.defer();

        glob(pattern, options, function (err, res) {

            if ( err ) {
                defer.reject(err);

            } else {
                defer.resolve(res);
            }
        });

        return defer.promise();
    });
}

module.exports = vowGlob;
