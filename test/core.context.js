/*eslint max-nested-callbacks: 0*/
/*global describe, it*/
'use strict';

var Obus = require('obus');

var assert = require('assert');
var logger = require('loggin');

describe('core.context', function () {
    var Context = require('../core/context');

    describe('new Context()', function () {
        it('Should be an instance of Context', function () {
            var context = new Context(new Obus(), new Obus(), new Obus(), logger);
            assert.ok(context instanceof Context);
        });

        it('Should have context properties', function () {
            var context = new Context(new Obus(), new Obus(), new  Obus(), logger);
            assert.ok(context.params instanceof Obus);
            assert.ok(context.errors instanceof Obus);
            assert.ok(context.result instanceof Obus);
            assert.strictEqual(context.logger, logger);
        });
    });

    describe('context.r()', function () {
        it('Should be equal to context.result.get', function () {
            var context = new Context(new Obus(), new Obus(), new Obus(), logger);
            context.result.set('foo.bar.baz', 42);
            assert.strictEqual(context.result.get('foo.bar.baz'), 42);
            assert.strictEqual(context.r('foo.bar.baz'), 42);

            assert.strictEqual(context.result.get('foo.bar.baz.zot', 43), 43);
            assert.strictEqual(context.r('foo.bar.baz.zot', 43), 43);
        });
    });

    describe('context.e()', function () {
        it('Should be equal to context.errors.get', function () {
            var context = new Context(new Obus(), new Obus(), new Obus(), logger);
            context.errors.set('foo.bar.baz', 42);
            assert.strictEqual(context.errors.get('foo.bar.baz'), 42);
            assert.strictEqual(context.e('foo.bar.baz'), 42);

            assert.strictEqual(context.errors.get('foo.bar.baz.zot', 43), 43);
            assert.strictEqual(context.e('foo.bar.baz.zot', 43), 43);
        });
    });

    describe('context.p()', function () {
        it('Should be deep accessor to params', function () {
            var context = new Context(new Obus(), new Obus(), new Obus(), logger);
            Obus.set(context.params, 'foo.bar', 42);
            assert.strictEqual(context.p('foo.bar'), 42);
            assert.strictEqual(context.p('foo.bar.baz', 43), 43);
        });
    });

    describe('context.toJSON()', function () {
        it('Should return params, errors and result', function () {
            var context = new Context(new Obus(), new Obus(), new Obus(), logger);
            var json = context.toJSON();
            assert.strictEqual(json.params, context.params);
            assert.ok(json.errors, context.errors);
            assert.ok(json.result, context.result);
        });
    });

    describe('Context.createParams()', function () {
        it('Should extend context params with given one', function () {
            var params = Context.createParams({foo: 42});
            assert.deepEqual(params, {foo: 42});
            params = Context.createParams(params, {bar: 146});
            assert.deepEqual(params, {foo: 42, bar: 146});
        });
        it('Should support multiple arguments', function () {
            var params = Context.createParams({foo: 42}, {bar: 146});
            assert.deepEqual(params, {foo: 42, bar: 146});
        });
        it('Should not overwrite existing values with undefined', function () {
            var params = Context.createParams({foo: 42}, {bar: 146}, {foo: void 0, bar: void 0});
            assert.deepEqual(params, {foo: 42, bar: 146});
        });
    });
});
