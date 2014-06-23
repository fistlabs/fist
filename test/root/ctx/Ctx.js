'use strict';

var Ctx = require('../../../ctx/Ctx');
var vow = require('vow');

module.exports = {
    Ctx: [
        function (test) {

            var ctx = new Ctx();

            test.ok(ctx instanceof vow.Deferred);
            test.deepEqual(ctx.errors, {});
            test.deepEqual(ctx.result, {});

            test.done();
        }
    ],
    'Ctx.prototype.getResolver': [
        function (test) {

            var ctx = new Ctx();
            var done = ctx.getResolver();

            setTimeout(function () {
                done(null, 42);
            }, 0);

            ctx.promise().done(function (res) {
                test.strictEqual(res, 42);
                test.done();
            });
        },
        function (test) {

            var ctx = new Ctx();
            var done = ctx.getResolver();

            setTimeout(function () {
                done(42);
            }, 0);

            ctx.promise().fail(function (res) {
                test.strictEqual(res, 42);
                test.done();
            }).done();
        }
    ],
    'Ctx.link': [
        function (test) {

            var root;

            root = {a: {}};
            Ctx.link(root, 'a.b.c', 5);
            test.deepEqual(root, {a: {b: {c: 5}}});

            root = {a: 0};
            Ctx.link(root, 'a.b.c', 5);
            test.deepEqual(root, {a: {b: {c: 5}}});

            test.done();
        }
    ],
    'Ctx.parsePath': [
        function (test) {

            test.deepEqual(Ctx.parsePath('a.b.c'), ['a', 'b', 'c']);

            test.done();
        },
        function (test) {

            test.deepEqual(Ctx.parsePath('a.b\\.c'), ['a', 'b.c']);
            test.deepEqual(Ctx.parsePath('a.b\\ \\.c'), ['a', 'b .c']);
            test.deepEqual(Ctx.parsePath('a.b.\\ .c'),
                ['a', 'b', ' ', 'c']);
            test.deepEqual(Ctx.parsePath('a.b.\\ .c'),
                ['a', 'b', ' ', 'c']);

            test.done();
        },
        function (test) {

            test.throws(function () {
                Ctx.parsePath('a.b c');
            }, SyntaxError);

            test.throws(function () {
                Ctx.parsePath('a.b \\c');
            }, SyntaxError);

            test.done();
        },
        function (test) {
            test.deepEqual(Ctx.parsePath(' a.b.c '), ['a', 'b', 'c']);
            test.deepEqual(Ctx.parsePath(' a. b . c '), ['a', 'b', 'c']);
            test.deepEqual(Ctx.parsePath(' a   .b . c'), ['a', 'b', 'c']);

            test.done();
        },
        function (test) {

            test.throws(function () {
                Ctx.parsePath('a.c.b\\');
            }, SyntaxError);

            test.done();
        }
    ],
    'Ctx.use': [
        function (test) {

            test.strictEqual(Ctx.use({a: {b: {c: 0}}}, 'a.b.c'), 0);

            test.done();
        }
    ],
    'Ctx.prototype.getRes': [
        function (test) {
            var ctx = new Ctx();
            ctx.setRes('a.b.c', 42);
            test.strictEqual(ctx.getRes('a.b.c'), 42);
            test.deepEqual(ctx.getRes('a.b'), {
                c: 42
            });
            test.strictEqual(ctx.getRes('a.b.d'), void 0);
            test.strictEqual(ctx.getRes('a.b.c.d'), void 0);
            test.done();
        }
    ],
    'Ctx.prototype.getErr': [
        function (test) {
            var ctx = new Ctx();
            ctx.setErr('a.b.c', 42);
            test.strictEqual(ctx.getErr('a.b.c'), 42);
            test.deepEqual(ctx.getErr('a.b'), {
                c: 42
            });
            test.strictEqual(ctx.getErr('a.b.d'), void 0);
            test.strictEqual(ctx.getErr('a.b.c.d'), void 0);
            test.done();
        }
    ],
    'Ctx.prototype.setRes': [
        function (test) {

            var ctx = new Ctx();

            ctx.setRes('a.b', {c: {}});
            test.deepEqual(ctx.result, {a: {b: {c: {}}}});

            ctx.setRes('a.b.c.d', 42);
            test.deepEqual(ctx.result, {a: {b: {c: {d: 42}}}});

            ctx.setRes('a.b.c', {z: 146});
            test.deepEqual(ctx.result, {a: {b: {c: {d: 42, z: 146}}}});

            test.done();
        }
    ],
    'Ctx.prototype.setErr': [
        function (test) {

            var ctx = new Ctx();

            ctx.setErr('err', 500);
            test.deepEqual(ctx.errors, {err: 500});

            test.done();
        }
    ]
};
