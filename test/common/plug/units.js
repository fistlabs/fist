'use strict';

var units = require('../../../plug/units');
var Path = require('path');
var Framework = require('../../../Framework');

module.exports = [

    function (test) {
        var fist = new Framework({
            action: [
                null,
                Path.resolve('test/stuff/action/data0/*.js')
            ]
        });

        fist.plug(units);

        fist.on('sys:error', function (err) {
            test.ok(err);
            test.done();
        });

        fist.ready();
    },

    function (test) {
        var fist = new Framework({
            action: Path.resolve('test/stuff/action/data0/error/*.js')
        });

        fist.plug(units);

        fist.on('sys:error', function (err) {
            test.strictEqual(err, 0);
            test.done();
        });

        fist.ready();
    },

    function (test) {
        var fist = new Framework({
            action: Path.resolve('test/stuff/action/data0/*.js')
        });

        fist.plug(units);

        fist.on('sys:ready', function () {
            test.deepEqual(Object.keys(this.decls).sort(),
                ['knot', 'data', 'error', 'index'].sort());
            test.done();
        });

        fist.ready();
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
