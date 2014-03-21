'use strict';

var units = require('../../../plug/units');
var Path = require('path');
var Fist = require('../../../Fist');

module.exports = [

    function (test) {
        var fist = new Fist({
            action: [
                null,
                Path.resolve('test/stuff/action/data0/*.js')
            ]
        });

        units.call(fist, function (err) {
            test.ok(err);
            test.done();
        });
    },

    function (test) {
        var fist = new Fist({
            action: Path.resolve('test/stuff/action/data0/error/*.js')
        });
        units.call(fist, function (err) {
            test.strictEqual(err, 0);
            test.done();
        });
    },

    function (test) {
        var fist = new Fist({
            action: Path.resolve('test/stuff/action/data0/*.js')
        });
        units.call(fist, function (err, res) {

            test.deepEqual(res.map(function (args) {
                test.strictEqual(args.length, 3);
                test.ok(Array.isArray(args));
                test.ok('string' === typeof args[0]);

                return args[0];
            }), ['knot', 'data', 'error', 'index']);

            test.done();
        });
    },

    function (test) {

        var samples;

        samples = ['t', 'tE', 'TEs', 'TeST'];

        samples.forEach(function (s) {
            test.ok( !units.isCap(s) );
        });

        samples = ['T', 'AS', 'ASD', 'TEST'];

        samples.forEach(function (s) {
            test.ok(units.isCap(s));
        });

        test.done();
    },

    function (test) {

        var samples = [
            ['a-b-c', 'aBC'],
            ['foo--bar baz', 'fooBarBaz'],
            ['--harmony', 'Harmony']
        ];

        samples.forEach(function (s) {
            test.strictEqual(units.undash(s[0]), s[1]);
        });

        test.done();
    },

    function (test) {

        var samples = [
            ['data', 'data'],
            ['DATA', 'data'],
            ['Data', 'data'],
            ['HttpData', 'httpData'],
            ['HTTPData', 'httpData'],
            ['http-data', 'httpData'],
            ['http data', 'httpData']
        ];

        samples.forEach(function (s) {
            test.strictEqual(units.toCamel(s[0]), s[1]);
        });

        test.done();
    }

];
