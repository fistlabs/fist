/*global describe, it*/
'use strict';

var assert = require('chai').assert;
var fs = require('fs');
var vow = require('vow');

describe('core/util/vow-glob', function () {
    /*eslint max-nested-callbacks: [2, 4]*/
    var vowGlob = require('../core/util/vow-glob');

    it('Should return promise', function () {
        assert.ok(vow.isPromise(vowGlob()));
    });

    it('Should return file list', function (done) {
        vowGlob('test/fixtures/globs/a/*').done(function (list) {
            assert.deepEqual(list.sort(), [
                'test/fixtures/globs/a/test0.txt',
                'test/fixtures/globs/a/test1.txt'
            ]);
            done();
        });
    });

    it('Should be rejected', function (done) {
        fs.mkdirSync('test/fixtures/globs/sub');
        fs.symlinkSync('.', 'test/fixtures/globs/sub/sub');
        fs.chmodSync('test/fixtures/globs/sub/sub', 438);

        vowGlob('test/fixtures/globs/sub/**/*.js', {
            silent: true
        }).fail(function (err) {
            assert.ok(err);

            fs.chmodSync('test/fixtures/globs/sub', 511);
            fs.unlinkSync('test/fixtures/globs/sub/sub');
            fs.rmdirSync('test/fixtures/globs/sub');

            done();
        }).done();
    });
});
