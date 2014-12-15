/*eslint max-nested-callbacks: 0*/
/*global describe, it*/
'use strict';

var assert = require('assert');

describe('core/cache/lru-dict-ttl-async', function () {
    var LRUDictTtlAsync = require('../core/cache/lru-dict-ttl-async');

    function get(size) {
        return new LRUDictTtlAsync(size);
    }

    describe('dict.set()', function () {
        it('Should set value async', function (done) {
            var dict = get();
            dict.set('foo', 42, 50, function (err) {
                assert.strictEqual(err, null);
                assert.strictEqual(dict.length, 1);
                done();
            });
        });

        it('Ttl should be optional', function (done) {
            var dict = get();
            dict.set('foo', 42, function (err) {
                assert.strictEqual(err, null);
                assert.strictEqual(dict.length, 1);
                done();
            });
        });
    });

    describe('dict.get()', function () {
        it('Should have async get', function (done) {
            var dict = get();
            dict.set('foo', 42, function (err) {
                assert.strictEqual(err, null);
                assert.strictEqual(dict.length, 1);
                dict.get('foo', function (err, res) {
                    assert.strictEqual(err, null);
                    assert.strictEqual(dict.length, 1);
                    assert.strictEqual(res, 42);
                    done();
                });
            });
        });
    });

    describe('dict.peek()', function () {
        it('Should have async peek', function (done) {
            var dict = get();
            dict.set('foo', 42, function (err) {
                assert.strictEqual(err, null);
                assert.strictEqual(dict.length, 1);
                dict.peek('foo', function (err, res) {
                    assert.strictEqual(err, null);
                    assert.strictEqual(dict.length, 1);
                    assert.strictEqual(res, 42);
                    done();
                });
            });
        });
    });

    describe('dict.del()', function () {
        it('Should have async del', function (done) {
            var dict = get();
            dict.set('foo', 42, function (err) {
                assert.strictEqual(err, null);
                assert.strictEqual(dict.length, 1);
                dict.del('foo', function (err, res) {
                    assert.strictEqual(err, null);
                    assert.strictEqual(dict.length, 0);
                    assert.strictEqual(res, true);
                    done();
                });
            });
        });
    });

    describe('dict.keys()', function () {
        it('Should have async keys', function (done) {
            var dict = get();
            dict.set('foo', 42, function (err) {
                assert.strictEqual(err, null);
                assert.strictEqual(dict.length, 1);
                dict.keys(function (err, res) {
                    assert.strictEqual(err, null);
                    assert.strictEqual(dict.length, 1);
                    assert.deepEqual(res, ['foo']);
                    done();
                });
            });
        });
    });

    describe('dict.vals()', function () {
        it('Should have async vals', function (done) {
            var dict = get();
            dict.set('foo', 42, function (err) {
                assert.strictEqual(err, null);
                assert.strictEqual(dict.length, 1);
                dict.vals(function (err, res) {
                    assert.strictEqual(err, null);
                    assert.strictEqual(dict.length, 1);
                    assert.deepEqual(res, [42]);
                    done();
                });
            });
        });
    });
});
