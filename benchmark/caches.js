#!/usr/bin/env node
/* eslint no-console: 0 */
'use strict';

var Benchmark = require('benchmark').Benchmark;
var Suite = Benchmark.Suite;
var LRUCache = require('lru-cache');
var LRUDict = require('../core/cache/lru-dict');
var LRUDictTtl = require('../core/cache/lru-dict-ttl');

//  Bounded
var lruc = new LRUCache({max: 50});
var dict = new LRUDict(50);

//  Unbounded + ttl
var dictTtl = new LRUDictTtl();
var lrucTtl = new LRUCache({maxAge: 50});

var uniqueId = require('unique-id');
var keys = [];
var i = 100;
var l;

while (i) {
    keys.push(uniqueId(4, 'ABCD'));
    i -= 1;
}

i = -1;
l = keys.length;

function next() {
    return keys[(i += 1) % l];
}

Benchmark.options.minSamples = 100;

new Suite().
    on('cycle', function (e) {
        console.log(String(e.target));
    }).
    add('lruc-set', function () {
        global.__test__ = lruc.set(next(), 42);
    }).
    add('dict-set', function () {
        global.__test__ = dict.set(next(), 42);
    }).
    add('lruc-get', function () {
        global.__test__ = lruc.get(next());
    }).
    add('dict-get', function () {
        global.__test__ = dict.get(next());
    }).
    add('lruc-ttl-set-get', function () {
        global.__test__ = lrucTtl.set(next(), 42);
        global.__test__ = lrucTtl.get(next());
    }).
    add('dict-ttl-set-get', function () {
        global.__test__ = dictTtl.set(next(), 42, 50);
        global.__test__ = dictTtl.get(next());
    }).
    run({
        queued: true,
        async: true
    });
