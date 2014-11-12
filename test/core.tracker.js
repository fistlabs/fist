/*global describe, it*/
'use strict';

var assert = require('chai').assert;

describe('core/tracker', function () {
    /*eslint max-nested-callbacks: [2, 5]*/
    var Tracker = require('../core/tracker');
    var Track = require('../core/track/track');

    it('Should be an instance of core/tracker', function () {
        var tracker = new Tracker();
        assert.instanceOf(tracker, Tracker);
    });

    describe('.include', function () {
        it('Should include plugins', function (done) {
            var tracker = new Tracker();

            tracker.include('test/fixtures/plug/*.js');

            tracker.ready().done(function () {
                assert.strictEqual(tracker.sync, 42);
                assert.strictEqual(tracker.async, 42);
                done();
            });
        });

        it('Should be rejected on init', function (done) {
            var tracker = new Tracker();

            tracker.include('test/fixtures/plug/e/*.js');

            tracker.ready().fail(function (err) {
                assert.strictEqual(err, 42);
                done();
            }).done();
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
    });

    describe('control resolving', function () {
        var Control = require('../core/control/control');

        it('Should stop resolving by returning ' +
            '{Control}', function (done) {

            var tracker = new Tracker();
            var track = new Track(tracker);
            var skip = new Control();

            tracker.unit({
                name: 'a',
                main: function () {

                    return skip;
                }
            });

            tracker.unit({
                name: 'b',
                deps: ['a'],
                main: 'b'
            });

            tracker.unit({
                name: 'c',
                main: 'c'
            });

            tracker.unit({
                name: 'd',
                deps: ['b', 'c'],
                main: 'd'
            });

            tracker.ready().always(function () {
                track.invoke('d').done(function (res) {
                    assert.strictEqual(res, skip);
                    done();
                });
            });
        });
    });
});
