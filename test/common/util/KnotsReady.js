'use strict';

var KnotsReady = require('../../../util/KnotsReady');
var Path = require('path');

module.exports = {

    ready0: function (test) {

        var ready = new KnotsReady({
            action: [
                null,
                Path.resolve('test/stuff/action/data0/*.js')
            ]
        });

        ready.done(function (err) {
            test.ok(err);
            test.done();
        });
    },

    ready1: function (test) {

        var ready = new KnotsReady({
            action: Path.resolve('test/stuff/action/data0/error/*.js')
        });

        ready.done(function (err) {
            test.strictEqual(err, 0);
            test.done();
        });
    },

    ready2: function (test) {

        var ready = new KnotsReady({
            action: Path.resolve('test/stuff/action/data0/*.js')
        });

        ready.done(function (err, res) {

            test.deepEqual(res.map(function (args) {
                test.strictEqual(args.length, 3);
                test.ok(Array.isArray(args));
                test.ok('string' === typeof args[0]);

                return args[0];
            }), ['knot', 'data', 'error', 'index']);

            test.done();
        });
    }

};
