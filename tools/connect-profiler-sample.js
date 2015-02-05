#!/usr/bin/env node
/*eslint no-console: 0*/
'use strict';

var Connect = require('../core/connect');
var Server = require('../core/server');
var app = new Server();
var profiler = require('profiler');
var req = {
    url: '/path/to/resource/',
    connection: {
        remoteAddress: '127.0.0.1',
        encrypted: false
    },
    headers: {}
};
var res = {};
var samples = 500;

while (samples) {
    samples -= 1;
    profiler.resume();
    run();
    profiler.pause();
}

function run() {
    var connect = new Connect(app, app.logger, req, res);
    return connect.url;
}
