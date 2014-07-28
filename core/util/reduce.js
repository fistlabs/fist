'use strict';

var vow = require('vow');

/**
 * @returns {vow.Promise}
 * */
function reduce (o, func, result, thisp) {
    var i = 0;
    var l = o.length;

    if ( 3 > arguments.length ) {
        i = 1;
        result = o[0];
    }

    function iter (result, i) {

        if ( i >= l ) {

            return vow.resolve(result);
        }

        return vow.invoke(function () {

            return func.call(thisp, result, o[i], i, o);
        }).then(function (result) {

            return iter(result, i + 1);
        });
    }

    return iter(result, i);
}

module.exports = reduce;
