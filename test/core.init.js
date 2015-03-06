/*eslint max-nested-callbacks: 0, no-proto: 0*/
/*global describe, it*/
'use strict';

var Core = require('../core/core');

var _ = require('lodash-node');
var assert = require('assert');
var errors = require('../core/errors');
var inherit = require('inherit');

function getSilentCore(params) {
    params = _.extend({}, params, {
        logging: {
            enabled: []
        }
    });
    return new Core(params);
}

describe('core/init', function () {

    describe('app.Unit', function () {
        it('Should be a function', function () {
            var app = getSilentCore();
            assert.strictEqual(typeof app.Unit, 'function');
        });

        describe('app.Unit#createCache()', function () {
            it('Should have a method createCache', function () {
                var app = getSilentCore();
                assert.strictEqual(typeof app.Unit.prototype.createCache, 'function');
            });
            it('The result should be unit.cache', function () {
                var app = getSilentCore();
                var cache = {};
                var Unit2 = inherit(app.Unit, {
                    createCache: function () {
                        return cache;
                    }
                });
                var unit = new Unit2();
                assert.strictEqual(unit.cache, cache);
            });
            it('Should return unit.cache if it is an object', function () {
                var app = getSilentCore();
                var cache = {};
                var Unit2 = inherit(app.Unit, {
                    cache: cache
                });
                var unit = new Unit2();
                assert.strictEqual(unit.cache, cache);
            });
            it('Should return app.caches[unit.cache] if it is not an object', function () {
                var app = getSilentCore();
                var cache = {};
                var unit;
                var Unit2;

                app.caches.test = cache;

                Unit2 = inherit(app.Unit, {
                    cache: 'test'
                });
                unit = new Unit2();
                assert.strictEqual(unit.cache, cache);
            });

            it('Should throw FistError if unit.cache is not an object but not a key in app.caches', function () {
                var app = getSilentCore();
                var Unit2;

                Unit2 = inherit(app.Unit, {
                    cache: 'test' + Math.random()
                });
                assert.throws(function () {
                    return new Unit2();
                }, errors.NoSuchCacheError);
            });
        });
    });

});
