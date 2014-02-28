'use strict';

var readdir = require('../util/glob');
var Path = require('path');

module.exports = {

    glob0: function (test) {
        readdir(null, function (err) {
            test.ok(err);
            test.done();
        });
    },

    glob1: function (test) {
        readdir('1231230123012', function (err, res) {
            test.deepEqual(res, []);
            test.done();
        });
    },

    glob2: function (test) {

        readdir('test/stuff/*.js', function (err, list) {
            test.deepEqual(list, [
                'test/stuff/ABBR.js',
                'test/stuff/ClassName.js',
                'test/stuff/data.js'
            ]);
            test.done();
        });
    }
};
