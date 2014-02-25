'use strict';

var readdir = require('../util/readdir');
var Path = require('path');

module.exports = {

    readdir0: function (test) {
        readdir(null, function (err) {
            test.ok(err);
            test.done();
        });
    },

    readdir1: function (test) {
        readdir('1231230123012', function (err) {
            test.ok(err);
            test.done();
        });
    },

    readdir2: function (test) {

        readdir('test/stuff', function (err, list) {
            test.deepEqual(list, [
                'ABBR.js',
                'ClassName.js',
                'data.js'
            ]);
            test.done();
        });
    }
};
