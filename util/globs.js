'use strict';

var _ = require('lodash-node');
var glob = require('glob');
var vow = require('vow');

function singleGlob (expr, opts) {

    var defer = vow.defer();

    try {
        glob(expr, opts, function (err, res) {

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
 * @param {Object} opts
 *
 * @returns {vow.Promise}
 * */
function globs (globs, opts) {

    if (_.isUndefined(globs) || _.isNull(globs) ) {
        globs = [];

    } else if ( !_.isArray(globs) ) {
        globs = [globs];
    }

    globs = _.map(globs, function (glob) {

        return singleGlob(glob, opts);
    });

    return vow.all(globs).then(function (results) {

        return _.reduce(results, function (results, result) {

            return results.concat(result);
        }, []);
    });
}

module.exports = globs;
