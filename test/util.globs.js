/*global describe, it*/
'use strict';

var assert = require('chai').assert;
var vow = require('vow');
var Fs = require('fs');

describe('fist/util/globs', function () {
    /*eslint max-nested-callbacks: [2, 4]*/
    var globs = require('../util/globs');

    it('Should return vow.Promise', function () {
        assert.instanceOf(globs(), vow.Promise);
    });

    describe('globs()', function () {
        it('Should be resolved with an empty array', function (done) {
            globs().then(function (list) {
                assert.isArray(list);
                assert.deepEqual(list, []);
                done();
            }).done();
        });
    });

    describe('globs([])', function () {
        it('Should be resolved with an empty array', function (done) {
            globs([]).then(function (list) {
                assert.isArray(list);
                assert.deepEqual(list, []);
                done();
            }).done();
        });
    });

    describe('globs(glob)', function () {
        it('Should be resolved with an empty array', function (done) {
            globs(String(new Date())).then(function (list) {
                assert.isArray(list);
                assert.deepEqual(list, []);
                done();
            }).done();
        });
    });

    describe('globs(globs)', function () {
        it('Should be rejected', function (done) {
            globs([null]).fail(function (err) {
                assert.instanceOf(err, Error);
                done();
            }).done();
        });

        it('Should be rejected while pattern matching', function (done) {
            Fs.mkdirSync('test/fixtures/globs/sub');
            Fs.symlinkSync('.', 'test/fixtures/globs/sub/sub');
            Fs.chmodSync('test/fixtures/globs/sub/sub', 438);

            globs(['test/fixtures/globs/sub/**/*.js'], {
                stat: true,
                strict: true,
                silent: true
            }).done(null, function (err) {
                assert.ok(err);
                Fs.chmodSync('test/fixtures/globs/sub', 511);
                Fs.unlinkSync('test/fixtures/globs/sub/sub');
                Fs.rmdirSync('test/fixtures/globs/sub');
                done();
            });
        });

        it('Should return list of files matched to globs', function (done) {
            globs(['test/fixtures/globs/a/*',
                'test/fixtures/globs/b/*']).then(function (list) {
                assert.isArray(list);
                assert.deepEqual(list.sort(), [
                    'test/fixtures/globs/a/test0.txt',
                    'test/fixtures/globs/a/test1.txt',
                    'test/fixtures/globs/b/test2.txt',
                    'test/fixtures/globs/b/test3.txt'
                ]);
                done();
            }).done();
        });
    });
});
