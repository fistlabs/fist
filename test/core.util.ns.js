/*global describe, it*/
'use strict';

var _ = require('lodash-node');
var assert = require('chai').assert;

function generateTokens(len) {
    var path = [];

    while (len) {
        len -= 1;
        path[path.length] = String(Math.floor(Math.random() * 10));
    }

    return path;
}

function generateRandomTokens() {
    var len = Math.round(Math.random() * 10) + 1;

    return generateTokens(len);
}

describe('core/util/ns', function () {
    /*eslint max-nested-callbacks: [2, 5]*/
    var ns = require('../core/util/ns');

    describe('ns.parse(path)', function () {

        it('Should be a function', function () {
            assert.isFunction(ns.parse);
        });

        it('Should parse path to an array of tokens', function () {
            var tests = 100;
            var path;
            var parsed;

            while (tests) {

                tests -= 1;
                path = generateRandomTokens();
                parsed = ns.parse(path.join('.'));

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
                assert.deepEqual(ns.parse(test[0]), test[1]);
            });
        });

        it('Should support token trailing spaces', function () {

            var tests = [
                [' a . b . c ', ['a', 'b', 'c']],
                [' a . b .   c ', ['a', 'b', 'c']]
            ];

            _.forEach(tests, function (test) {
                assert.deepEqual(ns.parse(test[0]), test[1]);
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
                    ns.parse(path);
                }, SyntaxError);
            });
        });

        it('Should cache parsing result', function () {
            var result = ns.parse('a');

            assert.strictEqual(result, ns.parse('a'));
        });
    });

    describe('ns.use(root, path)', function () {
        it('Should return the object placed on path', function () {
            assert.strictEqual(ns.use({a: {b: {c: 42}}}, 'a.b.c'), 42);
            assert.strictEqual(ns.use({a: {b: {c: 42}}}, 'a.b.c.d'), void 0);
        });
    });

    describe('ns.link(root, path, data)', function () {
        it('Should link the data to the root according to path', function () {
            var o = {};
            var tests = [
                ['a.b.c', 42],
                ['a.b.c.d', 100500],
                ['a.y.z', 900]
            ];

            _.forEach(tests, function (test) {
                var res = ns.link(o, test[0], test[1]);
                assert.strictEqual(res, test[1]);
                assert.deepProperty(o, test[0]);
                assert.deepPropertyVal(o, test[0], test[1]);
            });

        });
    });

    describe('ns.add(root, path, data)', function () {
        it('Should extend existing data', function () {
            var o = {};
            var res;

            res = ns.add(o, 'a.b.c', 42);
            assert.strictEqual(res, 42);
            assert.deepProperty(o, 'a.b.c');
            assert.deepPropertyVal(o, 'a.b.c', 42);
            res = ns.add(o, 'a.b', {
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

    describe('ns.has(root, path)', function () {
        it('Should check property existing', function () {
            var o = {
                a: {
                    b: {
                        c: 42
                    }
                }
            };

            assert.ok(ns.has(o, 'a'));
            assert.ok(ns.has(o, 'a.b'));
            assert.ok(ns.has(o, 'a.b.c'));
            assert.ok(!ns.has(o, 'a.b.c.d'));
        });
    });
});
