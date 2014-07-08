/*global describe, it*/
'use strict';

var assert = require('chai').assert;

describe('fist/util/Cache', function () {
    /*eslint max-nested-callbacks: [2, 5]*/
    var Cache = require('../util/Cache');

    it('Should be an instance of fist/util/Cache', function () {
        assert.instanceOf(new Cache(), Cache);
    });

    describe('.set/.get', function () {

        var cache = new Cache();

        it('Should cache value', function (done) {
            cache.set('a', 42, 10000, function (err) {
                assert.isNull(err);
                cache.get('a', function (err, res) {
                    assert.isNull(err);
                    assert.strictEqual(res, 42);
                    done();
                });
            });
        });

        it('Should not cache value', function (done) {
            cache.set('b', 42, 0, function (err) {
                assert.isNull(err);
                cache.get('b', function (err, res) {
                    assert.isNull(err);
                    assert.strictEqual(res, void 0);
                    done();
                });
            });
        });

        it('Should interpret invalid maxAge as 0', function (done) {
            cache.set('c', 42, NaN, function (err) {
                assert.isNull(err);
                cache.get('c', function (err, res) {
                    assert.isNull(err);
                    assert.strictEqual(res, void 0);
                    done();
                });
            });
        });

    });

});
