'use strict';

var glob = require('../../../util/glob');

module.exports = [

    function (test) {

        var c = {};

        glob.call(c, [], function (err, res) {
            test.strictEqual(this, c);
            test.deepEqual(res, []);
        });

        glob.call(c, [
            'test/stuff/action/data0/*.js',
            'test/stuff/action/data1/*.js'
        ], function (err, result) {

            test.strictEqual(this, c);
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

    function (test) {
        var c = {};
        glob.call(c, [
            'test/data1'
        ], function (err, res) {
            test.strictEqual(this, c);
            test.deepEqual(res, []);
            test.done();
        });
    }
];
