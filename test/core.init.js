/*eslint max-nested-callbacks: 0, no-proto: 0*/
/*global describe, it*/
'use strict';

var Track = require('../core/track');
var Core = require('../core/core');
var Obus = require('obus');

var assert = require('assert');
var logger = require('loggin');
var vow = require('vow');

describe('core/init', function () {

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

    it('Should fail initialization if dependency is undefined', function (done) {
        var core = new Core();

        core.unit({
            base: 0,
            name: 'foo',
            deps: ['bar']
        });

        core.ready().done(null, function (err) {
            assert.ok(err);
            done();
        });
    });

    it('Should fail initialization one of deps is self', function (done) {
        var core = new Core();

        core.unit({
            base: 0,
            name: 'foo',
            deps: ['foo']
        });

        core.ready().done(null, function (err) {
            assert.ok(err);
            done();
        });
    });

    it('Should fail initialization if recursive deps found', function (done) {
        var core = new Core();

        core.unit({
            base: 0,
            name: 'foo',
            deps: ['bar']
        });

        core.unit({
            base: 0,
            name: 'bar',
            deps: ['foo']
        });

        core.ready().done(null, function (err) {
            assert.ok(err);
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

        it('Should add mixins deps', function (done) {
            var core = new Core();

            function Mix0() {}
            function Mix1() {}

            core.unit({
                base: 0,
                name: 'a'
            });

            core.unit({
                base: 0,
                name: 'b'
            });

            core.unit({
                base: 0,
                name: 'c'
            });

            core.unit({
                base: 0,
                name: 'd'
            });

            core.unit({
                base: 0,
                name: 'e'
            });

            Mix0.prototype.deps = ['c', 'd'];
            Mix1.prototype.deps = ['e'];

            core.unit({
                base: 0,
                name: 'foo',
                mixins: [Mix0],
                deps: ['a']
            });

            core.unit({
                base: 'foo',
                name: 'bar',
                mixins: [Mix1],
                deps: ['b'],
                __constructor: function () {
                    this.__base();
                    assert.deepEqual(this.deps, ['a', 'c', 'd', 'b', 'e']);
                    done();
                }
            });

            core.ready();
        });

        it('Should support deps as no-array', function (done) {
            var core = new Core();

            core.unit({
                base: 0,
                name: 'base',
                deps: 'bar'
            });

            core.unit({
                base: 'base',
                name: 'foo',
                deps: 'baz',
                main: function (track, context) {
                    assert.strictEqual(context.result.get('bar'), 'baz');
                    assert.strictEqual(context.result.get('baz'), 'zot');
                    return 42;
                }
            });

            core.unit({
                name: 'bar',
                main: function () {
                    return 'baz';
                }
            });

            core.unit({
                name: 'baz',
                main: function () {
                    return 'zot';
                }
            });

            core.ready().done(function () {
                new Track(core, logger).invoke('foo').done(function (res) {
                    assert.strictEqual(res, 42);
                    done();
                });
            });
        });

        it('Should automatically add base deps', function (done) {
            var core = new Core();

            core.unit({
                base: 0,
                name: 'base',
                deps: ['bar']
            });

            core.unit({
                base: 'base',
                name: 'foo',
                deps: ['baz'],
                main: function (track, context) {
                    assert.strictEqual(context.result.get('bar'), 'baz');
                    assert.strictEqual(context.result.get('baz'), 'zot');
                    return 42;
                }
            });

            core.unit({
                name: 'bar',
                main: function () {
                    return 'baz';
                }
            });

            core.unit({
                name: 'baz',
                main: function () {
                    return 'zot';
                }
            });

            core.ready().done(function () {
                new Track(core, logger).invoke('foo').done(function (res) {
                    assert.strictEqual(res, 42);
                    done();
                });
            });
        });

        it('Should inherit unit.settings', function (done) {
            var core = new Core({
                unitSettings: {
                    foo: {
                        foo: 'bar'
                    }
                }
            });

            core.unit({
                name: 'foo',
                settings: {
                    foo: ':('
                }
            });

            core.unit({
                name: 'bar',
                base: 'foo',
                settings: {
                    bar: 'baz'
                }
            });

            core.unit({
                name: 'baz',
                base: 'foo'
            });

            core.ready().done(function () {
                assert.deepEqual(core.getUnit('foo').settings, {
                    foo: 'bar'
                });

                assert.deepEqual(core.getUnit('bar').settings, {
                    foo: 'bar',
                    bar: 'baz'
                });

                assert.deepEqual(core.getUnit('baz').settings, {
                    foo: 'bar'
                });

                done();
            });
        });
    });

    describe('unit.identify()', function () {
        it('Should have identify method', function (done) {
            var core = new Core();
            core.unit({
                name: 'foo'
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                assert.strictEqual(typeof unit.identify, 'function');
                done();
            });
        });

        it('Should return default key by default', function (done) {
            var core = new Core();

            core.unit({
                name: 'foo'
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                assert.strictEqual(unit.identify(), 'static');
                done();
            });
        });

        it('Should reuse existing context', function (done) {
            var core = new Core();

            core.unit({
                name: 'foo',
                identify: function () {
                    return 'static';
                }
            });

            core.ready().done(function () {
                var track = new Track(core, logger);
                var unit = core.getUnit('foo');

                unit.run(track, null, function () {
                    var self = this;
                    unit.run(track, null, function () {
                        assert.strictEqual(self, this);
                        done();
                    });
                });
            });
        });
    });

    describe('unit.run()', function () {
        it('Should have unit.run() method', function (done) {
            var core = new Core();
            core.unit({
                name: 'foo'
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                assert.strictEqual(typeof unit.run, 'function');
                done();
            });
        });

        it('Should call unit.main() method', function (done) {
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
                unit.run(track, null, function () {
                    assert.ok(this.isAccepted());
                    assert.strictEqual(this.valueOf(), 42);
                    done();
                });
            });
        });

        it('Should be rejected by thrown promise', function (done) {
            var core = new Core();
            var track = new Track(core, logger);

            core.unit({
                name: 'foo',
                main: function () {
                    throw vow.reject(42);
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(track, null, function () {
                    assert.ok(this.isRejected());
                    assert.strictEqual(this.valueOf(), 42);
                    done();
                });
            });
        });

        it('Should support deps', function (done) {
            var core = new Core();

            core.unit({
                name: 'foo',
                deps: ['bar'],
                main: function (track, context) {
                    assert.ok(context);
                    assert.ok(context.errors instanceof Obus);
                    assert.ok(context.result instanceof Obus);
                    assert.strictEqual(typeof context.r, 'function');
                    assert.strictEqual(typeof context.e, 'function');
                    assert.strictEqual(context.r('bar'), 42);
                    return 11;
                }
            });

            core.unit({
                name: 'bar',
                main: function () {
                    return 42;
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                var track = new Track(core, logger);

                unit.run(track, null, function () {
                    assert.ok(this.isAccepted());
                    assert.strictEqual(this.valueOf(), 11);
                    done();
                });
            });
        });

        it('Should support many deps', function (done) {
            var core = new Core({
                logging: {
                    logLevel: 'SILENT'
                }
            });
            core.unit({
                name: 'u3',
                deps: ['u2', 'u1']
            });
            core.unit({
                name: 'u2',
                deps: ['u1']
            });
            core.unit({
                name: 'u1',
                deps: []
            });

            core.ready().done(function () {
                var unit = core.getUnit('u3');
                var track = new Track(core, logger);
                unit.run(track, null, function () {
                    done();
                });
            });
        });

        it('Deps can be rejected', function (done) {
            var core = new Core();

            core.unit({
                base: 0,
                name: 'foo',
                deps: ['bar'],
                main: function (track, context) {
                    assert.strictEqual(context.errors.get('bar'), 'baz');
                    return 42;
                }
            });

            core.unit({
                name: 'bar',
                main: function () {
                    throw 'baz';
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                var track = new Track(core, logger);
                unit.run(track, null, function () {
                    assert.ok(this.isAccepted());
                    assert.strictEqual(this.valueOf(), 42);
                    done();
                });
            });
        });

        it('Should support deps map', function (done) {
            var core = new Core();

            core.unit({
                base: 0,
                name: 'foo',
                deps: ['bar'],
                depsMap: {
                    bar: 'xyz'
                },
                main: function (track, context) {
                    assert.strictEqual(context.result.get('xyz'), 'baz');
                    return 42;
                }
            });

            core.unit({
                name: 'bar',
                main: function () {
                    return 'baz';
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                var track = new Track(core, logger);
                unit.run(track, null, function () {
                    assert.ok(this.isAccepted());
                    assert.strictEqual(this.valueOf(), 42);
                    done();
                });
            });
        });

        it('Should support static deps args', function (done) {
            var core = new Core();

            core.unit({
                base: 0,
                name: 'foo',
                deps: ['bar'],
                depsArgs: {
                    bar: {
                        x: 'baz'
                    }
                },
                main: function (track, context) {
                    assert.strictEqual(context.result.get('bar'), 'baz');
                    return 42;
                }
            });

            core.unit({
                name: 'bar',
                main: function (track, context) {
                    return context.p('x');
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                var track = new Track(core, logger);
                unit.run(track, null, function () {
                    assert.ok(this.isAccepted());
                    assert.strictEqual(this.valueOf(), 42);
                    done();
                });
            });
        });

        it('Should support deps args as function', function (done) {
            var core = new Core();

            core.unit({
                base: 0,
                name: 'foo',
                deps: ['bar'],
                depsArgs: {
                    bar: function (track, context) {
                        return {
                            x: context.p('x') + 1
                        };
                    }
                },
                main: function (track, context) {
                    assert.strictEqual(context.result.get('bar'), 2);
                    return 42;
                }
            });

            core.unit({
                name: 'bar',
                main: function (track, context) {
                    return context.p('x');
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                var track = new Track(core, logger);

                unit.run(track, {x: 1}, function () {
                    assert.ok(this.isAccepted());
                    assert.strictEqual(this.valueOf(), 42);
                    done();
                });
            });
        });

        it('Should not call unit if one of deps flushes track and returns', function (done) {
            var core = new Core();
            var foo = 0;

            core.unit({
                base: 0,
                name: 'foo',
                deps: ['bar'],
                main: function () {
                    foo += 1;
                    return 42;
                }
            });

            core.unit({
                name: 'bar',
                main: function (track) {
                    track.isFlushed = function () {
                        return true;
                    };
                    return 146;
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                var track = new Track(core, logger);
                unit.run(track, null, function () {
                    assert.ok(!this.isResolved());
                    assert.strictEqual(this.valueOf(), null);
                    assert.strictEqual(foo, 0);
                    done();
                });
            });
        });

        it('Should call callback once', function (done) {
            var core = new Core();
            var foo = 0;

            core.unit({
                base: 0,
                name: 'foo',
                deps: ['bar', 'baz'],
                main: function () {
                    return 42;
                }
            });

            core.unit({
                name: 'bar',
                main: function (track) {
                    track.isFlushed = function () {
                        return true;
                    };
                    return this.name;
                }
            });

            core.unit({
                name: 'baz',
                main: function (track) {
                    track.isFlushed = function () {
                        return true;
                    };
                    return this.name;
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                var track = new Track(core, logger);
                unit.run(track, null, function () {
                    foo += 1;
                    assert.ok(!this.isResolved());
                    assert.strictEqual(this.valueOf(), null);
                    setTimeout(function () {
                        assert.strictEqual(foo, 1);
                        done();
                    }, 10);
                });
            });
        });

        it('Should not call unit if one of deps flushes track and throws', function (done) {
            var core = new Core();
            var foo = 0;

            core.unit({
                base: 0,
                name: 'foo',
                deps: ['bar'],
                main: function () {
                    foo += 1;
                    return 42;
                }
            });

            core.unit({
                name: 'bar',
                main: function (track) {
                    track.isFlushed = function () {
                        return true;
                    };
                    throw 146;
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                var track = new Track(core, logger);
                unit.run(track, null, function () {
                    assert.ok(!this.isResolved());
                    assert.strictEqual(this.valueOf(), null);
                    assert.strictEqual(foo, 0);
                    done();
                });
            });
        });

        it('Should invoke unit', function (done) {
            var core = new Core();

            core.unit({
                name: 'foo',
                main: function () {
                    return 42;
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                var track = new Track(core, logger);

                unit.run(track, null, function () {
                    assert.ok(this.isAccepted());
                    assert.strictEqual(this.valueOf(), 42);
                    done();
                });
            });
        });

        it('Should memorize unit calls', function (done) {
            var i = 0;
            var core = new Core();

            core.unit({
                name: 'foo',
                main: function () {
                    i += 1;
                    return 42;
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                var track = new Track(core, logger);

                unit.run(track, null, function () {
                    assert.ok(this.isAccepted());
                    assert.strictEqual(this.valueOf(), 42);
                    assert.strictEqual(i, 1);

                    unit.run(track, null, function () {
                        assert.ok(this.isAccepted());
                        assert.strictEqual(this.valueOf(), 42);
                        assert.strictEqual(i, 1);
                        done();
                    });
                });
            });
        });

        it('Should memorize unit calls by args hash', function (done) {
            var i = 0;
            var j = 0;
            var args = {
                foo: 'bar'
            };
            var core = new Core();

            core.unit({
                name: 'foo',
                main: function (track, context) {
                    var defer;
                    i += 1;
                    assert.strictEqual(context.params.foo, 'bar');
                    defer = vow.defer();
                    setTimeout(function () {
                        defer.resolve(42);
                    }, 10);
                    return defer.promise();
                },
                identify: function (track, params) {
                    return params.foo;
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                var track = new Track(core, logger);

                unit.run(track, args, function () {
                    assert.ok(this.isAccepted());
                    assert.strictEqual(this.valueOf(), 42);
                    assert.strictEqual(i, 1);
                    j += 1;
                });

                unit.run(track, args, function () {
                    assert.ok(this.isAccepted());
                    assert.strictEqual(this.valueOf(), 42);
                    assert.strictEqual(i, 1);
                    assert.strictEqual(j, 1);

                    unit.run(track, args, function () {
                        assert.ok(this.isAccepted());
                        assert.strictEqual(this.valueOf(), 42);
                        assert.strictEqual(i, 1);
                        assert.strictEqual(j, 1);
                        done();
                    });
                });
            });

        });
    });

    describe('Cache strategy', function () {
        var Cache = require('lru-dict/core/lru-dict-ttl-async');
        function getCachingCore() {
            var core = new Core();
            core.caches.local = new Cache();
            return core;
        }

        it('Should provide "caches.local" property as default cache', function () {
            var core = new Core();
            assert.ok(core.caches);
            assert.ok(core.caches.local);
            assert.strictEqual(typeof core.caches.local.get, 'function');
            assert.strictEqual(typeof core.caches.local.set, 'function');
        });

        it('Should fail initialization on unknown cache link', function (done) {
            var core = new Core();
            core.unit({
                name: 'foo',
                cache: 'bar'
            });

            core.ready().done(null, function (err) {
                assert.ok(err);
                done();
            });
        });

        it('Should cache result by `identity` for `maxAge` time', function (done) {
            var core = getCachingCore();
            var spy = 0;

            core.unit({
                name: 'foo',
                maxAge: 0.05,
                main: function () {
                    spy += 1;
                    return spy;
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');

                unit.run(new Track(core, logger), null, function () {
                    assert.ok(this.isAccepted());
                    assert.strictEqual(spy, 1);
                    assert.strictEqual(spy, this.valueOf());

                    unit.run(new Track(core, logger), null, function () {
                        assert.ok(this.isAccepted());
                        assert.strictEqual(spy, 1);
                        assert.strictEqual(spy, this.valueOf());

                        setTimeout(function () {
                            unit.run(new Track(core, logger), null, function () {
                                assert.ok(this.isAccepted());
                                assert.strictEqual(spy, 2);
                                assert.strictEqual(spy, this.valueOf());

                                done();
                            });
                        }, 60);
                    });
                });
            });
        });

        it('Should not cache result if the track was flushed', function (done) {
            var core = getCachingCore();
            var spy = 0;

            core.unit({
                name: 'foo',
                maxAge: 0.05,
                main: function (track) {
                    spy += 1;
                    track.isFlushed = function () {
                        return true;
                    };
                    return spy;
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');

                unit.run(new Track(core, logger), null, function () {
                    assert.strictEqual(spy, 1);

                    unit.run(new Track(core, logger), null, function () {
                        assert.strictEqual(spy, 2);
                        unit.run(new Track(core, logger), null, function () {
                            assert.strictEqual(spy, 3);
                            done();
                        });
                    });
                });
            });
        });

        it('Should cache result if all of deps was not updated', function (done) {
            var core = getCachingCore();
            var spy = 0;

            core.unit({
                name: 'foo',
                deps: ['bar'],
                maxAge: 10,
                main: function () {
                    spy += 1;
                    return spy;
                }
            });

            core.unit({
                name: 'bar',
                maxAge: 10
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');

                unit.run(new Track(core, logger), null, function () {
                    assert.ok(this.isAccepted());
                    assert.strictEqual(spy, 1);
                    assert.strictEqual(this.valueOf(), spy);
                    unit.run(new Track(core, logger), null, function () {
                        assert.ok(this.isAccepted());
                        assert.strictEqual(spy, 1);
                        assert.strictEqual(this.valueOf(), spy);
                        unit.run(new Track(core, logger), null, function () {
                            assert.ok(this.isAccepted());
                            assert.strictEqual(spy, 1);
                            assert.strictEqual(this.valueOf(), spy);
                            done();
                        });
                    });
                });
            });
        });

        it('Should update result if dependency was updated', function (done) {
            var core = getCachingCore();
            var spy = 0;

            core.unit({
                name: 'foo',
                deps: ['bar'],
                maxAge: 0.05,
                main: function () {
                    spy += 1;
                    return spy;
                }
            });

            core.unit({
                name: 'bar'
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');

                unit.run(new Track(core, logger), null, function () {
                    assert.ok(this.isAccepted());
                    assert.strictEqual(spy, 1);
                    assert.strictEqual(this.valueOf(), spy);

                    unit.run(new Track(core, logger), null, function () {
                        assert.ok(this.isAccepted());
                        assert.strictEqual(spy, 2);
                        assert.strictEqual(this.valueOf(), spy);

                        unit.run(new Track(core, logger), null, function () {
                            assert.ok(this.isAccepted());
                            assert.strictEqual(spy, 3);
                            assert.strictEqual(this.valueOf(), spy);

                            done();
                        });
                    });
                });
            });
        });

        it('Should not check cache if one of deps was rejected', function (done) {
            var core = getCachingCore();
            var spy = 0;

            core.unit({
                name: 'foo',
                deps: ['bar'],
                maxAge: 0.10,
                main: function () {
                    spy += 1;
                    return spy;
                }
            });

            core.unit({
                name: 'bar',
                count: 0,
                maxAge: 0.05,
                main: function () {
                    throw 'ERR'
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');

                unit.run(new Track(core, logger), null, function () {
                    assert.ok(this.isAccepted());
                    assert.strictEqual(spy, 1);
                    assert.strictEqual(this.valueOf(), spy);
                    unit.run(new Track(core, logger), null, function () {
                        assert.ok(this.isAccepted());
                        assert.strictEqual(spy, 2);
                        assert.strictEqual(this.valueOf(), spy);
                        unit.run(new Track(core, logger), null, function () {
                            assert.ok(this.isAccepted());
                            assert.strictEqual(spy, 3);
                            assert.strictEqual(this.valueOf(), spy);
                            done();
                        });
                    });
                });
            });
        });

        it('Should update result if cache fetch failed', function (done) {
            var core = new Core();
            var spy = 0;

            core.caches.local = {
                get: function (k, fn) {
                    setTimeout(function () {
                        fn(new Error('O_O'));
                    }, 0);
                },
                set: function (k, v, ttl, fn) {
                    setTimeout(function () {
                        fn(null, 'OK');
                    }, 0);
                }
            };

            core.unit({
                name: 'foo',
                maxAge: 0.10,
                main: function () {
                    spy += 1;
                    return spy;
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');

                unit.run(new Track(core, logger), null, function () {
                    assert.ok(this.isAccepted());
                    assert.strictEqual(spy, 1);
                    assert.strictEqual(this.valueOf(), spy);
                    unit.run(new Track(core, logger), null, function () {
                        assert.ok(this.isAccepted());
                        assert.strictEqual(spy, 2);
                        assert.strictEqual(this.valueOf(), spy);
                        unit.run(new Track(core, logger), null, function () {
                            assert.ok(this.isAccepted());
                            assert.strictEqual(spy, 3);
                            assert.strictEqual(this.valueOf(), spy);
                            done();
                        });
                    });
                });
            });
        });

        it('Should ignore cache setting fails', function (done) {
            var core = new Core();
            var spy = 0;

            core.caches.local = {
                get: function (k, fn) {
                    setTimeout(function () {
                        fn(null, null);
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
                maxAge: 0.10,
                main: function () {
                    spy += 1;
                    return spy;
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');

                unit.run(new Track(core, logger), null, function () {
                    assert.ok(this.isAccepted());
                    assert.strictEqual(spy, 1);
                    assert.strictEqual(this.valueOf(), spy);
                    unit.run(new Track(core, logger), null, function () {
                        assert.ok(this.isAccepted());
                        assert.strictEqual(spy, 2);
                        assert.strictEqual(this.valueOf(), spy);
                        unit.run(new Track(core, logger), null, function () {
                            assert.ok(this.isAccepted());
                            assert.strictEqual(spy, 3);
                            assert.strictEqual(this.valueOf(), spy);
                            done();
                        });
                    });
                });
            });
        });

        it('Should not set cache if maxAge <= 0', function (done) {
            var core = new Core();
            var spy = 0;

            core.caches.local = {
                set: function (k, v, ttl, fn) {
                    spy += 1;
                    fn();
                }
            };

            core.unit({
                name: 'foo',
                deps: ['bar'],
                cache: 'local',
                maxAge: 0
            });

            core.unit({
                name: 'bar',
                cache: 'local',
                maxAge: 0
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');

                unit.run(new Track(core, logger), null, function () {
                    setTimeout(function () {
                        assert.strictEqual(spy, 0);
                        done();
                    }, 50);
                });
            });
        });

        it('Should cache result if deps are actual', function (done) {
            var core = getCachingCore();

            core.unit({
                name: 'foo',
                deps: ['bar'],
                maxAge: 0.10,
                main: function (track, context) {
                    return context.r('bar');
                }
            });

            core.unit({
                name: 'bar',
                count: 0,
                maxAge: 0.05,
                main: function () {
                    this.count += 1;
                    return this.count;
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');

                unit.run(new Track(core, logger), null, function () {
                    assert.ok(this.isAccepted());
                    assert.strictEqual(this.valueOf(), 1);
                    unit.run(new Track(core, logger), null, function () {
                        assert.ok(this.isAccepted());
                        assert.strictEqual(this.valueOf(), 1);
                        unit.run(new Track(core, logger), null, function () {
                            assert.ok(this.isAccepted());
                            assert.strictEqual(this.valueOf(), 1);
                            done();
                        });
                    });
                });
            });
        });
    });

    describe('unit.settings', function () {
        it('Should support static unit settings as unit member', function (done) {
            var core = new Core();
            var settings = {
                foo: 'bar'
            };

            core.unit({
                name: 'foo',
                settings: settings
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                assert.deepEqual(unit.settings, {
                    foo: 'bar'
                });

                assert.notStrictEqual(unit.settings, settings);
                done();
            });
        });

        it('Should support static unit settings as core.params.unitSettings', function (done) {
            var settings = {
                foo: 'bar'
            };

            var core = new Core({
                unitSettings: {
                    foo: settings
                }
            });

            core.unit({
                name: 'foo'
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                assert.deepEqual(unit.settings, {
                    foo: 'bar'
                });

                assert.notStrictEqual(unit.settings, settings);
                done();
            });
        });

        it('core.params.unitSettings should overwrite unit.settings', function (done) {
            var settings = {
                foo: 'bar',
                bar: 'baz'
            };

            var core = new Core({
                unitSettings: {
                    foo: settings
                }
            });

            core.unit({
                name: 'foo',
                settings: {
                    bar: ':('
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                assert.deepEqual(unit.settings, {
                    foo: 'bar',
                    bar: 'baz'
                });

                assert.notStrictEqual(unit.settings, settings);
                assert.notStrictEqual(core.params.unitSettings.foo, settings);
                done();
            });
        });

        it('Should not fail if core.params.settings is not an object', function (done) {
            var core = new Core({
                unitSettings: null
            });

            core.unit({
                name: 'foo'
            });

            core.ready().done(function () {
                done();
            });
        });
    });
});
