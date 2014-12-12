/*eslint max-nested-callbacks: 0*/
/*global describe, it*/
'use strict';

var Logging = require('loggin/core/logging');
var Logger = require('loggin/core/logger');
var Context = require('../core/context');
var Track = require('../core/track');
var Core = require('../core/core');

var assert = require('assert');
var inherit = require('inherit');
var logger = require('loggin');
var vow = require('vow');

function getTrack() {
    return new Track(new Core(), logger);
}

describe('core/init', function () {
    var core = new Core();

    it('Should provide "caches.local" cache property', function () {
        assert.ok(core.caches);
        assert.ok(core.caches.local);
        assert.strictEqual(typeof core.caches.local.get, 'function');
        assert.strictEqual(typeof core.caches.local.set, 'function');
    });

    it('Should be an instance of core.Unit', function () {
        assert.ok(new core.Unit() instanceof core.Unit);
    });

    it('Should have Object params property', function () {
        var unit = new core.Unit();
        assert.ok(unit.params);
        assert.strictEqual(typeof unit.params, 'object');
    });

    it('Should have Number maxAge property', function () {
        var unit = new core.Unit();
        assert.strictEqual(typeof unit.maxAge, 'number');

    });

    describe('core.Unit.inherit', function () {

        it('Should have static inherit method', function () {
            assert.strictEqual(typeof core.Unit.inherit, 'function');
        });

        it('Should inherit from self', function () {
            var MyUnit = core.Unit.inherit();
            var unit = new MyUnit();
            assert.ok(unit instanceof core.Unit);
            assert.ok(unit instanceof MyUnit);
            assert.strictEqual(typeof MyUnit.inherit, 'function');
        });

        it('Should support own and static members', function () {
            var MyUnit = core.Unit.inherit({
                foo: 11
            }, {
                bar: 12
            });
            var unit = new MyUnit();
            assert.strictEqual(unit.foo, 11);
            assert.strictEqual(MyUnit.bar, 12);
        });

        it('Should support mixins', function () {
            function Mixin() {}

            Mixin.prototype.foo = function () {};

            var MyUnit = core.Unit.inherit({
                mixins: [Mixin]
            });
            var unit = new MyUnit();

            assert.strictEqual(unit.foo, Mixin.prototype.foo);
        });
    });

    describe('unit.createContext()', function () {
        it('Should have createContext method', function () {
            var unit = new core.Unit();
            assert.strictEqual(typeof unit.createContext, 'function');
        });

        it('Should create Context', function () {
            var unit = new core.Unit();
            assert.ok(unit.createContext(new Logger(new Logging())) instanceof Context);
        });
    });

    describe('unit.hashArgs()', function () {
        it('Should have hashArgs method', function () {
            var unit = new core.Unit();
            assert.strictEqual(typeof unit.hashArgs, 'function');
        });

        it('Should return empty string by default', function () {
            var Unit = inherit(core.Unit, {
                name: 'foo'
            });

            var unit = new Unit();
            var track = getTrack();
            var context = new Context(new Logger(new Logging())).
                setup(unit.params, track.params, {foo: 'bar'});

            assert.strictEqual(unit.hashArgs(track, context), '');
        });
    });

    describe('unit.call()', function () {
        it('Should have unit.call() method', function () {
            var unit = new core.Unit();
            assert.strictEqual(typeof unit.call, 'function');
        });

        it('Should call .main() method', function (done) {
            var Unit = inherit(core.Unit, {
                name: 'foo',
                main: function () {
                    return 42;
                }
            });

            var track = getTrack();
            var unit = new Unit();

            unit.call(track, unit.createContext(track.logger.bind(unit.name)), function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.result, 42);
                done();
            });
        });

        it('Should setup context before calling', function (done) {
            var Unit = inherit(core.Unit, {
                name: 'foo',
                params: {
                    foo: 'bar',
                    bar: 'baz',
                    baz: 'zot'
                },
                main: function (track, context) {

                    assert.deepEqual(context.params, {
                        foo: 'bar',
                        bar: 42,
                        baz: 12
                    });

                    return 100500;
                }
            });

            var track = getTrack();

            track.params = {
                bar: 42,
                baz: 11
            };

            var unit = new Unit();
            var context = unit.createContext(track.logger.bind(unit.name)).
                setup(unit.params, track.params, {
                    baz: 12
                });

            unit.call(track, context, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.result, 100500);
                done();
            });
        });

        it('Should support cache', function (done) {
            var i = 0;
            var Unit = inherit(core.Unit, {

                name: 'foo',

                maxAge: 0.05,

                hashArgs: function () {
                    return 'bar';
                },

                main: function () {
                    i += 1;
                    return i;
                }
            });

            var track = getTrack();
            var unit = new Unit();
            var context = unit.createContext(track.logger.bind(unit.name)).
                setup(unit.params, track.params);

            unit.call(track, context, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.result, 1);
                assert.strictEqual(res.memKey, 'foo-bar');

                unit.call(track, context, function (err, res) {
                    assert.ok(!err);
                    assert.strictEqual(res.result, 1);
                    assert.strictEqual(res.memKey, 'foo-bar');

                    setTimeout(function () {
                        unit.call(track, context, function (err, res) {
                            assert.ok(!err);
                            assert.strictEqual(res.result, 2);
                            assert.strictEqual(res.memKey, 'foo-bar');

                            done();
                        });
                    }, 70);
                });
            });
        });

        it('Should not use cache fetch failed', function (done) {
            var i = 0;
            var cacheName = Math.random();

            core.caches[cacheName] = {
                get: function (k, fn) {
                    setTimeout(function () {
                        fn(new Error());
                    }, 0);
                },
                set: function (k, v, ttl, fn) {
                    setTimeout(function () {
                        fn(new Error());
                    }, 0);
                }
            };

            var Unit = inherit(core.Unit, {
                name: 'foo',

                cache: cacheName,

                maxAge: 0.05,

                hashArgs: function () {
                    return 'bar';
                },

                main: function () {
                    i += 1;
                    return i;
                }

            });

            var track = getTrack();
            var unit = new Unit();
            var context = unit.createContext(track.logger.bind(unit.name)).
                setup(unit.params, track.params);

            unit.call(track, context, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.result, 1);
                assert.strictEqual(res.memKey, 'foo-bar');

                unit.call(track, context, function (err, res) {
                    assert.ok(!err);
                    assert.strictEqual(res.result, 2);
                    assert.strictEqual(res.memKey, 'foo-bar');

                    done();
                });
            });
        });

        it('Should not cache errors', function (done) {
            var i = 0;
            var Unit = inherit(core.Unit, {
                name: 'foo',

                maxAge: 0.05,

                main: function () {
                    i += 1;
                    throw i;
                }

            });

            var track = getTrack();
            var unit = new Unit();
            var context = unit.createContext(track.logger.bind(unit.name));

            unit.call(track, context, function (err) {
                assert.strictEqual(err, 1);

                unit.call(track, context, function (err) {
                    assert.strictEqual(err, 2);
                    done();
                });
            });
        });

        it('Should not use cache if memKey is falsy', function (done) {
            var i = 0;
            var Unit = inherit(core.Unit, {
                name: 'foo',

                _buildTag: function () {
                    return null;
                },

                maxAge: 0.05,

                main: function () {
                    i += 1;
                    return i;
                }

            });

            var track = getTrack();
            var unit = new Unit();

            unit.call(track, unit.createContext(track.logger.bind(unit.name)), function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.result, 1);
                assert.strictEqual(res.memKey, null);

                unit.call(track, unit.createContext(track.logger.bind(unit.name)), function (err, res) {
                    assert.ok(!err);
                    assert.strictEqual(res.result, 2);
                    assert.strictEqual(res.memKey, null);
                    done();
                });
            });
        });

        it('Should not return result if track was flushed', function (done) {
            var Unit = inherit(core.Unit, {
                name: 'foo',
                main: function (track) {
                    track._isFlushed = true;
                    return 42;
                }
            });

            var track = getTrack();
            var unit = new Unit();

            unit.call(track, unit.createContext(track.logger.bind(unit.name)), function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res, null);
                done();
            });
        });

        it('Should not cache if track was flushed', function (done) {
            var i = 0;
            var Unit = inherit(core.Unit, {
                name: 'foo',

                maxAge: 0.05,

                main: function (track) {
                    i += 1;
                    track._isFlushed = true;
                    return i;
                }

            });

            var track = getTrack();
            var unit = new Unit();

            unit.call(track, unit.createContext(track.logger.bind(unit.name)), function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res, null);
                assert.strictEqual(i, 1);

                unit.call(track, unit.createContext(track.logger.bind(unit.name)), function (err, res) {
                    assert.ok(!err);
                    assert.strictEqual(res, null);
                    assert.strictEqual(i, 2);
                    done();
                });
            });
        });

        it('Should be rejected event if track was flushed', function (done) {
            var i = 0;
            var Unit = inherit(core.Unit, {
                name: 'foo',
                main: function (track) {
                    i += 1;
                    track._isFlushed = true;
                    throw i;
                }
            });

            var unit = new Unit();
            var track = getTrack();
            var context = unit.createContext(track.logger.bind(unit.name));

            unit.call(track, context, function (err) {
                assert.strictEqual(err, 1);
                done();
            });
        });

        it('Should support returned promise in "main" method', function (done) {
            var Unit = inherit(core.Unit, {
                name: 'foo',
                main: function () {
                    return vow.resolve(42);
                }
            });

            var unit = new Unit();
            var track = getTrack();
            var context = unit.createContext(track.logger.bind(unit.name));

            unit.call(track, context, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.result, 42);
                done();
            });
        });

        it('Should support thrown promise in "main" method', function (done) {
            var Unit = inherit(core.Unit, {
                name: 'foo',
                main: function () {
                    throw vow.resolve(42);
                }
            });

            var unit = new Unit();
            var track = getTrack();
            var context = unit.createContext(track.logger.bind(unit.name));

            unit.call(track, context, function (err) {
                assert.strictEqual(err, 42);
                done();
            });
        });
    });

});
