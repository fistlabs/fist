'use strict';

var readdir = require('./readdir');
var forEach = require('fist.lang.foreach');
var Path = require('path');

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

        function join (filename) {

            return Path.join(name, filename);
        }

        function onread (err, list) {

            if ( reject ) {

                return;
            }

            if ( 2 > arguments.length ) {
                reject = true;
                done.call(this, err);

                return;
            }

            result[i] = list.map(join);

            count -= 1;

            if ( 0 === count ) {
                forEach(result, merge);
                done.call(this, null, files);
            }
        }

        readdir.call(this, name, onread);
    }

    forEach(dirs, eachPath, this);
};
