'use strict';

var linterConf = require('../linter-conf');
var linterPipe = require('gulp-one-guide');

module.exports = function () {
    this.task('lint', function () {
        return this.src(linterConf.patterns).pipe(linterPipe({
            excludes: linterConf.excludes
        }));
    });
};
