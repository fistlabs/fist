'use strict';

var Tracker = require('../../../../Tracker');
var Track = require('../../../../track/Track');

var _serial = require('../../../../unit/decl/_serial');

module.exports = [
    function (test) {
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
            test.strictEqual(res, 42);
            test.deepEqual(spy, [['test', 'a'], ['test', 'b']]);
            test.done();
        });
    },
    function (test) {
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
            test.strictEqual(res, 'ERR');
            test.deepEqual(spy, [['test', 'a'], ['test', 'b'], ['test', 'eb']]);
            test.done();
        }).done();
    },
    function (test) {
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

                ctx.resolve(42);
            }
        });

        tracker.on('ctx:notify', function (event) {
            spy.push([event.path, event.data[0]]);
        });

        tracker.resolve(track, 'test').done(function (res) {
            test.strictEqual(res, 42);
            test.deepEqual(spy, [['test', 'a'], ['test', 'b']]);
            test.done();
        });
    },
    function (test) {
        var tracker = new Tracker();
        var track = new Track(tracker);
        var spy = [];

        tracker.unit({
            base: '_serial',
            path: 'test',
            _steps: ['a', 'b'],
            _$a: function (track, ctx) {
                ctx.resolve(40);

                throw 51;
            },
            _$b: function () {

                return 42;
            }
        });

        tracker.on('ctx:notify', function (event) {
            spy.push([event.path, event.data[0]]);
        });

        tracker.resolve(track, 'test').done(function (res) {
            test.strictEqual(res, 40);
            test.deepEqual(spy, [['test', 'a']]);
            test.done();
        });
    },
    function (test) {
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
            _$ea: function (track, ctx) {
                ctx.resolve('ERR');
            },
            _$b: function () {

                return 42;
            }
        });

        tracker.on('ctx:notify', function (event) {
            spy.push([event.path, event.data[0]]);
        });

        tracker.resolve(track, 'test').done(function (res) {
            test.strictEqual(res, 'ERR');
            test.deepEqual(spy, [['test', 'a'], ['test', 'ea']]);
            test.done();
        });
    },
    function (test) {
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

                throw 'ERR';
            },
            _$b: function () {

                return 42;
            }
        });

        tracker.on('ctx:notify', function (event) {
            spy.push([event.path, event.data[0]]);
        });

        tracker.resolve(track, 'test').done(null, function (res) {
            test.strictEqual(res, 'ERR');
            test.deepEqual(spy, [['test', 'a'], ['test', 'ea']]);
            test.done();
        });
    },
    function (test) {
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
            test.strictEqual(res, 'RES');
            test.deepEqual(spy, [['test', 'a'], ['test', 'ea']]);
            test.done();
        });
    }
];
