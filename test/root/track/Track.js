'use strict';

var Track = require('../../../track/Track');
var Tracker = require('../../../Tracker');

module.exports = {
    'Track.prototype.invoke': [
        function (test) {
            var tracker = new Tracker();
            var track = new Track(tracker);

            tracker.unit({
                path: 'a',
                data: 42
            });

            track.invoke('a').done(function (res) {
                test.strictEqual(res, 42);
                test.done();
            });
        }
    ]
};
