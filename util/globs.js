'use strict';

var _ = require('lodash-node');
var glob = require('glob');
var vow = require('vow');

function singleGlob (expr) {

    var defer = vow.defer();

    try {
        glob(expr, function (err, res) {
            if ( 2 > arguments.length ) {
                defer.reject(err);
                return;
            }

            defer.resolve(res);
        });

    } catch (err) {
        defer.reject(err);
    }

    return defer.promise();
}

/**
 * @param {Array} globs
 * @returns {vow.Promise}
 * */
module.exports = function (globs) {

    if (_.isUndefined(globs) || _.isNull(globs) ) {
        globs = [];

    } else if ( !_.isArray(globs) ) {
        globs = [globs];
    }

    globs = _.map(globs, singleGlob);

    return vow.all(globs).then(function (results) {

        return _.reduce(results, function (results, result) {

            return results.concat(result);
        });
    });
};
