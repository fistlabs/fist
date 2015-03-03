/*eslint max-nested-callbacks: 0*/
'use strict';

var Core = require('../core/core');
var Track = require('../core/track');
var Context = require('../core/context');
var Cache = require('lru-dict/core/lru-dict-ttl-async');

var assert = require('assert');
var logging = require('loggin');
var vow = require('vow');

// behaviour tests of `unit.run(Track track, Object args, Function done)` method
describe.only('core/unit#run()', function () {
    var Unit = require('../core/unit');
    var logger = logging.getLogger('silent-test').conf({
        handlers: []
    });

    it('Should be a function', function () {
        assert.strictEqual(typeof Unit.prototype.run, 'function');
    });

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
        var core = new Core({
            logging: {
                logLevel: 'SILENT'
            }
        });
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
                assert.ok(context instanceof Context);
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

    it('Should cache result by `identity` for `maxAge` time', function (done) {
        var core = new Core();
        var spy = 0;

        core.unit({
            name: 'foo',
            maxAge: 0.05,
            cache: new Cache(0xFFFF),
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
        var core = new Core();
        var spy = 0;

        core.unit({
            name: 'foo',
            maxAge: 0.05,
            cache: new Cache(0xFFFF),
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
        var core = new Core();
        var spy = 0;

        core.unit({
            name: 'foo',
            deps: ['bar'],
            maxAge: 10,
            cache: new Cache(0xFFFF),
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
        var core = new Core();
        var spy = 0;

        core.unit({
            name: 'foo',
            deps: ['bar'],
            maxAge: 0.05,
            cache: new Cache(0xFFFF),
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
        var core = new Core();
        var spy = 0;

        core.unit({
            name: 'base',
            cache: new Cache(0xFFFF)
        });

        core.unit({
            base: 'base',
            name: 'foo',
            deps: ['bar'],
            maxAge: 0.10,
            main: function () {
                spy += 1;
                return spy;
            }
        });

        core.unit({
            base: 'base',
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

        core.unit({
            name: 'foo',
            maxAge: 0.10,
            cache: {
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
            },
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

        core.unit({
            name: 'foo',
            maxAge: 0.10,
            cache: {
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
            },
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

        core.unit({
            name: 'foo',
            cache: {
                set: function (k, v, ttl, fn) {
                    spy += 1;
                    fn();
                }
            },
            deps: ['bar'],
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
        var core = new Core();

        core.unit({
            name: 'base',
            cache: new Cache(0xFFFF)
        });

        core.unit({
            base: 'base',
            name: 'foo',
            deps: ['bar'],
            maxAge: 0.10,
            main: function (track, context) {
                return context.r('bar');
            }
        });

        core.unit({
            base: 'base',
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
