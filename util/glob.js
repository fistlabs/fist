'use strict';

var glob = require('glob');
var forEach = require('fist.lang.foreach');
var toArray = require('fist.lang.toarray');

function singleGlob (expr, done) {

    try {
        glob(expr, done.bind(this));

    } catch (err) {
        done.call(this, err);
    }
}

/**
 * @param {Array} exprs
 * @param {Function} done
 * */
module.exports = function (exprs, done) {

    var length;
    var reject;
    var result;

    exprs = toArray(exprs);

    length = exprs.length;
    reject = false;
    result = [];

    if ( 0 === length ) {
        done.call(this, null, result);

        return;
    }

    function eachExpr (name, i) {

        function onread (err, files) {

            if ( reject ) {

                return;
            }

            if ( 2 > arguments.length ) {
                reject = true;
                done.call(this, err);

                return;
            }

            result[i] = files;
            length -= 1;

            if ( 0 === length ) {
                result = result.reduce(function (result, files) {

                    return result.concat(files);
                });
                done.call(this, null, result);
            }
        }

        singleGlob.call(this, name, onread);
    }

    forEach(exprs, eachExpr, this);
};
