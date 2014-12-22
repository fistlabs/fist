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

function noop() {
    return this.name;
}

Benchmark.options.minSamples = 100;

console.log('Crazy deps chain, just for speed up debugging');

app.logger.conf({
    logLevel: 'NOTSET'
});

app.unit({
    base: 0,
    name: f('unit_%s', SIZE),
    deps: [f('unit_%s', SIZE - 1), f('unit_%s', SIZE - 2)],
    main: noop
});

SIZE -= 1;

while (SIZE) {
    app.unit({
        base: 0,
        name: f('unit_%s', SIZE),
        deps: SIZE < 2 ?
            [] :
            SIZE < 3 ?
                [f('unit_%s', SIZE - 1)] :
                [
                    f('unit_%s', SIZE - 1),
                    f('unit_%s', SIZE - 2)
                ],
        main: noop
    });
    SIZE -= 1;
}

var suite = new Suite().
    on('cycle', function (e) {
        console.log(String(e.target));
    }).
    add('test', function (defer) {
        app.callUnit(new Track(app, app.logger.bind('foo')), 'unit_40', null, function () {
            defer.resolve();
        });
    }, {
        defer: true
    });

app.ready().done(function () {
    suite.run({
        async: true,
        queued: true
    });
});
