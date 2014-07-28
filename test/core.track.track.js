/*global describe, it*/
'use strict';

var assert = require('chai').assert;

describe('core/track/track', function () {

    var Tracker = require('../core/tracker');
    var Track = require('../core/track/track');

    it('Should invoke unit', function (done) {
        var tracker = new Tracker();
        var track = new Track(tracker);
        var spy = [];

        tracker.unit({
            path: 'a',
            data: function () {
                spy.push(1);
            }
        });

        tracker.unit({
            path: 'b',
            deps: ['a']
        });

        tracker.unit({
            path: 'c',
            deps: ['a']
        });

        tracker.unit({
            path: 'd',
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
            path: 'a',
            data: function (context) {
                assert.deepEqual(context.params, {
                    x: 42
                });
                spy.push(1);
            }
        });

        tracker.unit({
            path: 'b',
            deps: ['a']
        });

        tracker.unit({
            path: 'c',
            deps: ['a']
        });

        tracker.unit({
            path: 'd',
            deps: ['b', 'c']
        });

        tracker.ready().done(function () {
            track.invoke('d', {
                x: 42
            }).done(function () {
                assert.deepEqual(spy, [1, 1]);
                done();
            });
        });

    });

});
