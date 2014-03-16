'use strict';

var Nested = require('../../../bundle/Nested');

module.exports = {

    'Nested.prototype.bundlify': [
        function (test) {
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
    ],

    'Nested.link': [
        function (test) {

            var root;

            root = {
                a: {}
            };

            Nested.link(root, 'a.b.c', 5);

            test.deepEqual(root, {a: {b: {c: 5}}});

            root = {
                a: 0
            };

            Nested.link(root, 'a.b.c', 5);

            test.deepEqual(root, {a: {b: {c: 5}}});

            test.done();
        }
    ],

    'Nested.parse': [
        function (test) {
            test.deepEqual(Nested.parse('a.b.c'), ['a', 'b', 'c']);
            test.done();
        },
        function (test) {
            test.deepEqual(Nested.parse('a.b\\.c'), ['a', 'b.c']);
            test.deepEqual(Nested.parse('a.b\\ \\.c'), ['a', 'b .c']);
            test.deepEqual(Nested.parse('a.b.\\ .c'), ['a', 'b', ' ', 'c']);
            test.deepEqual(Nested.parse('a.b.\\ .c'), ['a', 'b', ' ', 'c']);
            test.done();
        },
        function (test) {

            try {
                Nested.parse('a.b c');
                throw 0;
            } catch (ex) {
                test.ok(ex instanceof SyntaxError);
            }

            try {
                Nested.parse('a.b \\c');
                throw 0;
            } catch (ex) {
                test.ok(ex instanceof SyntaxError);
            }

            test.done();
        },
        function (test) {
            test.deepEqual(Nested.parse(' a.b.c '), ['a', 'b', 'c']);
            test.deepEqual(Nested.parse(' a. b . c '), ['a', 'b', 'c']);
            test.deepEqual(Nested.parse(' a   .b . c'), ['a', 'b', 'c']);
            test.done();
        },
        function (test) {

            try {
                Nested.parse('a.c.b\\');
                throw 0;
            } catch (ex) {
                test.ok(ex instanceof SyntaxError);
            }

            test.done();
        }
    ],

    'Nested.use': [
        function (test) {
            test.strictEqual(Nested.use({a: {b: {c: 0}}}, 'a.b.c'), 0);
            test.done();
        }
    ]

};
