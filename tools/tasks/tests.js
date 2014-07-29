'use strict';

var gulpMocha = require('gulp-mocha');
var gulpIstanbul = require('gulp-istanbul');

function gulpMochaPipe () {

    return gulpMocha({
        ui: 'bdd',
        reporter: 'spec',
        checkLeaks: true
    });
}

function runUnit () {

    return this.src('test/*.js').pipe(gulpMochaPipe());
}

function runCover (done) {
    var self = this;
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
