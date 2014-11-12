'use strict';

var gulpMocha = require('gulp-mocha');
var gulpIstanbul = require('gulp-istanbul');
var gutil = require('gulp-util');

function gulpMochaPipe() {

    return gulpMocha({
        ui: 'bdd',
        reporter: 'spec',
        checkLeaks: true,
        slow: Infinity
    });
}

function runUnit() {
    require('loggin').loggings.global.setHandlers([]);
    var stream = this.src('test/*.js').pipe(gulpMochaPipe());

    stream.on('error', function (e) {
        gutil.log(e.stack);
    });

    return stream;
}

function runCover(done) {
    var self = this;
    require('loggin').loggings.global.setHandlers([]);
    this.src([
        'fist.js',
        'core/**/*.js',
        'fist_plugins/**/*.js'
    ])
        .pipe(gulpIstanbul())
        .on('finish', function () {
            self.src('test/*.js')
                .pipe(gulpMochaPipe())
                .pipe(gulpIstanbul.writeReports())
                .on('end', done);
        });
}

module.exports = function () {
    this.task('unit', [], runUnit);
    this.task('cover', [], runCover);
    this.task('test', ['lint'], runCover);
};
