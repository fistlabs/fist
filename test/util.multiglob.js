'use strict';

var multiglob = require('../util/multiglob');

module.exports = {

    multiglob0: function (test) {

        multiglob.call(42, [], function (err, res) {
            test.deepEqual(res, []);
        });

        multiglob.call(42, [
            'test/data/*.js',
            'test/stuff/*.js'
        ], function (err, result) {

            test.strictEqual(this, 42);
            test.deepEqual(result, [
                'test/data/Knot.js',
                'test/data/data.js',
                'test/data/error.js',
                'test/data/index.js',
                'test/stuff/ABBR.js',
                'test/stuff/ClassName.js',
                'test/stuff/data.js'
            ]);

            test.done();
        });

    },

    multiglob1: function (test) {

        multiglob.call(42, [
            'test/data1'
        ], function (err, res) {
            test.strictEqual(this, 42);
            test.deepEqual(res, []);
            test.done();
        });

    }
};
