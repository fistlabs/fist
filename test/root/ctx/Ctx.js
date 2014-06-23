'use strict';

var Ctx = require('../../../ctx/Ctx');
var vow = require('vow');

module.exports = {
    Ctx: [
        function (test) {

            var context = new Ctx();

            test.ok(context instanceof vow.Deferred);
            test.deepEqual(context.errors, {});
            test.deepEqual(context.result, {});

            test.done();
        }
    ],
    'Ctx.prototype.getResolver': [
        function (test) {

            var context = new Ctx();
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

            var context = new Ctx();
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
    'Ctx.prototype.setRes': [
        function (test) {

            var context = new Ctx();

            context.setRes('a.b', {c: {}});
            test.deepEqual(context.result, {a: {b: {c: {}}}});

            context.setRes('a.b.c.d', 42);
            test.deepEqual(context.result, {a: {b: {c: {d: 42}}}});

            context.setRes('a.b.c', {z: 146});
            test.deepEqual(context.result, {a: {b: {c: {d: 42, z: 146}}}});

            test.done();
        }
    ],
    'Ctx.prototype.setErr': [
        function (test) {

            var context = new Ctx();

            context.setErr('err', 500);
            test.deepEqual(context.errors, {err: 500});

            test.done();
        }
    ]
};
