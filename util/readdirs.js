'use strict';

var readdir = require('./readdir');
var forEach = require('fist.lang.foreach');

module.exports = function (dirs, done) {

    var result = [];
    var reject = false;
    var count = dirs.length;

    if ( 0 === count ) {
        done.call(this, null, result);

        return;
    }

    forEach(dirs, function (name, i) {
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
    }, this);
};
