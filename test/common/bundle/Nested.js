'use strict';

var Nested = require('../../../bundle/Nested');

module.exports = {

    bundlify: function (test) {
        var bundle = new Nested();

        bundle.bundlify('name.a', [null, {
            b: 42
        }]);

        bundle.bundlify('name', [null, {
            c: 42
        }]);

        test.deepEqual(bundle.result, {
            name: {
                a: {
                    b: 42
                },
                c: 42
            }
        });

        test.done();
    }
};
