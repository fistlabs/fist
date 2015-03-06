/*eslint max-nested-callbacks: 0*/
/*global describe, it*/
'use strict';

var _ = require('lodash-node');
var assert = require('assert');

describe('core/errors', function () {
    var errors = require('../core/errors');

    describe('FistError', function () {
        var FistError = errors.FistError;

        it('Should be a function', function () {
            assert.ok(_.isFunction(FistError));
        });

        it('Should have constructor FistError', function () {
            var error = new FistError();
            assert.strictEqual(error.constructor, FistError);
        });

        it('Should be an instance of FistError', function () {
            assert.ok(new FistError() instanceof FistError);
        });

        it('Should be an instance of Error', function () {
            assert.ok(new FistError() instanceof Error);
        });

        it('Should have name "FistError"', function () {
            var error = new FistError();
            assert.strictEqual(error.name, 'FistError');
        });

        it('Should have code, that passed as first argument', function () {
            var error = new FistError('FOO');
            assert.strictEqual(error.code, 'FOO');
        });

        it('Should format message from `code` and `message` arguments', function () {
            var error = new FistError('UNKNOWN', 'foobar');
            assert.strictEqual(error.message, '(UNKNOWN) foobar');
        });

        it('Should be correctly coerced to string', function () {
            var error = new FistError('Foo', 'bar');
            assert.strictEqual(String(error), 'FistError: (Foo) bar');
        });
    });

    describe('BadUnitError', function () {
        var BadUnitError = errors.BadUnitError;

        it('Should be a function', function () {
            assert.ok(_.isFunction(BadUnitError));
        });

        it('Should have constructor BadUnitError', function () {
            var error = new BadUnitError();
            assert.strictEqual(error.constructor, BadUnitError);
        });

        it('Should be an instance of BadUnitError', function () {
            assert.ok(new BadUnitError() instanceof BadUnitError);
        });

        it('Should be an instance of FistError', function () {
            assert.ok(new BadUnitError() instanceof errors.FistError);
        });

        it('Should be an instance of Error', function () {
            assert.ok(new BadUnitError() instanceof Error);
        });

        it('Should have name "BadUnitError"', function () {
            var error = new BadUnitError();
            assert.strictEqual(error.name, 'BadUnitError');
        });

        it('Should have code "BAD_UNIT"', function () {
            var error = new BadUnitError();
            assert.strictEqual(error.code, 'BAD_UNIT');
        });

    });

    describe('NoSuchUnitError', function () {
        var NoSuchUnitError = errors.NoSuchUnitError;

        it('Should be a function', function () {
            assert.ok(_.isFunction(NoSuchUnitError));
        });

        it('Should have constructor NoSuchUnitError', function () {
            var error = new NoSuchUnitError();
            assert.strictEqual(error.constructor, NoSuchUnitError);
        });

        it('Should be an instance of NoSuchUnitError', function () {
            assert.ok(new NoSuchUnitError() instanceof NoSuchUnitError);
        });

        it('Should be an instance of FistError', function () {
            assert.ok(new NoSuchUnitError() instanceof errors.FistError);
        });

        it('Should be an instance of Error', function () {
            assert.ok(new NoSuchUnitError() instanceof Error);
        });

        it('Should have name "NoSuchUnitError"', function () {
            var error = new NoSuchUnitError();
            assert.strictEqual(error.name, 'NoSuchUnitError');
        });

        it('Should have code "NO_SUCH_UNIT"', function () {
            var error = new NoSuchUnitError();
            assert.strictEqual(error.code, 'NO_SUCH_UNIT');
        });

    });

    describe('DepsConflictError', function () {
        var DepsConflictError = errors.DepsConflictError;

        it('Should be a function', function () {
            assert.ok(_.isFunction(DepsConflictError));
        });

        it('Should have constructor DepsConflictError', function () {
            var error = new DepsConflictError();
            assert.strictEqual(error.constructor, DepsConflictError);
        });

        it('Should be an instance of NoSuchUnitError', function () {
            assert.ok(new DepsConflictError() instanceof DepsConflictError);
        });

        it('Should be an instance of FistError', function () {
            assert.ok(new DepsConflictError() instanceof errors.FistError);
        });

        it('Should be an instance of Error', function () {
            assert.ok(new DepsConflictError() instanceof Error);
        });

        it('Should have name "DepsConflictError"', function () {
            var error = new DepsConflictError();
            assert.strictEqual(error.name, 'DepsConflictError');
        });

        it('Should have code "DEPS_CONFLICT"', function () {
            var error = new DepsConflictError();
            assert.strictEqual(error.code, 'DEPS_CONFLICT');
        });

    });

    describe('NoSuchCacheError', function () {
        var NoSuchCacheError = errors.NoSuchCacheError;

        it('Should be a function', function () {
            assert.ok(_.isFunction(NoSuchCacheError));
        });

        it('Should have constructor NoSuchCacheError', function () {
            var error = new NoSuchCacheError();
            assert.strictEqual(error.constructor, NoSuchCacheError);
        });

        it('Should be an instance of NoSuchCacheError', function () {
            assert.ok(new NoSuchCacheError() instanceof NoSuchCacheError);
        });

        it('Should be an instance of FistError', function () {
            assert.ok(new NoSuchCacheError() instanceof errors.FistError);
        });

        it('Should be an instance of Error', function () {
            assert.ok(new NoSuchCacheError() instanceof Error);
        });

        it('Should have name "NoSuchCacheError"', function () {
            var error = new NoSuchCacheError();
            assert.strictEqual(error.name, 'NoSuchCacheError');
        });

        it('Should have code "NO_SUCH_CACHE"', function () {
            var error = new NoSuchCacheError();
            assert.strictEqual(error.code, 'NO_SUCH_CACHE');
        });
    });
});
