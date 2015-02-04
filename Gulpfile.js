'use strict';

var _ = require('lodash-node');
var glob = require('glob');
var gulp = require('gulp');
var path = require('path');
var tasksPattern = path.join(__dirname, 'tools/tasks/*.js');

_.forEach(glob.sync(tasksPattern, {cwd: process.cwd()}), function (filename) {
    var gulpSubFile = require(filename);
    gulpSubFile(gulp);
});

gulp.task('default', ['test']);
