/*global describe, it*/
'use strict';

var assert = require('chai').assert;

describe('core/track/track', function () {
    /*eslint max-nested-callbacks: [2, 4]*/
    var Tracker = require('../core/tracker');
    var Track = require('../core/track/track');

    describe('.invoke', function () {
        it('Should resolve unit', function (done) {
            var tracker = new Tracker();
            var track = new Track(tracker);

            tracker.unit({
                name: 'a',
                data: function () {

                    return 42;
                }
            });

            tracker.ready().always(function () {
                track.invoke('a').done(function (res) {
                    assert.strictEqual(res, 42);
                    done();
                });
            });
        });

        it('Should reject undefined unit', function (done) {
            var tracker = new Tracker();
            var track = new Track(tracker);

            tracker.ready().always(function () {
                track.invoke('a').fail(function () {
                    done();
                }).done();
            });
        });

        it('Should resolve unit deps before call (0)', function (done) {
            var tracker = new Tracker();
            var track = new Track(tracker);

            tracker.unit({
                name: 'a',
                deps: ['b'],
                data: function (track, context) {
                    assert.strictEqual(context.result.get('b'), 'b');

                    return 'a';
                }
            });

            tracker.unit({
                name: 'b',
                data: 'b'
            });

            tracker.ready().always(function () {
                track.invoke('a').done(function (res) {
                    assert.strictEqual(res, 'a');
                    done();
                });
            });
        });

        it('Should resolve unit deps before call (1)', function (done) {
            var tracker = new Tracker();
            var track = new Track(tracker);

            tracker.unit({
                name: 'a',
                deps: ['b'],
                data: function () {
                    //  should not be called
                    assert.ok(false);

                    return 'a';
                }
            });

            tracker.ready().always(function () {
                track.invoke('a').fail(function () {
                    done();
                }).done();
            });
        });

        it('Should not resolve unit a twice', function (done) {
            var tracker = new Tracker();
            var track = new Track(tracker);

            tracker.unit({
                name: 'a',
                deps: ['c'],
                data: function (track, context) {
                    assert.strictEqual(context.result.get('c'), 'c');

                    return 'a';
                }
            });

            tracker.unit({
                name: 'b',
                deps: ['c'],
                data: function (track, context) {
                    assert.strictEqual(context.result.get('c'), 'c');

                    return 'b';
                }
            });

            tracker.unit({
                name: 'c',
                i: 0,
                data: function () {
                    assert.strictEqual(this.i, 0);
                    this.i += 1;

                    return 'c';
                }
            });

            tracker.unit({
                name: 'x',
                deps: ['a', 'b'],
                data: function (track, context) {
                    assert.strictEqual(context.result.get('a'), 'a');
                    assert.strictEqual(context.result.get('b'), 'b');

                    return 'x';
                }
            });

            tracker.ready().always(function () {
                track.invoke('x').done(function (res) {
                    assert.strictEqual(res, 'x');
                    assert.strictEqual(this.getUnit('c').i, 1);
                    done();
                }, tracker);
            });
        });

        it('Should invoke unit', function (done) {
            var tracker = new Tracker();
            var track = new Track(tracker);
            var spy = [];

            tracker.unit({
                name: 'a',
                data: function () {
                    spy.push(1);
                }
            });

            tracker.unit({
                name: 'b',
                deps: ['a']
            });

            tracker.unit({
                name: 'c',
                deps: ['a']
            });

            tracker.unit({
                name: 'd',
                deps: ['b', 'c']
            });

            tracker.ready().done(function () {
                track.invoke('d').done(function () {
                    assert.deepEqual(spy, [1]);
                    done();
                });
            });
        });

        it('Should not cache calling', function (done) {
            var tracker = new Tracker();
            var track = new Track(tracker);
            var spy = [];

            tracker.unit({
                name: 'a',
                data: function () {
                    spy.push(1);
                }
            });

            tracker.unit({
                name: 'b',
                deps: ['a']
            });

            tracker.unit({
                name: 'c',
                deps: ['a']
            });

            tracker.unit({
                name: 'd',
                deps: ['b', 'c'],
                data: function (track, context) {
                    return context.arg('x');
                }
            });

            tracker.ready().done(function () {
                track.invoke('d', {
                    x: 42
                }).done(function (data) {
                    assert.strictEqual(data, 42);
                    assert.deepEqual(spy, [1]);
                    track.invoke('d', {
                        x: 43
                    }).done(function (data) {
                        assert.strictEqual(data, 43);
                        assert.deepEqual(spy, [1]);

                        done();
                    });
                });
            });
        });
    });
});
