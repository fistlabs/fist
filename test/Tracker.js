/*global describe, it*/
'use strict';

var Path = require('path');
var assert = require('chai').assert;

describe('fist/Tracker', function () {
    /*eslint max-nested-callbacks: [2, 4]*/
    var Tracker = require('../Tracker');
    var Track = require('../track/Track');

    it('Should be an instance of fist/Tracker', function () {
        var tracker = new Tracker();
        assert.instanceOf(tracker, Tracker);
        assert.isObject(tracker.tasks);
    });

    describe('Should automatically add bundled units', function () {

        var bundledUnits = Path.resolve(__dirname,
            '..', 'unit', 'decl', '**', '*.js');

        it('not defined', function () {
            var tracker = new Tracker();
            assert.deepEqual(tracker.params.units, [
                bundledUnits
            ]);
        });

        it('defined by no-array', function () {
            var tracker = new Tracker({
                units: 'foo'
            });
            assert.deepEqual(tracker.params.units, [
                bundledUnits,
                'foo'
            ]);
        });

        it('defined by array', function () {
            var tracker = new Tracker({
                units: ['foo']
            });
            assert.deepEqual(tracker.params.units, [
                bundledUnits,
                'foo'
            ]);
        });
    });

    describe('.resolve', function () {
        it('Should resolve unit', function (done) {

            var tracker = new Tracker();
            var track = new Track(tracker);

            tracker.unit({
                path: 'a',
                data: function () {

                    return 42;
                }
            });

            tracker.resolve(track, 'a').done(function (res) {
                assert.strictEqual(res, 42);
                done();
            });
        });

        it('Should reject undefined unit', function (done) {

            var tracker = new Tracker();
            var track = new Track(tracker);

            tracker.resolve(track, 'a').fail(function (err) {
                assert.isUndefined(err);
                done();
            }).done();
        });

        it('Should resolve unit deps before call', function (done) {

            var tracker = new Tracker();
            var track = new Track(tracker);

            tracker.unit({
                path: 'a',
                deps: ['b'],
                data: function (track, ctx) {
                    assert.strictEqual(ctx.res.b, 'b');

                    return 'a';
                }
            });

            tracker.unit({
                path: 'b',
                data: 'b'
            });

            tracker.resolve(track, 'a').done(function (res) {
                assert.strictEqual(res, 'a');
                done();
            });
        });

        it('Should resolve unit deps before call', function (done) {

            var tracker = new Tracker();
            var track = new Track(tracker);

            tracker.unit({
                path: 'a',
                deps: ['b'],
                data: function (track, ctx) {
                    assert.isUndefined(ctx.ers.b);

                    return 'a';
                }
            });

            tracker.resolve(track, 'a').done(function (res) {
                assert.strictEqual(res, 'a');
                done();
            });
        });

        it('Should not resolve unit a twice', function (done) {

            var tracker = new Tracker();
            var track = new Track(tracker);

            tracker.unit({
                path: 'a',
                deps: ['c'],
                data: function (track, deps) {
                    assert.strictEqual(deps.res.c, 'c');

                    return 'a';
                }
            });

            tracker.unit({
                path: 'b',
                deps: ['c'],
                data: function (track, deps) {
                    assert.strictEqual(deps.res.c, 'c');

                    return 'b';
                }
            });

            tracker.unit({
                path: 'c',
                i: 0,
                data: function () {
                    assert.strictEqual(this.i, 0);
                    this.i += 1;

                    return 'c';
                }
            });

            tracker.unit({
                path: 'x',
                deps: ['a', 'b'],
                data: function (track, deps) {
                    assert.strictEqual(deps.res.a, 'a');
                    assert.strictEqual(deps.res.b, 'b');

                    return 'x';
                }
            });

            tracker.resolve(track, 'x').done(function (res) {
                assert.strictEqual(res, 'x');
                assert.strictEqual(this.getUnit('c').i, 1);
                done();
            }, tracker);
        });

    });

    describe('.plug', function () {
        it('Should be ready when plugins resolved', function (done) {
            var spy = [];
            var tracker = new Tracker();

            tracker.plug(function (done) {
                setTimeout(function () {
                    spy.push(1);
                    done();
                }, 0);
            });

            tracker.plug(function (done) {
                setTimeout(function () {
                    spy.push(2);
                    done();
                }, 10);
            });

            tracker.ready().done(function () {
                assert.deepEqual(spy, [1, 2]);
                done();
            });
        });

        it('Should be failed coz plugin rejected', function (done) {

            var tracker = new Tracker();

            tracker.plug(function (done) {
                setTimeout(function () {
                    done();
                }, 0);
            });

            tracker.plug(function (done) {
                setTimeout(function () {
                    done('ERR');
                }, 10);
            });

            tracker.ready().fail(function (err) {
                assert.strictEqual(err, 'ERR');
                done();
            });
        });

        it('Should catch plugin exception', function (done) {
            var tracker = new Tracker();

            tracker.plug(function (done) {
                setTimeout(function () {
                    done();
                }, 0);
            });

            tracker.plug(function () {

                throw 'ERR';
            });

            tracker.ready().fail(function (err) {
                assert.strictEqual(err, 'ERR');
                done();
            }).done();
        });

        it('Should trigger a lot of events', function (done) {
            var tracker = new Tracker();
            var track = new Track(tracker);
            var spy = [];

            tracker.on('ctx:pending', function (e) {
                assert.strictEqual(e.trackId, track.id);
                spy.push([-1, e.path]);
            });

            tracker.on('ctx:notify', function (e) {
                assert.strictEqual(e.trackId, track.id);
                spy.push([2, e.path]);
            });

            tracker.on('ctx:accept', function (e) {
                assert.strictEqual(e.trackId, track.id);
                spy.push([0, e.path]);
            });

            tracker.on('ctx:reject', function (e) {
                assert.strictEqual(e.trackId, track.id);
                spy.push([1, e.path]);
            });

            tracker.unit({
                path: 'a',
                deps: ['b', 'c'],
                data: function (track, ctx) {
                    ctx.notify('a');

                    return 'a';
                }
            });

            tracker.unit({
                path: 'b',
                deps: ['c'],
                data: function (track, ctx) {
                    ctx.notify('b');

                    throw 'b';
                }
            });

            tracker.unit({
                path: 'c',
                data: function (track, ctx) {
                    ctx.notify('c');

                    return 'c';
                }
            });

            tracker.resolve(track, 'a').done(function (res) {
                assert.strictEqual(res, 'a');
                assert.deepEqual(spy, [
                    [-1, 'a'],
                    [-1, 'b'],
                    [-1, 'c'],
                    [2, 'c'],
                    [0, 'c'],
                    [2, 'b'],
                    [1, 'b'],
                    [2, 'a'],
                    [0, 'a']
                ]);

                done();
            });
        });
    });

});