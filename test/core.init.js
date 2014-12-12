/*eslint max-nested-callbacks: 0, no-proto: 0*/
/*global describe, it*/
'use strict';

var Track = require('../core/track');
var Core = require('../core/core');

var assert = require('assert');
var logger = require('loggin');
var vow = require('vow');

describe('core/init', function () {

    it('Should provide "caches.local" cache property', function () {
        var core = new Core();
        assert.ok(core.caches);
        assert.ok(core.caches.local);
        assert.strictEqual(typeof core.caches.local.get, 'function');
        assert.strictEqual(typeof core.caches.local.set, 'function');
    });

    it('Should be an instance of core.Unit', function (done) {
        var core = new Core();
        core.unit({
            name: 'foo'
        });

        core.ready().done(function () {
            assert.ok(core.getUnit('foo') instanceof core.Unit);
            done();
        });

    });

    it('Should have Object params property', function (done) {
        var core = new Core();

        core.unit({
            name: 'foo',
            params: {
                bar: 'baz'
            }
        });

        core.ready().done(function () {
            var unit = core.getUnit('foo');
            assert.ok(unit.params);
            assert.strictEqual(typeof unit.params, 'object');
            assert.deepEqual(unit.params, {
                bar: 'baz'
            });
            done();
        });

    });

    it('Should have Number [maxAge=0] property', function (done) {
        var core = new Core();

        core.unit({
            name: 'foo'
        });

        core.ready().done(function () {
            var unit = core.getUnit('foo');
            assert.strictEqual(typeof unit.maxAge, 'number');
            assert.strictEqual(unit.maxAge, 0);
            done();
        });
    });

    describe('core.Unit.inherit', function () {

        it('Should have static inherit method', function () {
            var core = new Core();
            assert.strictEqual(typeof core.Unit.inherit, 'function');
        });

        it('Should inherit from self', function (done) {
            var core = new Core();
            core.unit({
                name: 'foo'
            });
            core.unit({
                base: 'foo',
                name: 'bar'
            });

            core.ready().done(function () {
                var Foo = core.getUnitClass('foo');
                var Bar = core.getUnitClass('bar');

                assert.ok(core.getUnit('foo') instanceof Foo);
                assert.ok(core.getUnit('bar') instanceof Foo);
                assert.ok(core.getUnit('bar') instanceof Bar);

                assert.strictEqual(typeof Foo.inherit, 'function');
                assert.strictEqual(typeof Bar.inherit, 'function');
                done();
            });
        });

        it('Should support own and static members', function (done) {
            var core = new Core();
            core.unit({
                name: 'foo',
                foo: 11
            }, {
                bar: 12
            });

            core.ready().done(function () {
                var Foo = core.getUnitClass('foo');
                var unit = core.getUnit('foo');

                assert.strictEqual(unit.foo, 11);
                assert.strictEqual(Foo.bar, 12);
                done();
            });
        });

        it('Should support mixins', function (done) {
            var core = new Core();

            core.unit({
                name: 'foo',
                mixins: [Mixin]
            });

            function Mixin() {}

            Mixin.prototype.foo = function () {};

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                assert.strictEqual(unit.foo, Mixin.prototype.foo);
                done();
            });
        });
    });

    describe('unit.createContext()', function () {
        //  TODO TESTS
        it('Should have createContext method', function (done) {
            var core = new Core();
            core.unit({
                name: 'foo'
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                assert.strictEqual(typeof unit.createContext, 'function');
                done();
            });
        });

        it('Should create Context', function (done) {
            var core = new Core();
            var track = new Track(core, logger);

            core.unit({
                name: 'foo'
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                var context = unit.createContext(track);
                assert.ok(context);
                assert.notStrictEqual(context, track);
                done();
            });

        });
    });

    describe('unit.hashArgs()', function () {
        it('Should have hashArgs method', function (done) {
            var core = new Core();
            core.unit({
                name: 'foo'
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                assert.strictEqual(typeof unit.hashArgs, 'function');
                done();
            });
        });

        it('Should return empty string by default', function (done) {
            var core = new Core();
            var track = new Track(core, logger);

            core.unit({
                name: 'foo'
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                var context = unit.createContext(track);
                assert.strictEqual(unit.hashArgs(track, context), '');
                done();
            });
        });
    });

    describe('unit.call()', function () {
        it('Should have unit.call() method', function (done) {
            var core = new Core();
            core.unit({
                name: 'foo'
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                assert.strictEqual(typeof unit.call, 'function');
                done();
            });
        });

        it('Should call .main() method', function (done) {
            var core = new Core();
            var track = new Track(core, logger);

            core.unit({
                name: 'foo',
                main: function () {
                    return 42;
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.call(track, unit.createContext(track), function (err, res) {
                    assert.ok(!err);
                    assert.strictEqual(res.result, 42);
                    done();
                });
            });
        });

        it('Should support cache', function (done) {
            var i = 0;
            var core = new Core();
            var track = new Track(core, logger);

            core.unit({
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

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.call(track, unit.createContext(track), function (err, res) {
                    assert.ok(!err);
                    assert.strictEqual(res.result, 1);
                    assert.strictEqual(res.memKey, 'foo-bar-');

                    unit.call(track, unit.createContext(track), function (err, res) {
                        assert.ok(!err);
                        assert.strictEqual(res.result, 1);
                        assert.strictEqual(res.memKey, 'foo-bar-');

                        setTimeout(function () {
                            unit.call(track, unit.createContext(track), function (err, res) {
                                assert.ok(!err);
                                assert.strictEqual(res.result, 2);
                                assert.strictEqual(res.memKey, 'foo-bar-');

                                done();
                            });
                        }, 70);
                    });
                });
            });

        });

        it('Should not use cache fetch failed', function (done) {
            var i = 0;
            var core = new Core();
            var track = new Track(core, logger);

            core.caches.xyz = {
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

            core.unit({
                name: 'foo',
                cache: 'xyz',
                maxAge: 0.05,
                hashArgs: function () {
                    return 'bar';
                },
                main: function () {
                    i += 1;
                    return i;
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');

                unit.call(track, unit.createContext(track), function (err, res) {
                    assert.ok(!err);
                    assert.strictEqual(res.result, 1);
                    assert.strictEqual(res.memKey, 'foo-bar-');

                    unit.call(track, unit.createContext(track), function (err, res) {
                        assert.ok(!err);
                        assert.strictEqual(res.result, 2);
                        assert.strictEqual(res.memKey, 'foo-bar-');

                        done();
                    });
                });
            });
        });

        it('Should not cache errors', function (done) {
            var i = 0;
            var core = new Core();
            var track = new Track(core, logger);

            core.unit({
                name: 'foo',
                maxAge: 0.05,
                main: function () {
                    i += 1;
                    throw i;
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.call(track, unit.createContext(track), function (err) {
                    assert.strictEqual(err, 1);

                    unit.call(track, unit.createContext(track), function (err) {
                        assert.strictEqual(err, 2);
                        done();
                    });
                });
            });
        });

        it('Should not use cache if memKey is falsy', function (done) {
            var i = 0;
            var core = new Core();
            var track = new Track(core, logger);

            core.unit({
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

            core.ready().done(function () {
                var unit = core.getUnit('foo');

                unit.call(track, unit.createContext(track), function (err, res) {
                    assert.ok(!err);
                    assert.strictEqual(res.result, 1);
                    assert.strictEqual(res.memKey, null);

                    unit.call(track, unit.createContext(track), function (err, res) {
                        assert.ok(!err);
                        assert.strictEqual(res.result, 2);
                        assert.strictEqual(res.memKey, null);
                        done();
                    });
                });
            });

        });

        it('Should not return result if track was flushed', function (done) {
            var core = new Core();
            var track = new Track(core, logger);

            core.unit({
                name: 'foo',
                main: function (track) {
                    track._isFlushed = true;
                    return 42;
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.call(track, unit.createContext(track), function (err, res) {
                    assert.ok(!err);
                    assert.strictEqual(res, null);
                    done();
                });
            });

        });

        it('Should not cache if track was flushed', function (done) {
            var i = 0;
            var core = new Core();
            var track = new Track(core, logger);

            core.unit({
                name: 'foo',
                maxAge: 0.05,
                main: function (track) {
                    i += 1;
                    track._isFlushed = true;
                    return i;
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.call(track, unit.createContext(track), function (err, res) {
                    assert.ok(!err);
                    assert.strictEqual(res, null);
                    assert.strictEqual(i, 1);

                    unit.call(track, unit.createContext(track), function (err, res) {
                        assert.ok(!err);
                        assert.strictEqual(res, null);
                        assert.strictEqual(i, 2);
                        done();
                    });
                });
            });
        });

        it('Should be rejected even if track was flushed', function (done) {
            var i = 0;
            var core = new Core();
            var track = new Track(core, logger);

            core.unit({
                name: 'foo',
                main: function (track) {
                    i += 1;
                    track._isFlushed = true;
                    throw i;
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');

                unit.call(track, unit.createContext(track), function (err) {
                    assert.strictEqual(err, 1);
                    done();
                });
            });
        });

        it('Should support returned promise in "main" method', function (done) {
            var core = new Core();
            var track = new Track(core, logger);

            core.unit({
                name: 'foo',
                main: function () {
                    return vow.resolve(42);
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');

                unit.call(track, unit.createContext(track), function (err, res) {
                    assert.ok(!err);
                    assert.strictEqual(res.result, 42);
                    done();
                });
            });

        });

        it('Should support thrown promise in "main" method', function (done) {
            var core = new Core();
            var track = new Track(core, logger);

            core.unit({
                name: 'foo',
                main: function () {
                    throw vow.resolve(42);
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');

                unit.call(track, unit.createContext(track), function (err) {
                    assert.strictEqual(err, 42);
                    done();
                });
            });

        });
    });

});
