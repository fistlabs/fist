#!/usr/bin/env node
/*eslint no-console: 0*/
'use strict';

var Benchmark = require('benchmark');
var Suite = Benchmark.Suite;
var Connect = require('../core/connect');
var Server = require('../core/server');
var app = new Server();
var req = {
    url: '/path/to/resource/',
    connection: {
        remoteAddress: '127.0.0.1',
        encrypted: false
    },
    headers: {}
};
var res = {};

Benchmark.options.minSamples = 500;

new Suite().
    on('cycle', function (e) {
        console.log(String(e.target));
    }).
    add('Connect.url', function () {
        var connect = new Connect(app, app.logger, req, res);
        global.__test__ = connect.url;
    }).
    run({
        async: true,
        queued: true
    });
