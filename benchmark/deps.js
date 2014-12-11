#!/usr/bin/env node
/* eslint no-console: 0 */
'use strict';

var Benchmark = require('benchmark').Benchmark;
var Suite = Benchmark.Suite;

var array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
var deps = Object.create(null);

array.forEach(function (v, i) {
    Object.defineProperty(deps, String(i), {
        enumerable: true,
        value: v
    });
});

Object.defineProperty(deps, 'length', {
    value: array.length
});

Benchmark.options.minSamples = 100;

new Suite().
    on('cycle', function (e) {
        console.log(String(e.target));
    }).
    add('array iteration', function () {
        var i;
        var l;
        for (i = 0, l = array.length; i < l; i += 1) {
            global.__test__ = array[i];
        }
    }).
    add('deps iteration', function () {
        var i;
        var l;
        for (i = 0, l = deps.length; i < l; i += 1) {
            global.__test__ = deps[i];
        }
    }).
    run({
        async: true,
        queued: true
    });
