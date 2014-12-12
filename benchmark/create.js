#!/usr/bin/env node
/* eslint no-console: 0 */
'use strict';

var Benchmark = require('benchmark').Benchmark;
var Suite = Benchmark.Suite;

function F() {}

function create(proto) {
    F.prototype = proto;
    return new F();
}

var obj = require('http').STATUS_CODES;
var size = 10;

while (size) {
    size -= 1;
    obj = Object.create(obj);
}

Benchmark.options.minSamples = 100;

new Suite().
    on('cycle', function (e) {
        console.log(String(e.target));
    }).
    add('Object.create()', function () {
        global.__test__ = Object.create(obj);
    }).
    add('set __proto__', function () {
        global.__test__ = {__proto__: obj};
    }).
    add('create()', function () {
        global.__test__ = create(obj);
    }).
    add('inline create()', function () {
        F.prototype = obj;
        global.__test__ = new F();
    }).
    run({
        queued: true,
        async: true
    });
