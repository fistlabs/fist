'use strict';

var Context = require('../../../context/Context');
var vow = require('vow');

module.exports = {
    Context: [
        function (test) {

            var context = new Context();

            test.ok(context instanceof vow.Deferred);
            test.deepEqual(context.errors, {});
            test.deepEqual(context.result, {});

            test.done();
        }
    ],
    'Context.prototype.getResolver': [
        function (test) {

            var context = new Context();
            var done = context.getResolver();

            setTimeout(function () {
                done(null, 42);
            }, 0);

            context.promise().done(function (res) {
                test.strictEqual(res, 42);
                test.done();
            });
        },
        function (test) {

            var context = new Context();
            var done = context.getResolver();

            setTimeout(function () {
                done(42);
            }, 0);

            context.promise().fail(function (res) {
                test.strictEqual(res, 42);
                test.done();
            }).done();
        }
    ],
    'Context.link': [
        function (test) {

            var root;

            root = {a: {}};
            Context.link(root, 'a.b.c', 5);
            test.deepEqual(root, {a: {b: {c: 5}}});

            root = {a: 0};
            Context.link(root, 'a.b.c', 5);
            test.deepEqual(root, {a: {b: {c: 5}}});

            test.done();
        }
    ],
    'Context.parsePath': [
        function (test) {

            test.deepEqual(Context.parsePath('a.b.c'), ['a', 'b', 'c']);

            test.done();
        },
        function (test) {

            test.deepEqual(Context.parsePath('a.b\\.c'), ['a', 'b.c']);
            test.deepEqual(Context.parsePath('a.b\\ \\.c'), ['a', 'b .c']);
            test.deepEqual(Context.parsePath('a.b.\\ .c'),
                ['a', 'b', ' ', 'c']);
            test.deepEqual(Context.parsePath('a.b.\\ .c'),
                ['a', 'b', ' ', 'c']);

            test.done();
        },
        function (test) {

            test.throws(function () {
                Context.parsePath('a.b c');
            }, SyntaxError);

            test.throws(function () {
                Context.parsePath('a.b \\c');
            }, SyntaxError);

            test.done();
        },
        function (test) {
            test.deepEqual(Context.parsePath(' a.b.c '), ['a', 'b', 'c']);
            test.deepEqual(Context.parsePath(' a. b . c '), ['a', 'b', 'c']);
            test.deepEqual(Context.parsePath(' a   .b . c'), ['a', 'b', 'c']);

            test.done();
        },
        function (test) {

            test.throws(function () {
                Context.parsePath('a.c.b\\');
            }, SyntaxError);

            test.done();
        }
    ],
    'Context.use': [
        function (test) {

            test.strictEqual(Context.use({a: {b: {c: 0}}}, 'a.b.c'), 0);

            test.done();
        }
    ],
    'Context.prototype.setResult': [
        function (test) {

            var context = new Context();

            context.setResult('a.b', {c: {}});
            test.deepEqual(context.result, {a: {b: {c: {}}}});

            context.setResult('a.b.c.d', 42);
            test.deepEqual(context.result, {a: {b: {c: {d: 42}}}});

            context.setResult('a.b.c', {z: 146});
            test.deepEqual(context.result, {a: {b: {c: {d: 42, z: 146}}}});

            test.done();
        }
    ],
    'Context.prototype.setError': [
        function (test) {

            var context = new Context();

            context.setError('err', 500);
            test.deepEqual(context.errors, {err: 500});

            test.done();
        }
    ]
};
