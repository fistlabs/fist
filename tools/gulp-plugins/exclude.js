'use strict';

var _ = require('lodash-node');
var minimatch = require('minimatch');
var through2 = require('through2');

function isExcluded (path, patterns, opts) {

    return _.some(patterns, function (pattern) {

        return minimatch(path, pattern, opts);
    });
}
module.exports = function (patterns, opts) {

    return through2.obj(function (file, enc, cb) {

        if ( !isExcluded(file.path, patterns, opts) ) {
            this.push(file);
        }

        cb();
    });
};
