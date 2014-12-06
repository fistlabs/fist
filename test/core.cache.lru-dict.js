/*eslint max-nested-callbacks: 0*/
/*global describe, it*/
'use strict';

var assert = require('assert');

describe('core/cache/lru-dict', function () {
    var LRUDict = require('../core/cache/lru-dict');

    describe('new LRUDict()', function () {

        it('Should be an instance of LRUDict', function () {
            assert.ok(new LRUDict() instanceof LRUDict);
        });

        it('Should take size', function () {
            var dict = new LRUDict(42);
            assert.ok(dict.size);
            assert.strictEqual(dict.size, 42);
        });

        it('Should have length', function () {
            var dict = new LRUDict(3);
            assert.strictEqual(dict.length, 0);
        });
    });

    describe('dict.set()', function () {
        it('Should set entry', function () {
            var dict = new LRUDict();
            dict.set('foo', 42);
            assert.strictEqual(dict.links.foo.data, 42);
            assert.strictEqual(dict.length, 1);
        });

        it('Should not exceed size', function () {
            var dict = new LRUDict(3);

            dict.set('foo', 42);
            assert.strictEqual(dict.links.foo.data, 42);
            assert.strictEqual(dict.length, 1);

            dict.set('foo', 43);
            assert.strictEqual(dict.links.foo.data, 43);
            assert.strictEqual(dict.length, 1);

            dict.set('bar', 44);
            assert.strictEqual(dict.links.foo.data, 43);
            assert.strictEqual(dict.links.bar.data, 44);
            assert.strictEqual(dict.length, 2);

            dict.set('zot', 45);
            assert.strictEqual(dict.links.foo.data, 43);
            assert.strictEqual(dict.links.bar.data, 44);
            assert.strictEqual(dict.links.zot.data, 45);
            assert.strictEqual(dict.length, 3);

            dict.set('foo', 46);
            assert.strictEqual(dict.links.foo.data, 46);
            assert.strictEqual(dict.links.bar.data, 44);
            assert.strictEqual(dict.links.zot.data, 45);
            assert.strictEqual(dict.length, 3);

            dict.set('moo', 47);
            assert.strictEqual(dict.links.bar, void 0);
            assert.strictEqual(dict.links.foo.data, 46);
            assert.strictEqual(dict.links.zot.data, 45);
            assert.strictEqual(dict.links.moo.data, 47);
            assert.strictEqual(dict.length, 3);
        });

        it('Should not set anything if size is not normal', function () {
            var dict = new LRUDict(0);

            dict.set('foo', 42);
            assert.strictEqual(dict.links.foo, void 0);
            assert.strictEqual(dict.length, 0);

            dict.size = -1;

            dict.set('foo', 42);
            assert.strictEqual(dict.links.foo, void 0);
            assert.strictEqual(dict.length, 0);
        });
    });

    describe('dict.get()', function () {
        it('Should get link value', function () {
            var dict = new LRUDict(3);
            dict.set('foo', 42);
            assert.strictEqual(dict.get('foo'), 42);
            assert.strictEqual(dict.get('bar'), void 0);
        });
    });

    describe('dict.keys()', function () {
        it('Should return dict keys', function () {
            var dict = new LRUDict();
            dict.set('foo', 42);
            dict.set('bar', 42);
            assert.deepEqual(dict.keys(), ['foo', 'bar']);
        });

        it('Should have priority order', function () {
            var dict = new LRUDict(3);
            dict.set('foo', 42);
            dict.set('bar', 43);
            assert.deepEqual(dict.keys(), ['foo', 'bar']);
            dict.get('foo');
            assert.deepEqual(dict.keys(), ['bar', 'foo']);
            dict.set('zot', 44);
            assert.deepEqual(dict.keys(), ['bar', 'foo', 'zot']);
            dict.get('bar');
            dict.get('zot');
            assert.deepEqual(dict.keys(), ['foo', 'bar', 'zot']);
        });
    });

    describe('dict.peek()', function () {
        it('Should return value but should not touch priority', function () {
            var dict = new LRUDict(3);
            dict.set('foo', 1);
            dict.set('bar', 2);
            dict.set('zot', 3);
            assert.strictEqual(dict.peek('bar'), 2);
            assert.strictEqual(dict.peek('omg'), void 0);
            assert.deepEqual(dict.keys(), ['foo', 'bar', 'zot']);
        });
    });

    describe('dict.vals()', function () {
        it('Should return array of dict values', function () {
            var dict = new LRUDict(3);
            dict.set('foo', 1);
            dict.set('bar', 2);
            dict.set('zot', 3);
            assert.deepEqual(dict.vals(), [1, 2, 3]);
        });
    });

    describe('dict.del()', function () {
        it('Should delete link', function () {
            var dict = new LRUDict(3);
            dict.set('foo', 1);
            dict.set('bar', 2);
            dict.set('zot', 3);
            assert.strictEqual(dict.length, 3);

            assert.ok(dict.del('bar'));
            assert.strictEqual(dict.peek('bar'), void 0);
            assert.strictEqual(dict.length, 2);
            assert.ok(!dict.del('bar'));

            assert.ok(dict.del('foo'));
            assert.strictEqual(dict.peek('foo'), void 0);
            assert.strictEqual(dict.length, 1);
            assert.ok(!dict.del('foo'));

            assert.ok(dict.del('zot'));
            assert.strictEqual(dict.peek('zot'), void 0);
            assert.strictEqual(dict.length, 0);
            assert.ok(!dict.del('zot'));
        });
    });

    describe('link.index()', function () {
        it('Should return link index', function () {
            var dict = new LRUDict();
            dict.set('foo', 42);
            dict.set('bar', 43);
            dict.set('zot', 44);

            assert.strictEqual(dict.links.foo.index(), 0);
            assert.strictEqual(dict.links.bar.index(), 1);
            assert.strictEqual(dict.links.zot.index(), 2);

            dict.get('bar');

            assert.strictEqual(dict.links.foo.index(), 0);
            assert.strictEqual(dict.links.bar.index(), 2);
            assert.strictEqual(dict.links.zot.index(), 1);
        });
    });
});
