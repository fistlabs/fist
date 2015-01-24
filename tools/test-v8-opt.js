#!/usr/bin/env node
'use strict';

var buildDepsTest = require('../tools/build-deps-test');
var samples = 50000;

buildDepsTest(40, 2, function (run) {
    run(function done() {
        if (!samples) {
            return;
        }
        samples -= 1;
        run(done);
    });
});
