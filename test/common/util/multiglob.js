'use strict';

var multiglob = require('../../../util/multiglob');

module.exports = {

    multiglob0: function (test) {

        multiglob.call(42, [], function (err, res) {
            test.deepEqual(res, []);
        });

        multiglob.call(42, [
            'test/stuff/action/data0/*.js',
            'test/stuff/action/data1/*.js'
        ], function (err, result) {

            test.strictEqual(this, 42);
            test.deepEqual(result, [
                'test/stuff/action/data0/Knot.js',
                'test/stuff/action/data0/data.js',
                'test/stuff/action/data0/error.js',
                'test/stuff/action/data0/index.js',
                'test/stuff/action/data1/ABBR.js',
                'test/stuff/action/data1/ClassName.js',
                'test/stuff/action/data1/data.js'
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
