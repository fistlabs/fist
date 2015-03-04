/*eslint max-nested-callbacks: 0, no-console: 0*/
'use strict';

var Promise = require('bluebird');

var childProcess = require('child_process');
var glob = require('glob');
var path = require('path');
var _ = require('lodash-node');
var fs = require('fs');

module.exports = function (gulp) {

    gulp.task('benchmark', ['unit'], function () {
        var runnersFiles = glob.sync(path.join(__dirname, '..', '..', 'benchmark', '*'));

        runnersFiles = runnersFiles.filter(function (name) {
            return fs.statSync(name).isFile();
        });

        return _.reduce(runnersFiles, function (promise, name) {
            return promise.then(function () {
                var defer = Promise.defer();
                var childProc;
                console.log('Starting %s', name);
                childProc = childProcess.spawn(name, []);
                childProc.stdout.pipe(process.stdout);
                childProc.stderr.pipe(process.stderr);
                childProc.on('exit', function (code) {
                    if (code) {
                        defer.reject(code);
                    } else {
                        defer.resolve(code);
                    }
                });

                childProc.on('error', function (err) {
                    defer.reject(err);
                });

                return defer.promise;
            });
        }, Promise.resolve());
    });
};
