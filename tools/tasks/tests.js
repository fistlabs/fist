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

module.exports = function () {

    this.task('unit', [], function () {
        return this.src('test/*.js').pipe(gulpMochaPipe());
    });

    this.task('cover', [], function (done) {
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
    });

    this.task('test', ['cover']);
};
