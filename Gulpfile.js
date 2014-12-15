'use strict';

var _ = require('lodash-node');
var gulp = require('gulp');
var glob = require('glob');
var path = require('path');

require('loggin').conf({
    logLevel: 'INTERNAL'
    // logLevel: 'DISABLE'
});

_.forEach(glob.sync('tools/tasks/*.js'), function (filename) {
    require(path.resolve(filename)).call(gulp);
});

gulp.task('default', ['test']);
