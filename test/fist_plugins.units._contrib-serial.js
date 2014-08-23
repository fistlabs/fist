/*global describe, it*/
'use strict';

var Control = require('../core/control/control');

var assert = require('chai').assert;

describe('fist_plugins/units/_contrib-serial', function () {
    var Track = require('../core/track/track');
    var Tracker = require('../core/tracker');
    var _serial = require('../fist_plugins/units/_contrib-serial');

    it('Should be resolved after a and b steps', function (done) {
        var tracker = new Tracker();
        var track = new Track(tracker);
        var spy = [];

        tracker.plug(_serial);

        tracker.unit({
            base: '_contrib-serial',
            path: 'test',
            _steps: ['a', 'b'],
            _$a: function () {

                return 40;
            },
            _$b: function (track, context) {

                return context.data + 2;
            }
        });

        tracker.channel('ctx').on('a', function () {
            spy.push('a');
        }).on('b', function () {
            spy.push('b');
        });

        tracker.ready().always(function () {
            track.invoke('test').done(function (res) {
                assert.strictEqual(res, 42);
                assert.deepEqual(spy, ['a', 'b']);
                done();
            });
        }).done();
    });

    it('Should be rejected after "b" step', function (done) {
        var tracker = new Tracker();
        var track = new Track(tracker);
        var spy = [];

        tracker.plug(_serial);

        tracker.unit({
            base: '_contrib-serial',
            path: 'test',
            _steps: ['a', 'b'],
            _$a: function () {

                return 40;
            },
            _$b: function () {

                throw 'ERR';
            }
        });

        tracker.channel('ctx').on('a', function () {
            spy.push('a');
        }).on('b', function () {
            spy.push('b');
        }).on('eb', function () {
            spy.push('eb');
        });

        tracker.ready().always(function () {
            track.invoke('test').fail(function (res) {
                assert.strictEqual(res, 'ERR');
                assert.deepEqual(spy, ['a', 'b', 'eb']);
                done();
            }).done();
        });
    });

    it('Should be rejected', function (done) {
        var tracker = new Tracker();
        var track = new Track(tracker);
        var spy = [];

        tracker.plug(_serial);

        tracker.unit({
            base: '_contrib-serial',
            path: 'test',
            _steps: ['a', 'b'],
            _$a: function () {

                throw 51;
            },
            _$ea: function () {

                return 'RES';
            },
            _$b: function () {

                return 42;
            }
        });

        tracker.channel('ctx').on('a', function () {
            spy.push('a');
        }).on('ea', function () {
            spy.push('ea');
        }).on('b', function () {
            spy.push('b');
        });

        tracker.ready().always(function () {
            track.invoke('test').done(function (res) {
                assert.strictEqual(res, 'RES');
                assert.deepEqual(spy, ['a', 'ea']);
                done();
            });
        });
    });

    it('Should be resolved by Control', function (done) {
        var tracker = new Tracker();
        var track = new Track(tracker);
        var spy = [];
        var skip = new Control();

        tracker.plug(_serial);

        tracker.unit({
            base: '_contrib-serial',
            path: 'test',
            _steps: ['a', 'b'],
            _$a: function () {

                return skip;
            },
            _$b: function (track, context) {

                return context.data + 2;
            }
        });

        tracker.channel('ctx').on('a', function () {
            spy.push('a');
        }).on('b', function () {
            spy.push('b');
        });

        tracker.ready().always(function () {
            track.invoke('test').done(function (res) {
                assert.strictEqual(res, skip);
                assert.deepEqual(spy, ['a']);
                done();
            });
        });
    });
});
