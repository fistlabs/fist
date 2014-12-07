'use strict';

var _ = require('lodash-node');
var gulp = require('gulp');
var glob = require('glob');
var path = require('path');

require('loggin').conf({
    logLevel: 'INTERNAL',
    enabled: ['debug'],
    handlers: {
        debug: {
            layout: 'fistTest',
            Class: 'loggin/core/handler/stream-handler',
            kwargs: {
                stream: process.stdout
            }
        }
    },
    layouts: {
        fistTest: {
            record: 'regular',
            Class: 'loggin/core/layout/colored',
            kwargs: {
                dateFormat: '%H:%M:%S',
                template: '\t%(date)s %(level)-17s %(context)s - %(message)s\n',
                colors: {
                    INTERNAL: 'white',
                    DEBUG: 'fuchsia',
                    NOTE: 'blue',
                    INFO: 'aqua',
                    LOG: 'lime',
                    WARNING: 'yellow',
                    ERROR: 'red',
                    FATAL: 'maroon'
                }
            }
        }
    }
});

_.forEach(glob.sync('tools/tasks/*.js'), function (filename) {
    require(path.resolve(filename)).call(gulp);
});

gulp.task('default', ['test']);
