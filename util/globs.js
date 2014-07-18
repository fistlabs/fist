'use strict';

var _ = require('lodash-node');
var glob = require('glob');
var path = require('path');
var vow = require('vow');

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

    if ( _.isUndefined(globs) || _.isNull(globs) ) {
        globs = [];

    } else if ( !_.isArray(globs) ) {
        globs = [globs];
    }

    //  вдруг есть паттерны одинаковые
    globs = _.uniq(globs);

    return vow.invoke(function () {

        globs = _.map(globs, function (glob) {
            glob = path.resolve(glob);

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
