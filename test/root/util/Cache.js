'use strict';

var Cache = require('../../../util/Cache');
var inherit = require('inherit');

module.exports = {
    'Cache.prototype.get': [
        function (test) {
            var cache = new Cache();

            cache.set('k', 42, 0, function (err) {
                test.ok(!err);
                cache.get('k', function (err, res) {
                    test.ok(!err);
                    test.strictEqual(res, void 0);
                    test.done();
                });
            });
        },
        function (test) {
            var cache = new Cache();

            cache.set('k', 42, NaN, function (err) {
                test.ok(!err);
                cache.get('k', function (err, res) {
                    test.ok(!err);
                    test.strictEqual(res, void 0);
                    test.done();
                });
            });
        },
        function (test) {
            var cache = new Cache();

            cache.set('k', 42, 50, function (err) {
                test.ok(!err);
                cache.get('k', function (err, res) {
                    test.ok(!err);
                    test.strictEqual(res, 42);
                });

                setTimeout(function () {
                    cache.get('k', function (err, res) {
                        test.ok(!err);
                        test.strictEqual(res, void 0);
                        test.done();
                    });
                }, 100);
            });
        }
    ]
};
