#!/usr/bin/env node
/* eslint no-console: 0 */
'use strict';

var Benchmark = require('benchmark').Benchmark;
var Suite = Benchmark.Suite;

var create = require('../core/util/create');

new Suite().
    on('cycle', function (e) {
        console.log(String(e.target));
    }).
    add('create()', function () {
        global.__test__ = create({foo: 'bar'});
    }).
    add('Object.create', function () {
        global.__test__ = Object.create({foo: 'bar'});
    }).
    run({
        queued: true,
        async: true
    });
