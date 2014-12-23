#!/usr/bin/env node
/*eslint no-console: 0, no-nested-ternary: 0*/
'use strict';

var SIZE = 40;

var Benchmark = require('benchmark');
var Core = require('../core/core');
var Suite = Benchmark.Suite;
var Track = require('../core/track');

var app = new Core();
var f = require('util').format;
var uniqueId = require('unique-id');
var size = SIZE;

function noop() {
    return this.name;
}

Benchmark.options.minSamples = 100;

console.log('Crazy deps chain, just for performance debugging');

app.logger.conf({
    logLevel: 'NOTSET'
});

app.unit({
    base: 0,
    name: f('unit_%s', size),
    deps: [f('unit_%s', size - 1), f('unit_%s', size - 2)],
    main: noop
    // ,
    // maxAge: 100
});

size -= 1;

while (size) {
    app.unit({
        base: 0,
        name: f('unit_%s', size),
        deps: size < 2 ?
            [] :
            size < 3 ?
                [f('unit_%s', size - 1)] :
                [
                    f('unit_%s', size - 1),
                    f('unit_%s', size - 2)
                ],
        main: noop
        // ,
        // maxAge: 100
    });
    size -= 1;
}

var suite = new Suite().
    on('cycle', function (e) {
        console.log(String(e.target));
    }).
    add('test', function (defer) {
        run(function () {
            defer.resolve();
        });
    }, {
        defer: true
    });

function run(done) {
    var logger = app.logger.bind(uniqueId());
    var track = new Track(app, logger);
    app.callUnit(track, 'unit_40', null, function () {
        done();
    });
}

app.ready().done(function () {
    suite.run({
        async: true,
        queued: true
    });
});
