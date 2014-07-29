'use strict';

var childProcess = require('child_process');

module.exports = function () {

    this.task('benchmark', ['test'], function (done) {
        var benchmark = childProcess.spawn('benchmark/runner.sh',
            ['benchmark/*.js']);
        benchmark.stdout.pipe(process.stdout);
        benchmark.stderr.pipe(process.stderr);
        benchmark.on('exit', done);
        benchmark.on('error', done);
    });
};
