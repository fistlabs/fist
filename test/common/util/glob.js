'use strict';

var glob = require('../../../util/glob');
var Path = require('path');

module.exports = {

    glob0: function (test) {
        glob(null, function (err) {
            test.ok(err);
            test.done();
        });
    },

    glob1: function (test) {
        glob('1231230123012', function (err, res) {
            test.deepEqual(res, []);
            test.done();
        });
    },

    glob2: function (test) {

        glob('test/stuff/action/data1/*.js', function (err, list) {
            test.deepEqual(list, [
                'test/stuff/action/data1/ABBR.js',
                'test/stuff/action/data1/ClassName.js',
                'test/stuff/action/data1/data.js'
            ]);
            test.done();
        });
    }
};
