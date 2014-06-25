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
    'Ctx.add': [
        function (test) {
            var obj = {a: {b: {c: 42}}};

            Ctx.add(obj, 'a.b', {
                d: 15
            });

            test.deepEqual(obj, {a: {b: {d: 15, c: 42}}});

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

            ctx.setRes('r', 200);
            test.deepEqual(ctx.res, {r: 200});

            test.done();
        }
    ],
    'Ctx.prototype.setErr': [
        function (test) {

            var ctx = new Ctx();

            ctx.setErr('e', 500);
            test.deepEqual(ctx.ers, {e: 500});

            test.done();
        }
    ]
};
