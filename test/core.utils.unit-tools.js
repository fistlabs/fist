/*eslint max-nested-callbacks: 0, no-proto: 0*/
/*global describe, it*/

'use strict';

var assert = require('assert');

describe('core/utils/unit-tools', function () {
    var utools = require('../core/utils/unit-tools');

    describe('utools.buildDeps()', function () {
        it('Should make deps unique', function () {
            var unit = {
                deps: ['a', 'b', 'c', 'a', 'b', 'c']
            };
            var deps = utools.buildDeps(unit);
            assert.deepEqual(deps, ['a', 'b', 'c']);
        });

        it('Should be frozen', function () {
            var unit = {
                deps: []
            };
            var deps = utools.buildDeps(unit);
            assert.ok(Object.isFrozen(deps));
        });
    });

    describe('utools.buildDepsMap()', function () {
        it('Should build deps map', function () {
            var unit = {
                deps: ['a', 'b'],
                depsMap: {
                    a: 'foo',
                    b: 'bar'
                }
            };
            var map = utools.buildDepsMap(unit);
            assert.deepEqual(map, {
                a: 'foo',
                b: 'bar'
            });
        });

        it('Should use dep name as mapped if omitted', function () {
            var unit = {
                deps: ['a', 'b'],
                depsMap: {}
            };
            var map = utools.buildDepsMap(unit);
            assert.deepEqual(map, {
                a: 'a',
                b: 'b'
            });
        });
    });

    describe('utools.buildDepsArgs()', function () {
        it('Should build deps args factories, bound to unit context', function () {
            var spy = 0;
            var aArgs = {};
            var unit = {
                deps: ['a', 'b'],
                depsArgs: {
                    a: function () {
                        spy += 1;
                        assert.strictEqual(this, unit);
                        return aArgs;
                    }
                }
            };
            var depsArgs = utools.buildDepsArgs(unit);
            assert.strictEqual(typeof depsArgs.a, 'function');
            assert.strictEqual(typeof depsArgs.b, 'function');

            assert.strictEqual(depsArgs.a(), aArgs);
            assert.strictEqual(depsArgs.b(), void 0);
            assert.strictEqual(spy, 1);
        });
    });

    describe('utools.buildDepsIndex()', function () {
        it('Should create deps indexes by names', function () {
            var unit = {
                deps: ['a', 'b']
            };
            var depsIndex = utools.buildDepsIndex(unit);
            assert.deepEqual(depsIndex, {
                a: 0,
                b: 1
            });
        });
    });

    describe('utools.buildCache()', function () {
        it('Should throw error if unit.cache is unknown', function () {
            var unit = {
                cache: 'foo',
                app: {
                    caches: {}
                }
            };

            assert.throws(function () {
                return utools.buildCache(unit);
            });
        });

        it('Should return corresponding cache', function () {
            var cache = {};
            var unit = {
                cache: 'foo',
                app: {
                    caches: {
                        foo: cache
                    }
                }
            };
            assert.strictEqual(utools.buildCache(unit), cache);
        });
    });
});
