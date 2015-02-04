'use strict';

var _ = require('lodash-node');
var gulpMocha = require('gulp-mocha');
var gulpIstanbul = require('gulp-istanbul');
var gutil = require('gulp-util');
var testsFiles = [
    'test/*.js'
];
var filesToCover = [
    'fist.js',
    'core/**/*.js',
    'fist_plugins/**/*.js'
];

function gulpMochaPipe() {

    return gulpMocha({
        ui: 'bdd',
        reporter: 'spec',
        checkLeaks: true,
        slow: Infinity
    });
}

function runTests() {
    var stream = this.src(testsFiles).pipe(gulpMochaPipe());

    stream.on('error', function (e) {
        gutil.log(e.stack);
    });

    return stream;
}

function runTestsWithCoverage(done) {
    var getRunUnitPipe = _.bind(runTests, this);
    this.src(filesToCover).
        pipe(gulpIstanbul()).
        pipe(gulpIstanbul.hookRequire()).
        on('finish', function () {
            return getRunUnitPipe().
                pipe(gulpIstanbul.writeReports()).
                on('end', done);
        });
}

module.exports = function (gulp) {
    gulp.task('unit', [], runTests);
    gulp.task('cover', [], runTestsWithCoverage);
    gulp.task('test', ['lint'], runTestsWithCoverage);
};
