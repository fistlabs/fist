/*eslint max-nested-callbacks: 0*/
/*global describe, it*/
'use strict';

var Track = require('../core/track');

var _ = require('lodash-node');
var assert = require('assert');
var logger = require('loggin');
var path = require('path');

describe('core/core', function () {
    var Core = require('../core/core');

    describe('new Core()', function () {
        it('Should be an instance of Core', function () {
            var core = new Core();
            assert.ok(core instanceof Core);
        });

        describe('core.params', function () {
            it('Should take params', function () {
                var args = {foo: 42};
                var core = new Core(args);
                assert.ok(core.params);
                assert.strictEqual(core.params.foo, 42);
            });

            it('Should have "root" by default', function () {
                var core = new Core();
                assert.ok(core.params);
                assert.strictEqual(typeof core.params.root, 'string');
            });

            it('params.root can be overwritten', function () {
                var core = new Core({root: '/path/'});
                assert.strictEqual(core.params.root, '/path/');
            });

            it('Should support core.params.unitSettings', function () {
                var fooSettings = {foo: 'bar'};
                var core = new Core({unitSettings: {foo: fooSettings}});
                assert.deepEqual(core.params.unitSettings, {
                    foo: {
                        foo: 'bar'
                    }
                });

                assert.notStrictEqual(core.params.unitSettings.foo, fooSettings);
            });
        });

        describe('core.logger', function () {
            var Logger = require('loggin/core/logger');

            it('Should create logger', function () {
                var core = new Core();
                assert.ok(core.logger instanceof Logger);
            });

            it('Should bind context from params.name', function () {
                var core = new Core({
                    name: 'foo'
                });
                var name = _.last(core.logger.context.split(/\W+/));
                assert.strictEqual(name, 'foo');
            });

            it('Should take logging settings', function () {
                var core = new Core({
                    name: 'foo',
                    logging: {
                        logLevel: 'FOO'
                    }
                });

                assert.strictEqual(core.logger.logLevel, 'FOO');
            });
        });
    });

    describe('core.ready()', function () {
        var vow = require('vow');

        it('Should return promise', function () {
            var core = new Core();
            assert.ok(vow.isPromise(core.ready()));
        });

        it('Should be ready once', function () {
            var core = new Core();
            var ready = core.ready();
            assert.strictEqual(ready, core.ready());
        });
    });

    describe('core.install()', function () {

        it('Should install plugin by module name', function (done) {
            var core = new Core();
            core.install(path.join(__dirname, 'fixtures', 'plug', 'async-plugin'));
            core.ready().done(function () {
                assert.strictEqual(core.async, 42);
                done();
            });
        });

        it('Should install plugin by file name', function (done) {
            var core = new Core();
            core.install(path.join(__dirname, 'fixtures', 'plug', 'async-plugin.js'));
            core.ready().done(function () {
                assert.strictEqual(core.async, 42);
                done();
            });
        });

        it('Should install no function plugin', function (done) {
            var core = new Core();
            core.install(path.join(__dirname, 'fixtures', 'plug', 'no-func-plugin'));
            core.ready().done(function () {
                assert.strictEqual(global.__test_spy__, 'ASYNC');
                delete global.__test_spy__;
                done();
            });
        });

        it('Should install sync plugin', function (done) {
            var core = new Core();
            core.install(path.join(__dirname, 'fixtures', 'plug', 'sync-plugin'));
            core.ready().done(function () {
                assert.strictEqual(core.sync, 42);
                done();
            });
        });

        it('Should install plugins by glob', function (done) {
            var core = new Core();

            delete require.cache[require.resolve('./fixtures/plug/no-func-plugin')];
            assert.strictEqual(global.__test_spy__, void 0);
            core.install(path.join(__dirname, 'fixtures', 'plug', '*.js'));

            core.ready().done(function () {
                assert.strictEqual(core.sync, 42);
                assert.strictEqual(core.async, 42);
                assert.strictEqual(global.__test_spy__, 'ASYNC');
                delete global.__test_spy__;
                done();
            });
        });

        it('Should be failed on ready by ASYNC error', function (done) {
            var core = new Core();
            core.install(path.join(__dirname, 'fixtures/plug/e/async-error'));
            core.ready().done(null, function (err) {
                assert.strictEqual(err, 'ASYNC');
                done();
            });
        });

        it('Should be failed on ready by SYNC error', function (done) {
            var core = new Core();
            core.install(path.join(__dirname, 'fixtures/plug/e/sync-error'));
            core.ready().done(null, function (err) {
                assert.strictEqual(err, 'SYNC');
                done();
            });
        });

        it('Should be failed on ready by REQUIRE error', function (done) {
            var core = new Core();
            core.install(path.join(__dirname, 'fixtures/plug/e/require-error'));
            core.ready().done(null, function (err) {
                assert.strictEqual(err, 'REQUIRE');
                done();
            });
        });

        it('Plugins can install plugins', function (done) {
            var core = new Core();

            delete require.cache[require.resolve('./fixtures/plug/no-func-plugin')];
            assert.strictEqual(global.__test_spy__, void 0);

            core.install(path.join(__dirname, 'fixtures/plug/complex/bootstrap'));

            core.ready().done(function () {
                assert.strictEqual(core.BOOTSTRAP, 42);
                assert.strictEqual(core.INSTALLER, 42);
                assert.strictEqual(core.sync, 42);
                assert.strictEqual(core.async, 42);
                assert.strictEqual(global.__test_spy__, 'ASYNC');
                delete global.__test_spy__;
                done();
            });
        });

        it('Should install plugin with settings', function () {
            var core = new Core();
            core.install(path.join(__dirname, 'fixtures/plug/with-settings/plugin.js'), {
                foo: 'bar'
            });

            core.ready().done(function () {
                assert.deepEqual(core.settings, {
                    foo: 'bar'
                });
            });
        });

        it('Should not install plugin a twice', function (done) {
            var core = new Core();

            core.install(path.join(__dirname, 'fixtures/plug/twice/twice.js'));
            core.install(path.join(__dirname, 'fixtures/plug/twice/twice.js'));
            core.install(path.join(__dirname, 'fixtures/plug/twice/twice.js'));

            core.ready().done(function () {
                assert.strictEqual(core.__test__, 1);
                done();
            });
        });

        it('Should install plugins in right order', function (done) {
            var core = new Core();
            core.install(path.join(__dirname, 'fixtures/plug/plugin-tree/index.js'));
            core.ready().done(function () {
                assert.deepEqual(core.order, [
                    1,
                    'plug1',
                    'sub',
                    'plug2'
                ]);
                done();
            });
        });
    });

    describe('core.unit()', function () {

        it('Should declare unit', function (done) {
            var core = new Core();
            core.unit({
                base: 0,
                name: 'foo'
            });

            core.ready().done(function () {
                assert.ok(core.getUnit('foo') instanceof core.Unit);
                done();
            });
        });

        it('Should declare unit with implicit base', function (done) {
            var core = new Core();
            core.unit({
                name: 'foo'
            });

            core.ready().done(function () {
                assert.ok(core.getUnit('foo') instanceof core.Unit);
                done();
            });
        });

        it('Should cascade declare units', function (done) {
            var core = new Core();

            core.unit({
                base: 0,
                name: 'foo'
            });

            core.unit({
                base: 'foo',
                name: 'bar'
            });

            core.unit({
                base: 'foo',
                name: 'zot'
            });

            core.unit({
                base: 'bar',
                name: 'moo'
            });

            core.ready().done(function () {
                setTimeout(function () {
                    assert.ok(core.getUnit('foo') instanceof core.Unit);
                    assert.ok(core.getUnit('bar') instanceof core.Unit);
                    assert.ok(core.getUnit('zot') instanceof core.Unit);
                    assert.ok(core.getUnit('moo') instanceof core.Unit);
                    done();
                }, 100);
            });
        });

        it('Should ignore the units which names starts with "_"', function (done) {
            var core = new Core();
            core.unit({
                base: 0,
                name: '_foo'
            });

            core.unit({
                base: '_foo',
                name: 'bar'
            });

            core.ready().done(function () {
                assert.ok(core.getUnit('bar') instanceof core.Unit);
                assert.ok(!core.getUnit('_foo'));
                assert.ok(core.getUnitClass('_foo'));
                done();
            });
        });

        it('Should be rejected because of unit.name is not a string', function () {
            var core = new Core();

            assert.throws(function () {
                core.unit({});
            });
        });

        it('Should be rejected because of unit.name is not an identifier', function () {
            var core = new Core();

            assert.doesNotThrow(function () {
                core.unit({
                    name: 'foo.bar'
                });
            });

            assert.throws(function () {
                core.unit({
                    name: '1'
                });
            });
        });

        it('Should be rejected because of not base found', function (done) {
            var core = new Core();
            core.unit({
                name: 'foo',
                base: 'bar'
            });

            core.ready().fail(function () {
                done();
            });
        });

        it('Should use params.implicitBase as implicit base unit', function () {
            var core = new Core({
                implicitBase: 'foo'
            });

            core.unit({
                base: 0,
                name: 'foo',
                x: 1
            });

            core.unit({
                name: 'bar',
                y: 2
            });

            core.ready().done(function () {
                assert.ok(core.getUnit('foo') instanceof core.Unit);
                assert.strictEqual(core.getUnit('foo').x, 1);
                assert.ok(core.getUnit('bar') instanceof core.Unit);
                assert.ok(core.getUnit('bar') instanceof core.getUnitClass('foo'));
                assert.strictEqual(core.getUnit('bar').x, 1);
                assert.strictEqual(core.getUnit('bar').y, 2);
            });
        });
    });

    describe('core.alias()', function () {
        it('Should inherit from unit with new name', function (done) {
            var core = new Core();
            core.unit({
                name: 'foo',
                x: 42
            });

            core.alias('foo', 'bar');

            core.ready().done(function () {
                assert.ok(core.getUnit('foo') instanceof core.Unit);
                assert.ok(core.getUnit('bar') instanceof core.Unit);
                assert.strictEqual(core.getUnit('foo').x, 42);
                assert.strictEqual(core.getUnit('bar').x, 42);
                done();
            });
        });

        it('Should inherit from unit with new name by object', function (done) {
            var core = new Core();

            core.unit({
                name: 'foo',
                x: 42
            });

            core.alias({
                foo: 'bar'
            });

            core.ready().done(function () {
                assert.ok(core.getUnit('foo') instanceof core.Unit);
                assert.ok(core.getUnit('bar') instanceof core.Unit);
                assert.strictEqual(core.getUnit('foo').x, 42);
                assert.strictEqual(core.getUnit('bar').x, 42);
                done();
            });
        });
    });

    describe('core.callUnit()', function () {
        it('Should call unit by name', function (done) {
            var core = new Core();
            core.unit({
                name: 'foo',
                main: function () {
                    return 42;
                }
            });

            core.ready().done(function () {
                core.callUnit(new Track(core, logger), 'foo', null, function (err, val) {
                    assert.ok(!err);
                    assert.strictEqual(val.result, 42);
                    done();
                });
            });
        });

        it('Should be rejected', function (done) {
            var core = new Core();
            core.ready().done(function () {
                core.callUnit(new Track(core, logger), 'foo', null, function (err) {
                    assert.ok(err);
                    done();
                });
            });
        });
    });
});
