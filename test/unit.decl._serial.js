/*global describe, it*/
'use strict';

var assert = require('chai').assert;

describe('fist/unit/decl/_serial', function () {

    var Track = require('../track/Track');
    var Tracker = require('../Tracker');

    it('Should be resolved after a and b steps', function (done) {
        var tracker = new Tracker();
        var track = new Track(tracker);
        var spy = [];

        tracker.unit({
            base: '_serial',
            path: 'test',
            _steps: ['a', 'b'],
            _$a: function () {

                return 40;
            },
            _$b: function (track, ctx) {

                return ctx.data + 2;
            }
        });

        tracker.on('ctx:notify', function (event) {
            spy.push([event.path, event.data[0]]);
        });

        tracker.resolve(track, 'test').done(function (res) {
            assert.strictEqual(res, 42);
            assert.deepEqual(spy, [
                ['test', 'a'],
                ['test', 'b']
            ]);
            done();
        });
    });

    it('Should be rejected after "b" step', function (done) {
        var tracker = new Tracker();
        var track = new Track(tracker);
        var spy = [];

        tracker.unit({
            base: '_serial',
            path: 'test',
            _steps: ['a', 'b'],
            _$a: function () {

                return 40;
            },
            _$b: function () {

                throw 'ERR';
            }
        });

        tracker.on('ctx:notify', function (event) {
            spy.push([event.path, event.data[0]]);
        });

        tracker.resolve(track, 'test').fail(function (res) {
            assert.strictEqual(res, 'ERR');
            assert.deepEqual(spy, [
                ['test', 'a'],
                ['test', 'b'],
                ['test', 'eb']
            ]);
            done();
        }).done();
    });

    it('Should be rejected', function (done) {
        var tracker = new Tracker();
        var track = new Track(tracker);
        var spy = [];

        tracker.unit({
            base: '_serial',
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

        tracker.on('ctx:notify', function (event) {
            spy.push([event.path, event.data[0]]);
        });

        tracker.resolve(track, 'test').done(function (res) {
            assert.strictEqual(res, 'RES');
            assert.deepEqual(spy, [
                ['test', 'a'],
                ['test', 'ea']
            ]);
            done();
        });
    });
});
