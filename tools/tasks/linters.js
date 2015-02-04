'use strict';

var linterPipe = require('gulp-one-guide');

var filesToLint = [
    'benchmark/**/*.js',
    'core/**/*.js',
    'examples/*/fist_plugins/**/*.js',
    'examples/*/*.js',
    'fist_plugins/**/*.js',
    'test/**/*.js',
    'tools/**/*.js',
    '*.js'
];

module.exports = function (gulp) {
    gulp.task('lint', function () {
        return this.src(filesToLint).pipe(linterPipe({
            root: process.cwd(),
            config: 'yandex-node'
        }));
    });
};
