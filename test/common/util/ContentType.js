'use strict';

var ContentType = require('../../../util/ContentType');
var _ = require('lodash');

module.exports = {

    ContentType: [
        function (test) {
            var mime = new ContentType();

            test.strictEqual(mime.type, void 0);
            test.strictEqual(mime.subtype, void 0);
            test.strictEqual(mime.value, void 0);

            test.done();
        },
        function (test) {
            var mime = new ContentType(' multipart/mixed ; boundary=BOUNDARY ');

            test.strictEqual(mime.type, 'multipart');
            test.strictEqual(mime.subtype, 'mixed');
            test.strictEqual(mime.value, 'multipart/mixed');

            test.deepEqual(mime.params, {
                boundary: 'BOUNDARY'
            });

            test.done();
        },
        function (test) {
            var mime = new ContentType('foo');

            test.strictEqual(mime.type, 'foo');
            test.strictEqual(mime.subtype, void 0);
            test.strictEqual(mime.value, 'foo');

            test.deepEqual(mime.params, {});

            test.done();
        }
    ]
};
