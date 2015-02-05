#!/usr/bin/env node
'use strict';

var buildDepsTest = require('../tools/build-deps-test');
var samples = 1000;

buildDepsTest(32, 32, function (run) {
    run(function done() {
        if (!samples) {
            return;
        }
        samples -= 1;
        run(done);
    });
});
