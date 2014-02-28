'use strict';

var KnotsReady = require('../util/KnotsReady');
var Path = require('path');

module.exports = {

    ready0: function (test) {

        var ready = new KnotsReady({
            action: [
                null,
                Path.resolve('test/data')
            ]
        });

        ready.done(function (err) {
            test.ok(err);
            test.done();
        });
    },

    ready1: function (test) {

        var ready = new KnotsReady({
            action: Path.resolve('test/data/error/*.js')
        });

        ready.done(function (err) {
            test.strictEqual(err, 0);
            test.done();
        });
    }

};
