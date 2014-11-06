/*global describe, it*/
'use strict';

var Track = require('../core/track/track');
var Tracker = require('../core/tracker');

var _ = require('lodash-node');
var assert = require('chai').assert;
var stdAssert = require('assert');

describe('core/deps/deps', function () {
    /*eslint max-nested-callbacks: [2, 5]*/
    var Deps = require('../core/deps/deps');
    var tracker = new Tracker();
    var track = new Track(tracker);

    describe('new Deps()', function () {
        var ctx = new Deps(track);

        var props = [
            'result',
            'errors'
        ];

        _.forEach(props, function (prop) {
            it('Should have a "' + prop + '" property', function () {
                assert.property(ctx, prop);
                assert.isObject(ctx[prop]);
            });
        });

        it('Should be an instance of Deps', function () {
            assert.instanceOf(ctx, Deps);
        });

    });

    describe('new Deps(track, path, params)', function () {
        var params = {a: 42};
        var ctx = new Deps(null, null, params);

        it('Should have a "params" property', function () {
            assert.property(ctx, 'params');
            assert.isObject(ctx.params);
            assert.deepEqual(ctx.params, params);
            assert.strictEqual(ctx.params, params);
        });
    });

    describe('.append', function () {
        it('Should append deps', function (done) {
            var ctx = new Deps(track, 'c');

            tracker.unit({
                path: 'a',
                data: 42
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

    describe('.trigger', function () {
        it('Should trigger the event', function (done) {
            var ctx = new Deps(track, 'c');

            tracker.channel('ctx').on('my-event', function (e) {
                assert.strictEqual(e.trackId, track.id);
                assert.strictEqual(e.path, 'c');
                assert.strictEqual(e.data, 42);
                done();
            });

            ctx.trigger('my-event', 42);
        });
    });

    describe('.args', function () {

        it('Should return args', function () {
            var ctx = new Deps(track, 'c', {
                a: 42
            });
            var args = ctx.args();

            assert.deepEqual(args, {
                a: 42
            });

            assert.strictEqual(args, ctx.args());
        });
    });

    describe('.arg', function () {
        it('Should return parameter', function () {
            var ctx = new Deps(track, 'c', {
                a: 42
            });

            assert.strictEqual(ctx.arg('a'), 42);
        });

        it('Should support paths', function () {
            var ctx = new Deps(track, 'c', {
                a: {
                    b: 42
                }
            });

            assert.strictEqual(ctx.arg('a.b'), 42);
        });

        it('Should not fail if no params', function () {
            var ctx = new Deps(track, 'c');

            assert.strictEqual(ctx.arg('a.b'), void 0);
        });

        it('Should support default value', function () {
            var ctx = new Deps(track, 'c');
            var def = {};

            assert.strictEqual(ctx.arg('a.b', def), def);
        });
    });

    describe('.toJSON', function () {
        it('Should serialize to JSON', function () {
            var context = new Deps();
            stdAssert.deepEqual(context.toJSON(), {
                params: {},
                result: {},
                errors: {}
            });
        });
    });
});
