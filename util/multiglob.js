'use strict';

var glob = require('./glob');
var forEach = require('fist.lang.foreach');

module.exports = function (dirs, done) {

    var result = [];
    var files = [];
    var reject = false;
    var count = dirs.length;

    if ( 0 === count ) {
        done.call(this, null, result);

        return;
    }

    function merge (list) {
        [].push.apply(files, list);
    }

    function eachPath (name, i) {

        function onread (err, list) {

            if ( reject ) {

                return;
            }

            if ( 2 > arguments.length ) {
                reject = true;
                done.call(this, err);

                return;
            }

            result[i] = list;

            count -= 1;

            if ( 0 === count ) {
                forEach(result, merge);
                done.call(this, null, files);
            }
        }

        glob.call(this, name, onread);
    }

    forEach(dirs, eachPath, this);
};
