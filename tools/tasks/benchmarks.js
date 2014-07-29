'use strict';

var childProcess = require('child_process');

module.exports = function () {

    this.task('benchmark', ['test'], function (done) {
        var benchmark = childProcess.spawn('benchmark/runner.sh',
            ['benchmark/express.js', 'benchmark/fist.js']);
        benchmark.stdout.pipe(process.stdout);
        benchmark.stderr.pipe(process.stderr);
        benchmark.on('exit', function () {
            done();
        });
    });
};
