/*eslint max-nested-callbacks: 0*/
/*global describe, it*/
'use strict';

var Track = require('../core/track');

var _ = require('lodash-node');
var assert = require('assert');
var path = require('path');

describe('core/core', function () {
    var Agent = require('../core/core');

    describe('new Agent()', function () {
        it('Should be an instance of Agent', function () {
            var agent = new Agent();
            assert.ok(agent instanceof Agent);
        });

        describe('agent.params', function () {
            it('Should take params', function () {
                var args = {foo: 42};
                var agent = new Agent(args);
                assert.ok(agent.params);
                assert.strictEqual(agent.params.foo, 42);
            });

            it('Should have "root" by default', function () {
                var agent = new Agent();
                assert.ok(agent.params);
                assert.strictEqual(typeof agent.params.root, 'string');
            });

            it('params.root can be overwritten', function () {
                var agent = new Agent({root: '/path/'});
                assert.strictEqual(agent.params.root, '/path/');
            });
        });

        describe('agent.logger', function () {
            var Logger = require('loggin/core/logger');

            it('Should create logger', function () {
                var agent = new Agent();
                assert.ok(agent.logger instanceof Logger);
            });

            it('Should bind context from params.name', function () {
                var agent = new Agent({
                    name: 'foo'
                });
                var logger = agent.logger;
                var name = _.last(logger.context.split(/\W+/));
                assert.strictEqual(name, 'foo');
            });
        });
    });

    describe('Agent.logging', function () {
        var Logging = require('loggin/core/logging');

        it('Should be an instance of Logging', function () {
            assert.ok(Agent.logging instanceof Logging);
        });
    });

    describe('agent.ready()', function () {
        var vow = require('vow');

        it('Should return promise', function () {
            var agent = new Agent();
            assert.ok(vow.isPromise(agent.ready()));
        });

        it('Should be ready once', function () {
            var agent = new Agent();
            var ready = agent.ready();
            assert.strictEqual(ready, agent.ready());
        });
    });

    describe('agent.install()', function () {

        it('Should install plugin by module name', function (done) {
            var agent = new Agent();
            agent.install(path.join(__dirname, 'fixtures', 'plug', 'async-plugin'));
            agent.ready().done(function () {
                assert.strictEqual(agent.async, 42);
                done();
            });
        });

        it('Should install plugin by file name', function (done) {
            var agent = new Agent();
            agent.install(path.join(__dirname, 'fixtures', 'plug', 'async-plugin.js'));
            agent.ready().done(function () {
                assert.strictEqual(agent.async, 42);
                done();
            });
        });

        it('Should install no function plugin', function (done) {
            var agent = new Agent();
            agent.install(path.join(__dirname, 'fixtures', 'plug', 'no-func-plugin'));
            agent.ready().done(function () {
                assert.strictEqual(global.__test_spy__, 'ASYNC');
                delete global.__test_spy__;
                done();
            });
        });

        it('Should install sync plugin', function (done) {
            var agent = new Agent();
            agent.install(path.join(__dirname, 'fixtures', 'plug', 'sync-plugin'));
            agent.ready().done(function () {
                assert.strictEqual(agent.sync, 42);
                done();
            });
        });

        it('Should install plugins by glob', function (done) {
            var agent = new Agent();

            delete require.cache[require.resolve('./fixtures/plug/no-func-plugin')];
            assert.strictEqual(global.__test_spy__, void 0);
            agent.install(path.join(__dirname, 'fixtures', 'plug', '*.js'));

            agent.ready().done(function () {
                assert.strictEqual(agent.sync, 42);
                assert.strictEqual(agent.async, 42);
                assert.strictEqual(global.__test_spy__, 'ASYNC');
                delete global.__test_spy__;
                done();
            });
        });

        it('Should be failed on ready by ASYNC error', function (done) {
            var agent = new Agent();
            agent.install(path.join(__dirname, 'fixtures/plug/e/async-error'));
            agent.ready().done(null, function (err) {
                assert.strictEqual(err, 'ASYNC');
                done();
            });
        });

        it('Should be failed on ready by SYNC error', function (done) {
            var agent = new Agent();
            agent.install(path.join(__dirname, 'fixtures/plug/e/sync-error'));
            agent.ready().done(null, function (err) {
                assert.strictEqual(err, 'SYNC');
                done();
            });
        });

        it('Should be failed on ready by REQUIRE error', function (done) {
            var agent = new Agent();
            agent.install(path.join(__dirname, 'fixtures/plug/e/require-error'));
            agent.ready().done(null, function (err) {
                assert.strictEqual(err, 'REQUIRE');
                done();
            });
        });

        it('Plugins can install plugins', function (done) {
            var agent = new Agent();

            delete require.cache[require.resolve('./fixtures/plug/no-func-plugin')];
            assert.strictEqual(global.__test_spy__, void 0);

            agent.install(path.join(__dirname, 'fixtures/plug/complex/bootstrap'));

            agent.ready().done(function () {
                assert.strictEqual(agent.BOOTSTRAP, 42);
                assert.strictEqual(agent.INSTALLER, 42);
                assert.strictEqual(agent.sync, 42);
                assert.strictEqual(agent.async, 42);
                assert.strictEqual(global.__test_spy__, 'ASYNC');
                delete global.__test_spy__;
                done();
            });
        });
    });

    describe('agent.unit()', function () {

        it('Should declare unit', function (done) {
            var agent = new Agent();
            agent.unit({
                base: '_fist_contrib_unit_common',
                name: 'foo'
            });

            agent.ready().done(function () {
                assert.ok(agent.getUnit('foo') instanceof agent.Unit);
                done();
            });
        });

        it('Should declare unit with implicit base', function (done) {
            var agent = new Agent();
            agent.unit({
                name: 'foo'
            });

            agent.ready().done(function () {
                assert.ok(agent.getUnit('foo') instanceof agent.Unit);
                done();
            });
        });

        it('Should cascade declare units', function (done) {
            var agent = new Agent();

            agent.unit({
                base: '_fist_contrib_unit_common',
                name: 'foo'
            });

            agent.unit({
                base: 'foo',
                name: 'bar'
            });

            agent.unit({
                base: 'foo',
                name: 'zot'
            });

            agent.unit({
                base: 'bar',
                name: 'moo'
            });

            agent.ready().done(function () {
                setTimeout(function () {
                    assert.ok(agent.getUnit('foo') instanceof agent.Unit);
                    assert.ok(agent.getUnit('bar') instanceof agent.Unit);
                    assert.ok(agent.getUnit('zot') instanceof agent.Unit);
                    assert.ok(agent.getUnit('moo') instanceof agent.Unit);
                    done();
                }, 100);
            });
        });

        it('Should ignore the units which names starts with "_"', function (done) {
            var agent = new Agent();
            agent.unit({
                base: '_fist_contrib_unit_common',
                name: '_foo'
            });

            agent.unit({
                base: '_foo',
                name: 'bar'
            });

            agent.ready().done(function () {
                assert.ok(agent.getUnit('bar') instanceof agent.Unit);
                assert.ok(!agent.getUnit('_foo'));
                assert.ok(agent.getUnitClass('_foo'));
                done();
            });
        });

        it('Should be rejected because of unit.name is not a string', function () {
            var agent = new Agent();

            assert.throws(function () {
                agent.unit({});
            });
        });

        it('Should be rejected because of unit.name is not an identifier', function () {
            var agent = new Agent();

            assert.throws(function () {
                agent.unit({
                    name: '0'
                });
            });
        });

        it('Should be rejected because of not base found', function (done) {
            var agent = new Agent();
            agent.unit({
                name: 'foo',
                base: 'bar'
            });

            agent.ready().fail(function () {
                done();
            });
        });

        it('Should ignore unit without version', function (done) {
            var agent = new Agent();

            agent.install(path.join(__dirname, 'fixtures/plug/units/*.js'));
            agent.install(path.join(__dirname, 'fixtures/plug/units/foo-impossible/*.js'));

            agent.ready().done(function () {
                assert.strictEqual(agent.getUnit('foo').x, 'test');
                done();
            });
        });

        it('Should prefer latest version', function (done) {
            var agent = new Agent();

            agent.install(path.join(__dirname, 'fixtures/plug/units/**/*.js'));

            agent.ready().done(function () {
                assert.strictEqual(agent.getUnit('foo').x, 'foo2');
                done();
            });
        });

        it('Should ignore not satisfied versions', function (done) {
            var agent = new Agent({
                unitRanges: {
                    foo: '< 1.0.1'
                }
            });

            agent.install(path.join(__dirname, 'fixtures/plug/units/**/*.js'));

            agent.ready().done(function () {
                assert.strictEqual(agent.getUnit('foo').x, 'test');
                done();
            });
        });

        it('Should install satisified and latest version unit', function (done) {
            var agent = new Agent({
                unitRanges: {
                    foo: '< 2.0.0'
                }
            });

            agent.install(path.join(__dirname, 'fixtures/plug/units/**/*.js'));

            agent.ready().done(function () {
                assert.strictEqual(agent.getUnit('foo').x, 'test-2');
                done();
            });
        });

        it('Should use params.implicitBase as implicit base unit', function () {
            var agent = new Agent({
                implicitBase: 'foo'
            });

            agent.unit({
                base: '_fist_contrib_unit_common',
                name: 'foo',
                x: 1
            });

            agent.unit({
                name: 'bar',
                y: 2
            });

            agent.ready().done(function () {
                assert.ok(agent.getUnit('foo') instanceof agent.Unit);
                assert.strictEqual(agent.getUnit('foo').x, 1);
                assert.ok(agent.getUnit('bar') instanceof agent.Unit);
                assert.ok(agent.getUnit('bar') instanceof agent.getUnitClass('foo'));
                assert.strictEqual(agent.getUnit('bar').x, 1);
                assert.strictEqual(agent.getUnit('bar').y, 2);
            });
        });
    });

    describe('agent.alias()', function () {
        it('Should inherit from unit with new name', function (done) {
            var agent = new Agent();
            agent.unit({
                name: 'foo',
                x: 42
            });

            agent.alias('foo', 'bar');

            agent.ready().done(function () {
                assert.ok(agent.getUnit('foo') instanceof agent.Unit);
                assert.ok(agent.getUnit('bar') instanceof agent.Unit);
                assert.strictEqual(agent.getUnit('foo').x, 42);
                assert.strictEqual(agent.getUnit('bar').x, 42);
                done();
            });
        });

        it('Should inherit from unit with new name by object', function (done) {
            var agent = new Agent();

            agent.unit({
                name: 'foo',
                x: 42
            });

            agent.alias({
                foo: 'bar'
            });

            agent.ready().done(function () {
                assert.ok(agent.getUnit('foo') instanceof agent.Unit);
                assert.ok(agent.getUnit('bar') instanceof agent.Unit);
                assert.strictEqual(agent.getUnit('foo').x, 42);
                assert.strictEqual(agent.getUnit('bar').x, 42);
                done();
            });
        });
    });

    describe('agent.callUnit()', function () {
        it('Should call unit by name', function (done) {
            var agent = new Agent();
            agent.unit({
                name: 'foo',
                main: function () {
                    return 42;
                }
            });

            agent.ready().done(function () {
                agent.callUnit('foo', new Track(agent)).done(function (res) {
                    assert.strictEqual(res.result, 42);
                    done();
                });
            });
        });

        it('Should throw error', function (done) {
            var agent = new Agent();
            agent.ready().done(function () {
                assert.throws(function () {
                    agent.callUnit('foo', new Track(agent));
                });
                done();
            });
        });
    });
});
