/*global describe, it*/
'use strict';

var assert = require('chai').assert;

describe('fist/track/Track', function () {
    /*eslint max-nested-callbacks: [2, 4]*/
    var Track = require('../track/Track');
    var Tracker = require('../Tracker');

    describe('.invoke', function () {
        it('Should invoke the unit', function (done) {

            var tracker = new Tracker();
            var track = new Track(tracker);

            tracker.unit({
                path: 'a',
                data: 42
            });

            track.invoke('a').done(function (res) {
                assert.strictEqual(res, 42);

                done();
            });
        });
    });

});
