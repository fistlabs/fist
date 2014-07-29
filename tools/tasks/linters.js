'use strict';

var _ = require('lodash-node');
var gulpJscs = require('gulp-jscs');
var gulpEslint = require('gulp-eslint');
var gulpExclude = require('../gulp-plugins/exclude');
var gutil = require('gulp-util');
var lintPatterns = [
    'benchmark/**/*.js',
    'core/**/*.js',
    'fist_plugins/**/*.js',
    'test/**/*.js',
    'tools/**/*.js',
    '*.js'
];
var excludePatterns = [];
var through2 = require('through2');

function runJscs () {

    return this.src(lintPatterns).pipe(gulpJscs());
}

function runEslint (done) {
    var error;
    var noErrors = true;

    this.src(lintPatterns).
        pipe(gulpExclude(excludePatterns)).
        pipe(gulpEslint()).
        pipe(through2.obj(function (file, enc, cb) {

            if ( file.eslint ) {
                noErrors = true === noErrors &&
                           !_.find(file.eslint.messages, {
                               severity: 2
                           });
            }

            this.push(file);

            cb();
        })).
        pipe(gulpEslint.format(null, function (message) {
            error = new gutil.PluginError('gulp-eslint', message, {
                showStack: false
            });
        })).once('end', function () {

            if ( noErrors ) {

                if ( error instanceof gutil.PluginError ) {
                    /*eslint no-console: 0*/
                    console.error(error.toString());
                }

                done();

            } else {

                done(error);
            }
        });
}
module.exports = function () {
    this.task('jscs', [], runJscs);
    this.task('eslint', [], runEslint);
    this.task('lint', ['jscs'], runEslint);
};
