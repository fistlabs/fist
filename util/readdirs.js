'use strict';

var readdir = require('./readdir');

module.exports = function (dirs, done) {

    var i;
    var l;
    var result = [];
    var reject = false;
    var count = dirs.length;

    if ( 0 === count ) {
        done.call(this, null, result);

        return;
    }

    function read (i, name) {
        readdir.call(this, name, function (err, list) {

            if ( reject ) {

                return;
            }

            if ( 2 > arguments.length ) {
                reject = true;

                done.call(this, err);

                return;
            }

            result[i] = {
                name: name,
                list: list
            };

            count -= 1;

            if ( 0 === count ) {
                done.call(this, null, result);
            }
        });
    }

    for ( i = 0, l = dirs.length; i < l; i += 1) {
        read.call(this, i, dirs[i]);
    }

};
