'use strict';

var MediaHead = require('../../../util/MediaHead');

module.exports = {
    MediaHead: [
        function (test) {

            var mime;

            mime = new MediaHead();

            test.strictEqual(mime.value, void 0);
            test.deepEqual(mime.params, {});

            mime = new MediaHead(' ');

            test.strictEqual(mime.value, void 0);
            test.deepEqual(mime.params, {});

            mime = new MediaHead('foo');

            test.strictEqual(mime.value, 'foo');
            test.deepEqual(mime.params, {});

            mime = new MediaHead('foo; a=5;a=6;a=7');

            test.strictEqual(mime.value, 'foo');
            test.deepEqual(mime.params, {
                a: ['5', '6', '7']
            });

            mime = new MediaHead('  foo ; a; b=');

            test.strictEqual(mime.value, 'foo');
            test.deepEqual(mime.params, {
                a: void 0,
                b: ''
            });

            mime = new MediaHead('  foo ; a; b=""');

            test.strictEqual(mime.value, 'foo');
            test.deepEqual(mime.params, {
                a: void 0,
                b: ''
            });

            mime = new MediaHead('  foo ; a; b=;');

            test.strictEqual(mime.value, 'foo');
            test.deepEqual(mime.params, {
                a: void 0,
                b: ''
            });

            mime = new MediaHead('  foo ; a; b');

            test.strictEqual(mime.value, 'foo');
            test.deepEqual(mime.params, {
                a: void 0,
                b: void 0
            });

            mime = new MediaHead('  foo ; a = "a\\""');

            test.strictEqual(mime.value, 'foo');
            test.deepEqual(mime.params, {
                a: 'a"'
            });

            mime = new MediaHead('  foo ; =5;');

            test.strictEqual(mime.value, 'foo');
            test.deepEqual(mime.params, {});

            mime = new MediaHead('  foo ; a ;  a  ; a');

            test.strictEqual(mime.value, 'foo');
            test.deepEqual(mime.params, {
                a: [void 0, void 0, void 0]
            });

            test.done();
        }
    ],

    toString: [
        function (test) {
            var header = 'x;a=5;a;a=1;b;c=5';
            var mime = new MediaHead(header);
            test.strictEqual(mime.toString(), header);
            test.done();
        },
        function (test) {
            var mime = new MediaHead('  ');
            test.strictEqual(mime.toString(), '  ');
            test.done();
        }
    ]
};
