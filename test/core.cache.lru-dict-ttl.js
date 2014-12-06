/*eslint max-nested-callbacks: 0*/
/*global describe, it*/
'use strict';

var assert = require('assert');

describe('core/cache/lru-dict-ttl', function () {
    var LRUDictTtl = require('../core/cache/lru-dict-ttl');

    it('Should set Infinity ttl by default', function (done) {
        var dict = new LRUDictTtl();
        dict.set('foo', 42);
        setTimeout(function () {
            assert.strictEqual(dict.get('foo'), 42);
            done();
        }, 50);
    });

    it('Should set ttl to entries', function (done) {
        var dict = new LRUDictTtl();
        dict.set('foo', 42, 0.09);
        setTimeout(function () {
            assert.strictEqual(dict.get('foo'), 42);
            setTimeout(function () {
                assert.strictEqual(dict.get('foo'), void 0);
                assert.strictEqual(dict.get('foo'), void 0);
                assert.strictEqual(dict.length, 0);
                done();
            }, 50);
        }, 50);
    });

    describe('dict.peek()', function () {
        it('Should return value', function () {
            var dict = new LRUDictTtl();
            dict.set('foo', 42);
            assert.strictEqual(dict.peek('foo'), 42);
        });
    });

    describe('dict.keys()', function () {
        it('Should return keys', function () {
            var dict = new LRUDictTtl();
            dict.set('foo', 42);
            assert.deepEqual(dict.keys(), ['foo']);
        });

        it('Should return only actual keys', function (done) {
            var dict = new LRUDictTtl();
            dict.set('a', 42, 0.01);
            dict.set('b', 42, 0.01);
            dict.set('c', 42);
            dict.set('d', 42);
            dict.set('e', 42, 0.01);
            dict.set('f', 42);

            setTimeout(function () {
                assert.deepEqual(dict.keys(), ['c', 'd', 'f']);
                assert.strictEqual(dict.length, 3);
                done();
            }, 50);
        });
    });

    describe('dict.vals()', function () {
        it('Should return vals', function () {
            var dict = new LRUDictTtl();
            dict.set('foo', 42);
            assert.deepEqual(dict.vals(), [42]);
        });

        it('Should return only actual vals', function (done) {
            var dict = new LRUDictTtl();

            dict.set('a', 1, 0.01);
            dict.set('b', 2, 0.01);
            dict.set('c', 3);
            dict.set('d', 4);
            dict.set('e', 5, 0.01);
            dict.set('f', 6);

            setTimeout(function () {
                assert.deepEqual(dict.vals(), [3, 4, 6]);
                assert.strictEqual(dict.length, 3);
                done();
            }, 50);
        });
    });
});
