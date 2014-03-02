'use strict';

var Ready = require('../../../util/Ready');
var Path = require('path');

module.exports = {

    ready0: function (test) {

        var ready = new Ready({
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

        var ready = new Ready({
            action: Path.resolve('test/stuff/action/data0/error/*.js')
        });

        ready.done(function (err) {
            test.strictEqual(err, 0);
            test.done();
        });
    },

    ready2: function (test) {

        var ready = new Ready({
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
    },

    'Ready.isCap': function (test) {

        var samples;

        samples = ['t', 'tE', 'TEs', 'TeST'];

        samples.forEach(function (s) {
            test.ok( !Ready.isCap(s) );
        });

        samples = ['T', 'AS', 'ASD', 'TEST'];

        samples.forEach(function (s) {
            test.ok(Ready.isCap(s));
        });

        test.done();
    },

    'Ready.convert': function (test) {

        var samples = [
            ['a-b-c', 'aBC'],
            ['foo--bar baz', 'fooBarBaz'],
            ['--harmony', 'Harmony']
        ];

        samples.forEach(function (s) {
            test.strictEqual(Ready.convert(s[0]), s[1]);
        });

        test.done();
    },

    'Ready.toCamel': function (test) {

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
            test.strictEqual(Ready.toCamel(s[0]), s[1]);
        });

        test.done();
    }

};
