/*global describe, it*/
'use strict';

var assert = require('chai').assert;

describe('core/track/track', function () {
    /*eslint max-nested-callbacks: [2, 5]*/
    var Track = require('../core/track/track');
    var Tracker = require('../core/tracker');

    describe('.invoke', function () {
        it('Should invoke the unit', function (done) {

            var tracker = new Tracker();
            var track = new Track(tracker);

            tracker.unit({
                path: 'a',
                data: 42
            });

            tracker.ready().always(function () {
                track.invoke('a').done(function (res) {
                    assert.strictEqual(res, 42);

                    done();
                });
            });
        });
    });

});
