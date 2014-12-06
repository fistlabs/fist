/*eslint max-nested-callbacks: 0*/
/*global describe, it*/
'use strict';

var assert = require('assert');

describe('core/context', function () {
    var Context = require('../core/context');
    var logger = require('loggin').getLogger();

    function getContext() {
        return new Context(logger);
    }

    it('Should take logger', function () {
        var context = getContext();
        assert.strictEqual(context.logger, logger);
    });

    describe('context.toJSON()', function () {

        it('Should have context.toJSON method', function () {
            var context = getContext();
            assert.strictEqual(typeof context.toJSON, 'function');
        });

        it('Should return params', function () {
            var context = getContext();
            var json = context.toJSON();
            assert.strictEqual(json, context.params);
        });
    });

    describe('context.setup()', function () {
        it('Should extend context params', function () {
            var context = getContext();
            assert.deepEqual(context.params, {});
            context.setup({foo: 'bar'});
            assert.deepEqual(context.params, {foo: 'bar'});
            context.setup({bar: 42, zot: 11}, {bar: 'baz', foo: 146, __proto__: {xyz: 'no'}});
            assert.deepEqual(context.params, {foo: 146, bar: 'baz', zot: 11});
        });

        it('Should return self', function () {
            var context = getContext();
            assert.strictEqual(context.setup(), context);
        });
    });

    describe('Context.prototype.param()', function () {

        it('Should have context.param method', function () {
            var context = getContext();
            assert.strictEqual(typeof context.param, 'function');
        });

        it('Should provide deep access to context.params', function () {
            var obj = {foo: {bar: 'baz'}};
            var context = new Context(logger);

            context.setup(obj);

            assert.strictEqual(context.param('foo'), obj.foo);
            assert.strictEqual(context.param('foo.bar'), obj.foo.bar);
        });
    });
});
