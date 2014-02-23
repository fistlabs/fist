'use strict';

var Fs = require('fs');
var Path = require('path');

module.exports = function (dirname, done, ctx) {

    try {
        Fs.readdir(dirname, function (err, list) {

            if ( 2 > arguments.length ) {

                return done.call(ctx, err);
            }

            list = list.map(function (filename) {

                return Path.resolve( Path.join(dirname, filename) );
            }).sort();

            return done.call(ctx, null, list);
        });

    } catch (err) {

        done.call(ctx, err, done);
    }
};
