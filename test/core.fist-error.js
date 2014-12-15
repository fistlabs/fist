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

    it('Should take message', function () {
        var e = new FistError('UNKNOWN', 'foo');
        assert.strictEqual(e.message, '(UNKNOWN) foo');
    });

    _.forEach(codes, function (code) {
        it(f('Should have property FistError.%s === "%s"', code, code), function () {
            assert.ok(_.has(FistError, code));
            assert.strictEqual(typeof FistError[code], 'string');
            assert.strictEqual(FistError[code], code);
        });
    });

});
