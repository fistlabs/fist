'use strict';

var Cache = require('../../../util/Cache');
var inherit = require('inherit');

module.exports = {
    'Cache.prototype.get': [
        function (test) {
            var cache = new Cache();

            cache.set('k', 42, 0);
            test.strictEqual(cache.get('k'), void 0);

            cache.set('k', 42);
            test.strictEqual(cache.get('k'), void 0);

            cache.set('k', 42, 50);
            test.ok(cache.has('k'));
            test.ok(cache.has('k'));
            test.strictEqual(cache.get('k'), 42);

            setTimeout(function () {
                test.strictEqual(cache.get('k'), void 0);
                test.done();
            }, 100);
        }
    ]
};
