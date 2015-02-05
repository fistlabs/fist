#!/usr/bin/env node
/*eslint no-console: 0*/
'use strict';

var Benchmark = require('benchmark');
var Suite = Benchmark.Suite;
var buildDepsTest = require('../tools/build-reverse-deps-test');

Benchmark.options.minSamples = 500;

buildDepsTest(16, function (run) {
    new Suite().
        on('cycle', function (e) {
            console.log(String(e.target));
        }).
        add('test', function (defer) {
            run(function () {
                defer.resolve();
            });
        }, {
            defer: true
        }).
        run({
            async: true,
            queued: true
        });
});
