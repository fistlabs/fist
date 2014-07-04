/*global describe, it*/
'use strict';

var _ = require('lodash-node');
var assert = require('chai').assert;
var vow = require('vow');

function generateTokens (len) {
    var path = [];

    while ( len ) {
        len -= 1;
        path[path.length] = String(Math.floor(Math.random() * 10));
    }

    return path;
}

function generateRandomTokens () {
    var len = Math.round(Math.random() * 10) + 1;

    return generateTokens(len);
}

describe('fist/ctx/Ctx', function () {
    /*eslint max-nested-callbacks: [2, 5]*/
    var Ctx = require('../ctx/Ctx');

    describe('new Ctx()', function () {

        var ctx = new Ctx();

        var props = [
            'res', 'result',
            'ers', 'errors',
            'params'
        ];

        _.forEach(props, function (prop) {
            it('Should have a "' + prop + '" property', function () {
                assert.property(ctx, prop);
                assert.isObject(ctx[prop]);
            });
        });

        it('Should be an instance of Ctx', function () {
            assert.instanceOf(ctx, Ctx);
        });

        it('Should be an instance of vow.Deferred', function () {
            assert.instanceOf(ctx, vow.Deferred);
        });

    });

    describe('new Ctx(params)', function () {

        var params = {a: 42};
        var ctx = new Ctx(params);

        it('Should have a "params" property', function () {
            assert.property(ctx, 'params');
            assert.isObject(ctx.params);
            assert.deepEqual(ctx.params, params);
            assert.strictEqual(ctx.params, params);
        });
    });

    describe('Ctx.parsePath(path)', function () {

        it('Should be a function', function () {
            assert.isFunction(Ctx.parsePath);
        });

        it('Should parse path to an array of tokens', function () {

            var tests = 100;
            var path;
            var parsed;

            while ( tests ) {

                tests -= 1;
                path = generateRandomTokens();
                parsed = Ctx.parsePath(path.join('.'));

                assert.deepEqual(path, parsed);

                _.forEach(parsed, assert.isString, assert);
            }
        });

        it('Should support escaping', function () {

            var tests = [
                ['a\\.b.c', ['a.b', 'c']],
                ['a.b\\.c', ['a', 'b.c']],
                ['a\\.b\\.c', ['a.b.c']]
            ];

            _.forEach(tests, function (test) {
                assert.deepEqual(Ctx.parsePath(test[0]), test[1]);
            });
        });

        it('Should support token trailing spaces', function () {

            var tests = [
                [' a . b . c ', ['a', 'b', 'c']],
                [' a . b .   c ', ['a', 'b', 'c']]
            ];

            _.forEach(tests, function (test) {
                assert.deepEqual(Ctx.parsePath(test[0]), test[1]);
            });
        });

        it('Should throw and error', function () {

            var badPaths = [
                'a  b . c',
                'a \\b',
                '\\'
            ];

            _.forEach(badPaths, function (path) {
                assert.throws(function () {
                    Ctx.parsePath(path);
                }, SyntaxError);
            });
        });

        it('Should cache parsing result', function () {
            var result = Ctx.parsePath('a');
            assert.strictEqual(result, Ctx.parsePath('a'));
        });
    });

    describe('Ctx.use(root, path)', function () {
        it('Should return the object placed on path', function () {
            assert.strictEqual(Ctx.use({a: {b: {c: 42}}}, 'a.b.c'), 42);
            assert.strictEqual(Ctx.use({a: {b: {c: 42}}}, 'a.b.c.d'), void 0);
        });
    });

    describe('Ctx.link(root, path, data)', function () {
        it('Should link the data to the root according to path', function () {

            var o = {};
            var tests = [
                ['a.b.c', 42],
                ['a.b.c.d', 100500],
                ['a.y.z', 900]
            ];

            _.forEach(tests, function (test) {
                var res = Ctx.link(o, test[0], test[1]);
                assert.strictEqual(res, test[1]);
                assert.deepProperty(o, test[0]);
                assert.deepPropertyVal(o, test[0], test[1]);
            });

        });
    });

    describe('Ctx.add(root, path, data)', function () {
        it('Should extend existing data', function () {

            var o = {};
            var res;

            res = Ctx.add(o, 'a.b.c', 42);
            assert.strictEqual(res, 42);
            assert.deepProperty(o, 'a.b.c');
            assert.deepPropertyVal(o, 'a.b.c', 42);

            res = Ctx.add(o, 'a.b', {
                x: 15
            });
            assert.deepEqual(res, {
                x: 15,
                c: 42
            });
            assert.deepProperty(o, 'a.b.x');
            assert.deepPropertyVal(o, 'a.b.x', 15);
        });
    });

    describe('.setRes(path, data)', function () {
        it('Should set data to .res object', function () {
            var ctx = new Ctx();
            ctx.setRes('a.b.c', 42);
            assert.deepProperty(ctx.res, 'a.b.c');
            assert.deepPropertyVal(ctx.res, 'a.b.c', 42);
        });
    });

    describe('.setErr(path, data)', function () {
        it('Should set data to .ers object', function () {
            var ctx = new Ctx();
            ctx.setErr('a.b.c', 42);
            assert.deepProperty(ctx.ers, 'a.b.c');
            assert.deepPropertyVal(ctx.ers, 'a.b.c', 42);
        });
    });

    describe('.getRes(path)', function () {
        it('Should get data from .res object', function () {
            var ctx = new Ctx();
            ctx.setRes('a.b.c', 42);
            assert.strictEqual(ctx.getRes('a.b.c'), 42);
        });
    });

    describe('.getErr(path)', function () {
        it('Should get data from .ers object', function () {
            var ctx = new Ctx();
            ctx.setErr('a.b.c', 42);
            assert.strictEqual(ctx.getErr('a.b.c'), 42);
        });
    });
});
