'use strict';

var _ = require('lodash-node');
var glob = require('glob');
var path = require('path');
var vow = require('vow');
var processCwd = process.cwd();

function singleGlob (expr, opts) {

    var defer = vow.defer();

    glob(expr, opts, function (err, res) {

        if ( 2 > arguments.length ) {
            defer.reject(err);

            return;
        }

        defer.resolve(res);
    });

    return defer.promise();
}

/**
 * @param {Array} globs
 * @param {Object} opts
 *
 * @returns {vow.Promise}
 * */
function globs (globs, opts) {

    var cwd;

    if ( _.isUndefined(globs) || _.isNull(globs) ) {
        globs = [];

    } else if ( !_.isArray(globs) ) {
        globs = [globs];
    }

    if ( _.isObject(opts) && _.isString(opts.cwd) ) {
        cwd = opts.cwd;

    } else {
        cwd = processCwd;
    }

    return vow.invoke(function () {

        globs = _.map(globs, function (glob) {
            //  Резолвить нужно для того
            // чтобы можно было удалить дубликаты
            glob = path.resolve(cwd, glob);

            return singleGlob(glob, opts);
        });

        return vow.all(globs).then(function (results) {

            results = _.reduce(results, function (results, result) {

                return results.concat(result);
            }, []);

            //  удалить одинаковые результаты
            results = _.uniq(results);

            return results;
        });
    });
}

module.exports = globs;
