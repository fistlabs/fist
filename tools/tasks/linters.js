'use strict';

var EslintConfig = require('eslint/lib/config');
var gulpJscs = require('gulp-jscs');

var _ = require('lodash-node');
var eslintLinter = require('eslint').linter;
var eslintStylishFormatter = require('eslint/lib/formatters/stylish');
var glob = require('glob');
var gutil = require('gulp-util');
var linterPaths = [
    'benchmark/**/*.js',
    'core/**/*.js',
    'fist_plugins/**/*.js',
    'test/**/*.js',
    'tools/**/*.js',
    '*.js'
];
var vow = require('vow');
var vowFs = require('vow-fs');

function readFiles(paths) {
    var sources = _.map(paths, function (path) {

        return vowFs.read(path, 'utf-8').then(function (data) {

            return {
                data: data,
                path: path
            };
        });
    });

    return vow.all(sources);
}

function eslintPromise(paths, configPath) {
    var config = new EslintConfig({
        configFile: configPath
    });

    config = config.useSpecificConfig;

    return readFiles(paths).then(function (sources) {

        return _.map(sources, function (source) {

            return {
                filePath: source.path,
                messages: eslintLinter.verify(source.data, config, source.path)
            };
        });
    });
}

function runEslint(done) {
    /*eslint no-console: 0*/
    var paths = _.reduce(linterPaths, function (paths, globPattern) {
        return paths.concat(glob.sync(globPattern));
    }, []);

    eslintPromise(paths, '.eslintrc')
        .done(function (results) {
            var message;

            if (_.isEmpty(results)) {
                return done();
            }

            message = eslintStylishFormatter(results);

            //  среди сообщений есть ОШИБКИ (там могут быть просто ворнинги)
            if (_.find(results, {messages: [{severity: 2}]})) {
                return done(new gutil.PluginError('eslint-linter', message));
            }

            console.log(message);

            done();
        }, done);
}

module.exports = function () {
    this.task('jscs', [], function () {
        return this.src(linterPaths).pipe(gulpJscs());
    });
    this.task('eslint', [], runEslint);
    this.task('lint', ['jscs'], runEslint);
};
