/*eslint max-nested-callbacks: 0, max-params: 0, complexity: 0*/
/*global describe, it*/
'use strict';

var assert = require('assert');

describe('core/runtime', function () {
    var Runtime = require('../core/runtime');

    function fakeRuntime(app, unit, track, parent, args, done) {
        return new Runtime(app || {}, unit || {
            params: {
                foo: 1
            },
            deps: [],
            identify: function () {
                return 'static';
            },
            name: 'foo',
            runtimeInitBits: 0
        }, track || {
            calls: {},
            params: {
                bar: 2
            },
            logger: {
                bind: function () {
                    return {
                        debug: function () {},
                        warn: function () {},
                        error: function () {}
                    };
                }
            }
        }, parent || null, args || null, done || function () {});
    }

    describe('new Runtime()', function () {
        it('Should take (app, unit, track, parent, args, done) arguments', function () {
            var app = {};
            var boundLogger = {};
            var unit = {
                name: 'foo',
                params: {
                    foo: 1
                },
                deps: [],
                identify: function () {
                    return 'static';
                },
                runtimeInitBits: 0
            };
            var track = {
                params: {
                    bar: 2
                },
                logger: {
                    bind: function () {
                        return boundLogger;
                    }
                }
            };
            var parent = {};

            function done() {}

            var runtime = new Runtime(app, unit, track, parent, {baz: 3}, done);
            assert.strictEqual(runtime.app, app);
            assert.strictEqual(runtime.unit, unit);
            assert.strictEqual(runtime.track, track);
            assert.strictEqual(runtime.parent, parent);
            assert.ok(runtime.context);
            assert.deepEqual(runtime.context.params, {
                foo: 1,
                bar: 2,
                baz: 3
            });
            assert.ok(runtime.creationDate instanceof Date);
            assert.strictEqual(typeof runtime.identity, 'string');
            assert.strictEqual(runtime.identity, 'static');
            assert.strictEqual(typeof runtime.cacheKey, 'string');
            assert.strictEqual(typeof runtime.runId, 'string');
            assert.strictEqual(runtime.runId, 'foo-static');
            assert.strictEqual(runtime.value, null);
            assert.strictEqual(runtime.logger, boundLogger);
            assert.strictEqual(runtime.statusBits, unit.runtimeInitBits);

        });
    });

    describe('runtime.fbind()', function () {
        it('Should have method fbind', function () {
            var runtime = fakeRuntime();
            assert.strictEqual(typeof runtime.fbind, 'function');
        });

        it('Should return a function', function () {
            var runtime = fakeRuntime();
            assert.strictEqual(typeof runtime.fbind(function () {}), 'function');
        });

        it('Should return function, bound to runtime', function () {
            var runtime = fakeRuntime();
            var spy = [];
            var func1 = runtime.fbind(function (err, res) {
                assert.strictEqual(this, runtime);
                assert.strictEqual(err, 'ERR');
                assert.strictEqual(res, 'RES');
                spy.push('f1');
            });
            var func2 = runtime.fbind(function (err, res) {
                assert.strictEqual(this, runtime);
                assert.strictEqual(err, 'ERR');
                assert.strictEqual(res, 'RES');
                spy.push('f2');
            });
            func1('ERR', 'RES');
            func2('ERR', 'RES');
            func1('ERR', 'RES');
            func2('ERR', 'RES');
            assert.deepEqual(spy, ['f1', 'f2', 'f1', 'f2']);
        });
    });

    describe('runtime.getTimePassed()', function () {
        it('Should return time passed from runtime created', function (done) {
            var runtime = fakeRuntime();
            setTimeout(function () {
                assert.strictEqual(runtime.getTimePassed(), new Date() - runtime.creationDate);
                done();
            }, 10);
        });
    });

    describe('runtime.valueOf()', function () {
        it('Should return runtime.value', function () {
            var runtime = fakeRuntime();
            runtime.value = 42;
            assert.strictEqual(runtime.valueOf(), 42);
        });
    });

    describe('runtime.isAccepted()', function () {
        it('Should return true if has accepted bit', function () {
            var runtime = fakeRuntime();
            assert.ok(!runtime.isAccepted());
            runtime.statusBits |= parseInt('00000001', 2);
            assert.ok(runtime.isAccepted());
        });
    });

    describe('runtime.isRejected()', function () {
        it('Should return true if has rejected bit', function () {
            var runtime = fakeRuntime();
            assert.ok(!runtime.isRejected());
            runtime.statusBits |= parseInt('00000010', 2);
            assert.ok(runtime.isRejected());
        });
    });

    describe('runtime.isResolved()', function () {
        it('Should return true if has at least one of rejected or accepted bit', function () {
            var runtime = fakeRuntime();
            assert.ok(!runtime.isResolved());
            runtime.statusBits |= parseInt('00000001', 2);
            assert.ok(runtime.isResolved());
            runtime.statusBits = 0;
            runtime.statusBits |= parseInt('00000010', 2);
            assert.ok(runtime.isResolved());
        });
    });

    describe('runtime.start()', function () {
        it('Should start syncCache()', function () {
            var runtime = fakeRuntime();
            var spy = 0;
            runtime.syncCache = function () {
                spy += 1;
            };
            runtime.start();
            assert.strictEqual(spy, 1);
        });

        it('Should use finished runtime as context for runtime with same runId', function () {
            var runtime = fakeRuntime();
            var spy = [];
            runtime.done = function () {
                assert.strictEqual(this, runtime);
                spy.push(1);
            };
            runtime.syncCache = function () {
                this.track.calls[this.runId].emitDone(this);
            };
            runtime.start();
            var runtime2 = fakeRuntime(runtime.app, runtime.unit, runtime.track, null, null, function () {
                assert.strictEqual(this, runtime);
                spy.push(2);
            });
            runtime2.start();
            assert.deepEqual(spy, [1, 2]);
        });

        it('Should call runtime.createDependency on each dependency', function () {
            var spy = [];
            var runtime = fakeRuntime(null, {
                name: 'foo',
                params: {},
                deps: ['a', 'b'],
                identify: function () {
                    return 'static';
                },
                runtimeInitBits: 0
            });

            runtime.createDependency = function (name) {
                spy.push(name);
                return {
                    start: function () {}
                };
            };

            runtime.start();
            assert.deepEqual(spy, ['a', 'b']);
        });
    });

    describe('runtime.prototype.createDependency()', function () {
        it('Should create dependency runtime', function () {
            var runtime = fakeRuntime({
                units: {
                    bar: {
                        name: 'bar',
                        params: {
                            foo: 1
                        },
                        deps: [],
                        identify: function () {
                            return 'static';
                        },
                        runtimeInitBits: 0
                    }
                },
                getUnit: function (name) {
                    return this.units[name];
                }
            }, {
                name: 'foo',
                params: {
                    foo: 1
                },
                deps: ['bar'],
                depsArgs: {
                    bar: function () {}
                },
                identify: function () {
                    return 'static';
                },
                runtimeInitBits: 0
            });

            var dependency = runtime.createDependency('bar');
            assert.ok(dependency instanceof Runtime);
            assert.strictEqual(dependency.app, runtime.app);
            assert.strictEqual(dependency.track, runtime.track);
        });
    });

    describe('runtime.doneAsDependency()', function () {

        it('Should not do anything if parent is skipped', function () {
            var runtime = fakeRuntime();
            var spy = 0;
            runtime.parent = {
                statusBits: parseInt('00000100', 2),
                syncCache: function () {
                    spy += 1;
                }
            };
            runtime.doneAsDependency();
            assert.strictEqual(spy, 0);
        });

        it('Should set parent "is skipped" if self skipped', function () {
            var runtime = fakeRuntime();
            var spy = [];
            runtime.statusBits = parseInt('00000100', 2);
            runtime.parent = {
                statusBits: 0,
                syncCache: function () {
                    spy.push(0);
                },
                finish: function () {
                    spy.push(1);
                }
            };
            runtime.doneAsDependency();
            assert.deepEqual(spy, [1]);
            assert.ok(runtime.parent.statusBits & parseInt('00000100', 2));
        });

        it('Should set unit value to context.errors and set status "skip cache" if rejected', function () {
            var runtime = fakeRuntime();
            var spy = [];
            runtime.parent = {
                statusBits: 0,
                context: {
                    errors: {}
                },
                syncCache: function () {
                    spy.push(0);
                },
                unit: {
                    depsMap: {
                        foo: 'bar'
                    }
                },
                pathsLeft: 1
            };
            runtime.value = 42;
            runtime.statusBits = parseInt('00000010', 2);
            runtime.doneAsDependency();
            assert.ok(runtime.parent.statusBits & parseInt('00010000', 2));
            assert.strictEqual(runtime.parent.context.errors.bar, 42);
            assert.deepEqual(spy, [0]);
        });

        it('Should set unit value to context.result and set status "needUpdate" if accepted', function () {
            var runtime = fakeRuntime();
            var spy = [];
            runtime.parent = {
                keys: [],
                statusBits: 0,
                context: {
                    result: {}
                },
                syncCache: function () {
                    spy.push(0);
                },
                unit: {
                    depsIndexMap: {
                        foo: 0
                    },
                    depsMap: {
                        foo: 'bar'
                    }
                },
                pathsLeft: 1
            };
            runtime.identity = 'xyz';
            runtime.value = 42;
            runtime.statusBits = parseInt('00001001', 2);
            runtime.doneAsDependency();
            assert.ok(runtime.parent.statusBits & parseInt('00001000', 2));
            assert.strictEqual(runtime.parent.context.result.bar, 42);
            assert.deepEqual(spy, [0]);
            assert.deepEqual(runtime.parent.keys, ['xyz']);
        });

        it('Should not call syncCache if not all the dependencies finished', function () {
            var runtime = fakeRuntime();
            var spy = [];
            runtime.parent = {
                keys: [],
                statusBits: 0,
                context: {
                    result: {}
                },
                syncCache: function () {
                    spy.push(0);
                },
                unit: {
                    depsIndexMap: {
                        foo: 0
                    },
                    depsMap: {
                        foo: 'bar'
                    }
                },
                pathsLeft: 2
            };
            runtime.doneAsDependency();
            assert.deepEqual(spy, []);
        });
    });

    describe('runtime.syncCache()', function () {
        it('Should call runtime.callUnitMain() if need update', function () {
            var runtime = fakeRuntime();
            var spy = [];
            runtime.statusBits = parseInt('00001000', 2);
            runtime.callUnitMain = function () {
                spy.push(0);
            };
            runtime.syncCache();
            assert.deepEqual(spy, [0]);
        });

        it('Should call runtime.callUnitMain() if need skip cache', function () {
            var runtime = fakeRuntime();
            var spy = [];
            runtime.statusBits = parseInt('00010000', 2);
            runtime.callUnitMain = function () {
                spy.push(0);
            };
            runtime.syncCache();
            assert.deepEqual(spy, [0]);
        });

        it('Should try to get cache if not need update and not need to skip cache', function () {
            var runtime = fakeRuntime();
            var spy = [];
            runtime.unit.name = 'foo';
            runtime.identity = 'xyz';
            runtime.keys = ['a', 'b'];
            runtime.statusBits = 0;
            runtime.unit.cache = {
                get: function (key, done) {
                    spy.push(0);
                    assert.strictEqual(key, 'foo-xyz-a-b');
                    done(null, 42);
                }
            };
            runtime.onCacheGot = function (err, res) {
                spy.push(1);
                assert.strictEqual(this.cacheKey, 'foo-xyz-a-b');
                assert.strictEqual(err, null);
                assert.strictEqual(res, 42);
                assert.strictEqual(this, runtime);
            };
            runtime.syncCache();
            assert.deepEqual(spy, [0, 1]);
        });
    });

    describe('Runtime.callUnitMain()', function () {
        it('Should call unit.main', function () {
            var runtime = fakeRuntime();
            var spy = [];
            runtime.unit.main = function (track, context) {
                spy.push(0);
                assert.strictEqual(runtime.track, track);
                assert.strictEqual(runtime.context, context);
            };
            Runtime.callUnitMain(runtime);
            assert.deepEqual(spy, [0]);
        });
    });

    describe('runtime.callUnitMain()', function () {
        it('Should invoke Runtime.callUnitMain and be fulfilled', function (done) {
            var runtime = fakeRuntime();
            runtime.unit.main = function () {
                return 42;
            };
            runtime.onMainFulfilled = function (res) {
                assert.strictEqual(res, 42);
                done();
            };
            runtime.callUnitMain();
        });

        it('Should invoke Runtime.callUnitMain and be rejected', function (done) {
            var runtime = fakeRuntime();
            runtime.unit.main = function () {
                throw 42;
            };
            runtime.onMainRejected = function (err) {
                assert.strictEqual(err, 42);
                done();
            };
            runtime.callUnitMain();
        });
    });

    describe('runtime.onCacheGot()', function () {
        it('Should accept value from cache', function () {
            var runtime = fakeRuntime();
            var spy = [];

            runtime.statusBits = 0;
            runtime.finish = function () {
                spy.push(0);
            };
            runtime.onCacheGot(null, {value: 42});
            assert.strictEqual(runtime.value, 42);
            assert.ok(runtime.statusBits & parseInt('00000001', 2));
            assert.deepEqual(spy, [0]);
        });

        it('Should call runtime.callUnitMain() on error', function () {
            var runtime = fakeRuntime();
            var spy = [];

            runtime.callUnitMain = function () {
                spy.push(0);
            };

            runtime.onCacheGot(new Error());
            assert.ok(runtime.statusBits & parseInt('00001000', 2));
            assert.deepEqual(spy, [0]);
        });

        it('Should call runtime.callUnitMain() on empty result', function () {
            var runtime = fakeRuntime();
            var spy = [];

            runtime.callUnitMain = function () {
                spy.push(0);
            };

            runtime.onCacheGot(null, null);
            assert.ok(runtime.statusBits & parseInt('00001000', 2));
            assert.deepEqual(spy, [0]);
        });
    });

    describe('runtime.onMainFulfilled()', function () {
        it('Should call runtime.afterMainCalled() with result and mask', function () {
            var runtime = fakeRuntime();
            var spy = [];
            runtime.afterMainCalled = function (res, mask) {
                spy.push(0);
                assert.strictEqual(res, 42);
                assert.strictEqual(mask, parseInt('00000001', 2));
            };
            runtime.onMainFulfilled(42);
            assert.deepEqual(spy, [0]);
        });
    });

    describe('runtime.onMainRejected()', function () {
        it('Should call runtime.afterMainCalled() with error and mask', function () {
            var runtime = fakeRuntime();
            var spy = [];
            runtime.afterMainCalled = function (err, mask) {
                spy.push(0);
                assert.strictEqual(err, 42);
                assert.strictEqual(mask, parseInt('00000010', 2));
            };
            runtime.onMainRejected(42);
            assert.deepEqual(spy, [0]);
        });
    });

    describe('runtime.afterMainCalled()', function () {
        it('Should not set cache if track.isFlushed()', function () {
            var runtime = fakeRuntime();
            var spy = [];
            runtime.statusBits = parseInt('00001001', 2);
            runtime.track.isFlushed = function () {
                spy.push(0);
                return true;
            };
            runtime.finish = function () {
                spy.push(1);
            };
            runtime.unit.cache = {
                set: function () {
                    spy.push(3);
                }
            };
            runtime.afterMainCalled(42, 0);
            assert.deepEqual(spy, [0, 1]);
            assert.strictEqual(runtime.value, 42);
            assert.ok(runtime.statusBits & parseInt('00001000', 2));
        });

        it('Should not set cache if skipped', function () {
            var runtime = fakeRuntime();
            var spy = [];
            runtime.statusBits = parseInt('00001101', 2);
            runtime.track.isFlushed = function () {
                spy.push(0);
                return false;
            };
            runtime.finish = function () {
                spy.push(1);
            };
            runtime.unit.cache = {
                set: function () {
                    spy.push(3);
                }
            };
            runtime.afterMainCalled(42, 0);
            assert.deepEqual(spy, [0, 1]);
            assert.strictEqual(runtime.value, 42);
            assert.ok(runtime.statusBits & parseInt('00001000', 2));
        });

        it('Should not set cache if skip cache', function () {
            var runtime = fakeRuntime();
            var spy = [];
            runtime.statusBits = parseInt('00011001', 2);
            runtime.track.isFlushed = function () {
                spy.push(0);
                return false;
            };
            runtime.finish = function () {
                spy.push(1);
            };
            runtime.unit.cache = {
                set: function () {
                    spy.push(3);
                }
            };
            runtime.afterMainCalled(42, 0);
            assert.deepEqual(spy, [0, 1]);
            assert.strictEqual(runtime.value, 42);
            assert.ok(runtime.statusBits & parseInt('00001000', 2));
        });

        it('Should set cache', function (done) {
            var runtime = fakeRuntime();
            var spy = [];
            runtime.statusBits = parseInt('00001001', 2);
            runtime.track.isFlushed = function () {
                spy.push(0);
                return false;
            };
            runtime.finish = function () {
                spy.push(1);
            };
            runtime.cacheKey = 'foo-bar';
            runtime.unit.maxAge = 42;
            runtime.unit.cache = {
                set: function (k, v, ttl, _done) {
                    assert.strictEqual(k, runtime.cacheKey);
                    assert.deepEqual(v, {value: runtime.value});
                    assert.strictEqual(ttl, runtime.unit.maxAge);
                    assert.strictEqual(typeof _done, 'function');
                    setTimeout(function () {
                        spy.push(2);
                        _done();
                    }, 0);
                }
            };
            runtime.onCacheSet = function () {
                assert.strictEqual(this, runtime);
                spy.push(3);
            };

            runtime.afterMainCalled(146, 0);
            assert.strictEqual(runtime.value, 146);
            assert.ok(runtime.statusBits & parseInt('00001000', 2));

            setTimeout(function () {
                assert.deepEqual(spy, [0, 1, 2, 3]);
                done();
            }, 10);
        });
    });

    describe('runtime.onCacheSet()', function () {
        it('Should not throw errors', function () {
            var runtime = fakeRuntime();
            assert.doesNotThrow(function () {
                runtime.onCacheSet(new Error());
                runtime.onCacheSet(null, 42);
            });
        });
    });

    describe('runtime.finish()', function () {
        it('Should emit done if accepted', function () {
            var runtime = fakeRuntime();
            var spy = [];
            runtime.statusBits = parseInt('00000001', 2);
            runtime.runId = 'foo';
            runtime.track.calls.foo = {
                emitDone: function (_runtime) {
                    assert.strictEqual(_runtime, runtime);
                    spy.push(0);
                }
            };
            runtime.finish();
            assert.deepEqual(spy, [0]);
        });

        it('Should emit done if rejected', function () {
            var runtime = fakeRuntime();
            var spy = [];
            runtime.statusBits = parseInt('00000010', 2);
            runtime.runId = 'foo';
            runtime.track.calls.foo = {
                emitDone: function (_runtime) {
                    assert.strictEqual(_runtime, runtime);
                    spy.push(0);
                }
            };
            runtime.finish();
            assert.deepEqual(spy, [0]);
        });

        it('Should emit done if not accepted and not rejected', function () {
            var runtime = fakeRuntime();
            var spy = [];
            runtime.statusBits = parseInt('00000000', 2);
            runtime.runId = 'foo';
            runtime.track.calls.foo = {
                emitDone: function (_runtime) {
                    assert.strictEqual(_runtime, runtime);
                    spy.push(0);
                }
            };
            runtime.finish();
            assert.deepEqual(spy, [0]);
        });
    });
});
