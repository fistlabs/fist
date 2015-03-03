/*eslint max-nested-callbacks: 0, no-proto: 0*/
/*global describe, it*/
'use strict';

var Core = require('../core/core');

var assert = require('assert');

describe('core/init', function () {

    it('Should be an instance of core.Unit', function (done) {
        var core = new Core();
        core.unit({
            name: 'foo'
        });

        core.ready().done(function () {
            assert.ok(core.getUnit('foo') instanceof core.Unit);
            done();
        });
    });

    it('Should have Object params property', function (done) {
        var core = new Core();

        core.unit({
            name: 'foo',
            params: {
                bar: 'baz'
            }
        });

        core.ready().done(function () {
            var unit = core.getUnit('foo');
            assert.ok(unit.params);
            assert.strictEqual(typeof unit.params, 'object');
            assert.deepEqual(unit.params, {
                bar: 'baz'
            });
            done();
        });

    });

    it('Should fail initialization if dependency is undefined', function (done) {
        var core = new Core();

        core.unit({
            base: 0,
            name: 'foo',
            deps: ['bar']
        });

        core.ready().done(null, function (err) {
            assert.ok(err);
            done();
        });
    });

    it('Should fail initialization one of deps is self', function (done) {
        var core = new Core();

        core.unit({
            base: 0,
            name: 'foo',
            deps: ['foo']
        });

        core.ready().done(null, function (err) {
            assert.ok(err);
            done();
        });
    });

    it('Should fail initialization if recursive deps found', function (done) {
        var core = new Core();

        core.unit({
            base: 0,
            name: 'foo',
            deps: ['bar']
        });

        core.unit({
            base: 0,
            name: 'bar',
            deps: ['foo']
        });

        core.ready().done(null, function (err) {
            assert.ok(err);
            done();
        });
    });

});
