'use strict';

var gulpJscs = require('gulp-jscs');

module.exports = function () {
    this.task('jscs', [], function () {

        return this.src([
            'benchmark/**/*.js',
            'core/**/*.js',
            'fist_plugins/**/*.js',
            'test/**/*.js',
            'tools/**/*.js',
            '*.js'
        ]).pipe(gulpJscs());
    });
};
