/*global describe, it*/
'use strict';

var _ = require('lodash-node');
var assert = require('chai').assert;
var Tracker = require('../core/tracker');
var Track = require('../core/track/track');

describe('core/deps/deps', function () {
    /*eslint max-nested-callbacks: [2, 5]*/
    var Deps = require('../core/deps/deps');
    var tracker = new Tracker();
    var track = new Track(tracker);

    describe('new Deps()', function () {

        var ctx = new Deps(track);

        var props = [
            'result',
            'errors',
            'params'
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

    describe('.setRes(path, data)', function () {
        it('Should set data to .res object', function () {
            var ctx = new Deps(track);
            ctx.setRes('a.b.c', 42);
            assert.deepProperty(ctx.result, 'a.b.c');
            assert.deepPropertyVal(ctx.result, 'a.b.c', 42);
        });
    });

    describe('.setErr(path, data)', function () {
        it('Should set data to .ers object', function () {
            var ctx = new Deps(track);
            ctx.setErr('a.b.c', 42);
            assert.deepProperty(ctx.errors, 'a.b.c');
            assert.deepPropertyVal(ctx.errors, 'a.b.c', 42);
        });
    });

    describe('.getRes(path)', function () {
        it('Should get data from .res object', function () {
            var ctx = new Deps(track);
            ctx.setRes('a.b.c', 42);
            assert.strictEqual(ctx.getRes('a.b.c'), 42);
        });
    });

    describe('.getErr(path)', function () {
        it('Should get data from .ers object', function () {
            var ctx = new Deps(track);
            ctx.setErr('a.b.c', 42);
            assert.strictEqual(ctx.getErr('a.b.c'), 42);
        });
    });

    describe('.append', function () {
        it('Should append deps', function (done) {
            var ctx = new Deps(track, 'c');

            tracker.unit({
                path: 'a',
                data: 42
            });

            tracker.ready().then(function () {
                ctx.append(['a', 'b']).then(function () {
                    assert.deepEqual(ctx.result, {
                        a: 42
                    });

                    assert.deepEqual(ctx.errors, {
                        b: void 0
                    });

                    done();
                });
            });

        });
    });

    describe('.trigger', function () {
        it('Should trigger the event', function (done) {
            var ctx = new Deps(track, 'c');

            tracker.on('my-event', function (e) {
                assert.strictEqual(e.trackId, track.id);
                assert.strictEqual(e.path, 'c');
                assert.strictEqual(e.data, 42);
                done();
            });

            ctx.trigger('my-event', 42);
        });
    });

    describe('.arg', function () {
        it('Should return parameter', function () {
            var ctx = new Deps(track, 'c', {
                a: 42
            });

            assert.strictEqual(ctx.arg('a'), 42);
        });
    });
});
