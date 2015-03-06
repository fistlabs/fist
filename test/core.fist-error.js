/*eslint max-nested-callbacks: 0*/
/*global describe, it*/
'use strict';

var _ = require('lodash-node');
var assert = require('assert');
var f = require('util').format;

describe('core/fist-error', function () {
    var FistError = require('../core/fist-error');
    var codes = ['UNKNOWN', 'BAD_UNIT', 'DEPS_CONFLICT', 'NO_SUCH_UNIT'];

    it('Should be an instance of Error', function () {
        var e = new FistError();
        assert.ok(e instanceof Error);
    });

    it('Should be an instance of FistError', function () {
        var e = new FistError();
        assert.ok(e instanceof FistError);
    });

    it('Should have name "FistError"', function () {
        var e = new FistError();
        assert.strictEqual(e.name, 'FistError');
    });

    it('Should take code', function () {
        var e = new FistError('UNKNOWN');
        assert.strictEqual(e.code, 'UNKNOWN');
    });

    describe('error.message', function () {
        it('Should work without arguments', function () {
            var e = new FistError();
            assert.strictEqual(String(e), 'FistError');
        });
        it('Should work with 1 argument as code', function () {
            var e = new FistError('CODE');
            assert.strictEqual(String(e), 'FistError: (CODE)');
        });
        it('Should work with 2 arguments as code and message', function () {
            var e = new FistError('CODE', 'foo-bar');
            assert.strictEqual(String(e), 'FistError: (CODE) foo-bar');
        });
    });

    _.forEach(codes, function (code) {
        it(f('Should have property FistError.%s === "%s"', code, code), function () {
            assert.ok(_.has(FistError, code));
            assert.strictEqual(typeof FistError[code], 'string');
            assert.strictEqual(FistError[code], code);
        });
    });

});
