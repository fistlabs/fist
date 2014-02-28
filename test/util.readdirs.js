'use strict';

var readdirs = require('../util/readdirs');

module.exports = {

    readdirs0: function (test) {

        readdirs.call(42, [], function (err, res) {
            test.deepEqual(res, []);
        });

        readdirs.call(42, [
            'test/data',
            'test/stuff'
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

    readdirs1: function (test) {

        readdirs.call(42, [
            'test/stuff',
            'test/data1'
        ], function (err) {
            test.strictEqual(this, 42);
            test.ok(err);
            test.done();
        });

    }
};
