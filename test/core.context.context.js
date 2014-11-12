/*global describe, it*/
'use strict';

var Track = require('../core/track/track');
var Tracker = require('../core/tracker');

var _ = require('lodash-node');
var assert = require('chai').assert;
var stdAssert = require('assert');

describe('core/context/context', function () {
    /*eslint max-nested-callbacks: [2, 5]*/
    var Context = require('../core/context/context');
    var tracker = new Tracker({
        appName: 'foo'
    });
    var track = new Track(tracker);

    describe('new Context()', function () {
        var ctx = new Context(track);

        var props = [
            'result',
            'errors',
            'logger'
        ];

        _.forEach(props, function (prop) {
            it('Should have a "' + prop + '" property', function () {
                assert.property(ctx, prop);
                assert.isObject(ctx[prop]);
            });
        });

        it('Should be an instance of Context', function () {
            assert.instanceOf(ctx, Context);
        });

    });

    describe('new Context(track, path, params)', function () {
        var params = {a: 42};
        var ctx = new Context(track, null, params);

        it('Should have a "params" property', function () {
            assert.property(ctx, 'params');
            assert.isObject(ctx.params);
            assert.deepEqual(ctx.params, params);
            assert.strictEqual(ctx.params, params);
        });
    });

    describe('.append', function () {
        it('Should append deps', function (done) {
            var ctx = new Context(track, 'c');

            tracker.unit({
                name: 'a',
                main: 42
            });

            tracker.ready().done(function () {
                ctx.append(['a']).done(function () {
                    stdAssert.deepEqual(ctx.result, {
                        a: 42
                    });

                    done();
                });
            });

        });
    });

    describe('.arg', function () {
        it('Should return parameter', function () {
            var ctx = new Context(track, 'c', {
                a: 42
            });

            assert.strictEqual(ctx.arg('a'), 42);
        });

        it('Should support paths', function () {
            var ctx = new Context(track, 'c', {
                a: {
                    b: 42
                }
            });

            assert.strictEqual(ctx.arg('a.b'), 42);
        });

        it('Should not fail if no params', function () {
            var ctx = new Context(track, 'c');

            assert.strictEqual(ctx.arg('a.b'), void 0);
        });

        it('Should support default value', function () {
            var ctx = new Context(track, 'c');
            var def = {};

            assert.strictEqual(ctx.arg('a.b', def), def);
        });
    });

    describe('.toJSON', function () {
        it('Should serialize to JSON', function () {
            var context = new Context(track);
            stdAssert.deepEqual(context.toJSON(), {
                params: {},
                result: {},
                errors: {}
            });
        });
    });
});
