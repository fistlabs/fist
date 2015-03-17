/*eslint max-nested-callbacks: 0, max-len: 0*/
'use strict';

var Core = require('../core/core');
var Track = require('../core/track');
var Context = require('../core/context');
var Cache = require('lru-dict/core/lru-dict-ttl-async');
var Bluebird = require('bluebird');

var _ = require('lodash-node');
var assert = require('assert');

function getSilentCore(params) {
    params = _.extend({}, params, {
        logging: {
            enabled: []
        }
    });
    return new Core(params);
}

function getCoresTrack(core, params) {
    var track = new Track(core, core.logger);
    track.params = Object(params);
    return track;
}

// behaviour tests of `unit.run(Track track, Object args, Function done)` method
describe('core/unit#run()', function () {
    var Unit = require('../core/unit');
    it('Should be a function', function () {
        assert.strictEqual(typeof Unit.prototype.run, 'function');
    });

    describe('Basics (signature/resolution/rejection)', function () {
        it('Should call unit.main() method', function (done) {
            var core = getSilentCore();
            var spy = [];
            core.unit({
                name: 'foo',
                maxAge: 0,
                deps: [],
                main: function () {
                    spy.push(1);
                }
            });
            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function () {
                    assert.deepEqual(spy, [1]);
                    done();
                });
            });
        });
        it('unit.main() should get track as first parameter', function (done) {
            var core = getSilentCore();
            var track = getCoresTrack(core);
            var spy = [];
            core.unit({
                name: 'foo',
                maxAge: 0,
                deps: [],
                main: function (track1) {
                    assert.strictEqual(track1, track);
                    spy.push(1);
                }
            });
            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(track, null, function () {
                    assert.deepEqual(spy, [1]);
                    done();
                });
            });
        });
        it('unit.main() should get context as second parameter', function (done) {
            var core = getSilentCore();
            var spy = [];
            core.unit({
                name: 'foo',
                maxAge: 0,
                deps: [],
                main: function (track, context) {
                    assert.ok(context instanceof Context);
                    spy.push(1);
                }
            });
            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function () {
                    assert.deepEqual(spy, [1]);
                    done();
                });
            });
        });
        it('Context params should consists of unit.params, track.params and local params', function (done) {
            var core = getSilentCore();
            var spy = [];
            core.unit({
                params: {
                    a: 1,
                    b: 2,
                    c: 3
                },
                name: 'foo',
                maxAge: 0,
                deps: [],
                main: function (track, context) {
                    assert.deepEqual(context.params, {
                        a: 1,
                        b: 3,
                        c: 5
                    });
                    spy.push(1);
                }
            });
            core.ready().done(function () {
                var unit = core.getUnit('foo');
                var track = getCoresTrack(core, {
                    b: 3,
                    c: 4
                });
                unit.run(track, {c: 5}, function () {
                    assert.deepEqual(spy, [1]);
                    done();
                });
            });
        });
        it('Should call callback with no context and runtime parameter', function (done) {
            var core = getSilentCore();
            core.unit({
                name: 'foo',
                maxAge: 0,
                deps: [],
                main: function () {}
            });
            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function (runtime) {
                    assert.ok(_.isObject(runtime));
                    assert.ok(_.isUndefined(this));
                    done();
                });
            });
        });
        it('Runtime parameter should have Context runtime.context object', function (done) {
            var core = getSilentCore();
            core.unit({
                name: 'foo',
                maxAge: 0,
                deps: [],
                main: function () {}
            });
            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function (runtime) {
                    assert.ok(runtime.context instanceof Context);
                    done();
                });
            });
        });
        it('Runtime parameter should have isAccepted() method', function (done) {
            var core = getSilentCore();
            core.unit({
                name: 'foo',
                maxAge: 0,
                deps: [],
                main: function () {}
            });
            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function (runtime) {
                    assert.strictEqual(typeof runtime.isAccepted, 'function');
                    done();
                });
            });
        });
        it('runtime.isAccepted() should return true if unit.main() returns usual value ' +
        '(not promise)', function (done) {
            var core = new Core();

            core.unit({
                name: 'foo',
                maxAge: 0,
                deps: [],
                main: function () {
                    return 42;
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function (runtime) {
                    assert.ok(runtime.isAccepted());
                    done();
                });
            });
        });
        it('runtime.isAccepted() should return true if unit.main() returns fulfilled ' +
        'promise', function (done) {
            var core = new Core();

            core.unit({
                name: 'foo',
                maxAge: 0,
                deps: [],
                main: function () {
                    return Bluebird.resolve(42);
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function (runtime) {
                    assert.ok(runtime.isAccepted());
                    done();
                });
            });
        });
        it('runtime.isAccepted() should return true if unit.main() returns pending promise that will be ' +
        'fulfilled', function (done) {
            var core = new Core();

            core.unit({
                name: 'foo',
                maxAge: 0,
                deps: [],
                main: function () {
                    var defer = Bluebird.defer();
                    setTimeout(function () {
                        defer.resolve();
                    }, 0);
                    return defer.promise;
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function (runtime) {
                    assert.ok(runtime.isAccepted());
                    done();
                });
            });
        });
        it('Runtime parameter should have isRejected() method', function (done) {
            var core = getSilentCore();
            core.unit({
                name: 'foo',
                maxAge: 0,
                deps: [],
                main: function () {}
            });
            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function (runtime) {
                    assert.strictEqual(typeof runtime.isRejected, 'function');
                    done();
                });
            });
        });
        it('runtime.isRejected() should return true if unit.main() throws', function (done) {
            var core = new Core();

            core.unit({
                name: 'foo',
                maxAge: 0,
                deps: [],
                main: function () {
                    throw new Error();
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function (runtime) {
                    assert.ok(runtime.isRejected());
                    done();
                });
            });
        });
        it('runtime.isRejected() should return true if unit.main() returns rejected ' +
        'promise', function (done) {
            var core = new Core();

            core.unit({
                name: 'foo',
                maxAge: 0,
                deps: [],
                main: function () {
                    return Bluebird.reject();
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function (runtime) {
                    assert.ok(runtime.isRejected());
                    done();
                });
            });
        });
        it('runtime.isRejected() should return true if unit.main() returns pending promise that will be ' +
        'rejected', function (done) {
            var core = new Core();

            core.unit({
                name: 'foo',
                maxAge: 0,
                deps: [],
                main: function () {
                    var defer = Bluebird.defer();
                    setTimeout(function () {
                        defer.reject();
                    }, 0);
                    return defer.promise;
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function (runtime) {
                    assert.ok(runtime.isRejected());
                    done();
                });
            });
        });
        it('runtime.isRejected() should return false if unit was accepted by returning usual ' +
        'value', function (done) {
            var core = new Core();

            core.unit({
                name: 'foo',
                maxAge: 0,
                deps: [],
                main: function () {
                    return 42;
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function (runtime) {
                    assert.ok(!runtime.isRejected());
                    done();
                });
            });
        });
        it('runtime.isAccepted() should return false if unit was rejected ' +
        'by throwing', function (done) {
            var core = new Core();

            core.unit({
                name: 'foo',
                maxAge: 0,
                deps: [],
                main: function () {
                    throw new Error();
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function (runtime) {
                    assert.ok(!runtime.isAccepted());
                    done();
                });
            });
        });
        it('Runtime parameter should have valueOf() method', function (done) {
            var core = getSilentCore();
            core.unit({
                name: 'foo',
                maxAge: 0,
                deps: [],
                main: function () {}
            });
            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function (runtime) {
                    assert.strictEqual(typeof runtime.valueOf, 'function');
                    done();
                });
            });
        });
        it('runtime.valueOf() should return value returned by unit.main() if unit was accepted ' +
        'by returning usual value', function (done) {
            var core = getSilentCore();
            core.unit({
                name: 'foo',
                maxAge: 0,
                deps: [],
                main: function () {
                    return 42;
                }
            });
            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function (runtime) {
                    assert.ok(runtime.isAccepted());
                    assert.strictEqual(runtime.valueOf(), 42);
                    done();
                });
            });
        });
        it('runtime.valueOf() should return resolved promise value if unit.main() returned fulfilled ' +
        'promise', function (done) {
            var core = getSilentCore();
            core.unit({
                name: 'foo',
                maxAge: 0,
                deps: [],
                main: function () {
                    return Bluebird.resolve(42);
                }
            });
            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function (runtime) {
                    assert.ok(runtime.isAccepted());
                    assert.strictEqual(runtime.valueOf(), 42);
                    done();
                });
            });
        });
        it('runtime.valueOf() should return resolved promise value if unit.main() returned pending, ' +
        'then fulfilled promise', function (done) {
            var core = getSilentCore();
            core.unit({
                name: 'foo',
                maxAge: 0,
                deps: [],
                main: function () {
                    var defer = Bluebird.defer();
                    setTimeout(function () {
                        defer.resolve(42);
                    }, 0);
                    return defer.promise;
                }
            });
            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function (runtime) {
                    assert.ok(runtime.isAccepted());
                    assert.strictEqual(runtime.valueOf(), 42);
                    done();
                });
            });
        });
        it('runtime.valueOf() should return error thrown by unit.main()', function (done) {
            var core = getSilentCore();
            core.unit({
                name: 'foo',
                maxAge: 0,
                deps: [],
                main: function () {
                    throw 42;
                }
            });
            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function (runtime) {
                    assert.ok(runtime.isRejected());
                    assert.strictEqual(runtime.valueOf(), 42);
                    done();
                });
            });
        });
        it('runtime.valueOf() should return resolved promise value if unit.main() returned rejected ' +
        'promise', function (done) {
            var core = getSilentCore();
            core.unit({
                name: 'foo',
                maxAge: 0,
                deps: [],
                main: function () {
                    return Bluebird.reject(42);
                }
            });
            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function (runtime) {
                    assert.ok(runtime.isRejected());
                    assert.strictEqual(runtime.valueOf(), 42);
                    done();
                });
            });
        });
        it('runtime.valueOf() should return resolved promise value if unit.main() returned pending, ' +
        'then rejected promise', function (done) {
            var core = getSilentCore();
            core.unit({
                name: 'foo',
                maxAge: 0,
                deps: [],
                main: function () {
                    var defer = Bluebird.defer();
                    setTimeout(function () {
                        defer.reject(42);
                    }, 0);
                    return defer.promise;
                }
            });
            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function (runtime) {
                    assert.ok(runtime.isRejected());
                    assert.strictEqual(runtime.valueOf(), 42);
                    done();
                });
            });
        });
        it('Runtime parameter should have isResolved() method', function (done) {
            var core = getSilentCore();
            core.unit({
                name: 'foo',
                maxAge: 0,
                deps: [],
                main: function () {}
            });
            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function (runtime) {
                    assert.strictEqual(typeof runtime.isResolved, 'function');
                    done();
                });
            });
        });
        it('runtime.isResolved() should return true if execution is accepted', function (done) {
            var core = getSilentCore();
            core.unit({
                name: 'foo',
                maxAge: 0,
                deps: [],
                main: function () {}
            });
            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function (runtime) {
                    assert.ok(runtime.isAccepted());
                    assert.ok(runtime.isResolved());
                    done();
                });
            });
        });
        it('runtime.isResolved() should return true if execution is rejected', function (done) {
            var core = getSilentCore();
            core.unit({
                name: 'foo',
                maxAge: 0,
                deps: [],
                main: function () {
                    throw new Error();
                }
            });
            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function (runtime) {
                    assert.ok(runtime.isRejected());
                    assert.ok(runtime.isResolved());
                    done();
                });
            });
        });

        it('runtime.isResolved() should return false if execution is not accepted and ' +
        'not rejected', function (done) {
            var core = getSilentCore();
            core.unit({
                name: 'bar',
                deps: [],
                maxAge: 0,
                main: function (track) {
                    track.isFlushed = function () {
                        return true;
                    };
                }
            });
            core.unit({
                name: 'foo',
                maxAge: 0,
                deps: ['bar'],
                main: function () {}
            });
            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function (runtime) {
                    assert.ok(!runtime.isRejected());
                    assert.ok(!runtime.isAccepted());
                    assert.ok(!runtime.isResolved());
                    done();
                });
            });
        });
    });

    describe('Executions memorization', function () {

        it('Should memorize accepted unit executions by identity', function (done) {
            var i = 0;
            var core = getSilentCore();

            core.unit({
                name: 'foo',
                deps: [],
                maxAge: 0,
                identify: function () {
                    return 'same';
                },
                main: function () {
                    i += 1;
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                var track = getCoresTrack(core);

                unit.run(track, null, function (runtime1) {
                    assert.ok(runtime1.isAccepted());
                    assert.strictEqual(i, 1);

                    unit.run(track, null, function (runtime2) {
                        assert.ok(runtime2.isAccepted());
                        assert.strictEqual(i, 1);
                        done();
                    });
                });
            });
        });

        it('Should not memorize accepted unit calls if identities are different', function (done) {
            var i = 0;
            var identity = 0;
            var core = getSilentCore();

            core.unit({
                name: 'foo',
                deps: [],
                maxAge: 0,
                identify: function () {
                    return String(identity += 1);
                },
                main: function () {
                    i += 1;
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                var track = getCoresTrack(core);

                unit.run(track, null, function (runtime1) {
                    assert.ok(runtime1.isAccepted());
                    assert.strictEqual(i, 1);

                    unit.run(track, null, function (runtime2) {
                        assert.ok(runtime2.isAccepted());
                        assert.strictEqual(i, 2);
                        done();
                    });
                });
            });
        });

        it('Should memorize rejected unit calls by identity', function (done) {
            var i = 0;
            var core = getSilentCore();

            core.unit({
                name: 'foo',
                deps: [],
                maxAge: 0,
                identify: function () {
                    return 'same';
                },
                main: function () {
                    i += 1;
                    throw new Error();
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                var track = getCoresTrack(core);

                unit.run(track, null, function (runtime1) {
                    assert.ok(runtime1.isRejected());
                    assert.strictEqual(i, 1);

                    unit.run(track, null, function (runtime2) {
                        assert.ok(runtime2.isRejected());
                        assert.strictEqual(i, 1);
                        done();
                    });
                });
            });
        });

        it('Should not memorize same unit executions over different tracks', function (done) {
            var i = 0;
            var core = getSilentCore();

            core.unit({
                name: 'foo',
                deps: [],
                maxAge: 0,
                identify: function () {
                    return 'same';
                },
                main: function () {
                    i += 1;
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');

                unit.run(getCoresTrack(core), null, function () {
                    assert.strictEqual(i, 1);

                    unit.run(getCoresTrack(core), null, function () {
                        assert.strictEqual(i, 2);
                        done();
                    });
                });
            });
        });

        it('Should memorize skipped unit calls by identity', function (done) {
            var fooCheck = 0;
            var barCheck = 0;
            var core = getSilentCore();

            core.unit({
                name: 'bar',
                deps: [],
                maxAge: 0,
                main: function (track) {
                    barCheck += 1;
                    track.isFlushed = function () {
                        return true;
                    };
                },
                identity: function () {
                    return 'same-1';
                }
            });
            core.unit({
                name: 'foo',
                deps: ['bar'],
                maxAge: 0,
                identify: function () {
                    return 'same-2';
                },
                main: function () {
                    fooCheck += 1;
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                var track = getCoresTrack(core);

                unit.run(track, null, function (runtime1) {
                    assert.ok(!runtime1.isResolved());
                    assert.strictEqual(fooCheck, 0);
                    assert.strictEqual(barCheck, 1);

                    unit.run(track, null, function (runtime2) {
                        assert.ok(!runtime2.isResolved());
                        assert.strictEqual(fooCheck, 0);
                        assert.strictEqual(barCheck, 1);
                        done();
                    });
                });
            });
        });

        it('Should also memorize parallel executions', function (done) {
            var i = 0;
            var spy = [];
            var core = getSilentCore();

            core.unit({
                name: 'foo',
                deps: [],
                maxAge: 0,
                identify: function () {
                    return 'same';
                },
                main: function () {
                    i += 1;
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                var track = getCoresTrack(core);

                unit.run(track, null, function () {
                    assert.strictEqual(i, 1);
                    spy.push(1);
                });

                unit.run(track, null, function () {
                    assert.strictEqual(i, 1);
                    spy.push(2);
                });

                unit.run(track, null, function () {
                    assert.deepEqual(spy, [1, 2]);
                    assert.strictEqual(i, 1);
                    done();
                });
            });
        });

        it('Memorized parallel runtimes should have equal status (accept)', function (done) {
            var core = getSilentCore();
            var spy = [];
            var status;
            var i = 0;

            core.unit({
                name: 'foo',
                deps: [],
                maxAge: 0,
                main: function () {
                    i += 1;
                },
                identify: function () {
                    return 'same';
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                var track = getCoresTrack(core);

                unit.run(track, null, function (runtime) {
                    assert.ok(runtime.isAccepted());
                    status = runtime.statusBits;
                    spy.push(1);
                });

                unit.run(track, null, function (runtime) {
                    assert.ok(runtime.isAccepted());
                    assert.strictEqual(status, runtime.statusBits);
                    status = runtime.statusBits;
                    spy.push(2);
                });

                unit.run(track, null, function (runtime) {
                    assert.ok(runtime.isAccepted());
                    assert.strictEqual(status, runtime.statusBits);
                    assert.deepEqual(spy, [1, 2]);
                    assert.strictEqual(i, 1);
                    done();
                });
            });
        });

        it('Memorized parallel runtimes should have equal status (reject)', function (done) {
            var core = getSilentCore();
            var spy = [];
            var status;
            var i = 0;

            core.unit({
                name: 'foo',
                deps: [],
                maxAge: 0,
                main: function () {
                    i += 1;
                    throw new Error();
                },
                identify: function () {
                    return 'same';
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                var track = getCoresTrack(core);

                unit.run(track, null, function (runtime) {
                    assert.ok(runtime.isRejected());
                    status = runtime.statusBits;
                    spy.push(1);
                });

                unit.run(track, null, function (runtime) {
                    assert.ok(runtime.isRejected());
                    assert.strictEqual(status, runtime.statusBits);
                    status = runtime.statusBits;
                    spy.push(2);
                });

                unit.run(track, null, function (runtime) {
                    assert.ok(runtime.isRejected());
                    assert.strictEqual(status, runtime.statusBits);
                    assert.deepEqual(spy, [1, 2]);
                    assert.strictEqual(i, 1);
                    done();
                });
            });
        });

        it('Memorized parallel runtimes should have same value (accept)', function (done) {
            var core = getSilentCore();
            var spy = [];
            var i = 0;

            core.unit({
                name: 'foo',
                deps: [],
                maxAge: 0,
                main: function () {
                    i += 1;
                    return 42;
                },
                identify: function () {
                    return 'same';
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                var track = getCoresTrack(core);

                unit.run(track, null, function (runtime) {
                    assert.ok(runtime.isAccepted());
                    assert.strictEqual(runtime.valueOf(), 42);
                    spy.push(1);
                });

                unit.run(track, null, function (runtime) {
                    assert.ok(runtime.isAccepted());
                    assert.strictEqual(runtime.valueOf(), 42);
                    spy.push(2);
                });

                unit.run(track, null, function (runtime) {
                    assert.ok(runtime.isAccepted());
                    assert.strictEqual(runtime.valueOf(), 42);
                    assert.deepEqual(spy, [1, 2]);
                    assert.strictEqual(i, 1);
                    done();
                });
            });
        });

        it('Memorized parallel runtimes should have same value (reject)', function (done) {
            var core = getSilentCore();
            var spy = [];
            var error = new Error();
            var i = 0;

            core.unit({
                name: 'foo',
                deps: [],
                maxAge: 0,
                main: function () {
                    i += 1;
                    throw error;
                },
                identify: function () {
                    return 'same';
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                var track = getCoresTrack(core);

                unit.run(track, null, function (runtime) {
                    assert.ok(runtime.isRejected());
                    assert.strictEqual(runtime.valueOf(), error);
                    spy.push(1);
                });

                unit.run(track, null, function (runtime) {
                    assert.ok(runtime.isRejected());
                    assert.strictEqual(runtime.valueOf(), error);
                    spy.push(2);
                });

                unit.run(track, null, function (runtime) {
                    assert.ok(runtime.isRejected());
                    assert.strictEqual(runtime.valueOf(), error);
                    assert.deepEqual(spy, [1, 2]);
                    assert.strictEqual(i, 1);
                    done();
                });
            });
        });

        it('Memorized parallel runtimes should have identical context', function (done) {
            var core = getSilentCore();
            var spy = [];
            var fooCallSpy = 0;
            var barCallSpy = 0;

            core.unit({
                name: 'bar',
                deps: [],
                maxAge: 0,
                identity: function () {
                    return 'same-1';
                },
                main: function () {
                    barCallSpy += 1;
                    return 42;
                }
            });

            core.unit({
                name: 'foo',
                deps: ['bar'],
                maxAge: 0,
                main: function () {
                    fooCallSpy += 1;
                },
                identify: function () {
                    return 'same-2';
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                var track = getCoresTrack(core);
                var context;

                unit.run(track, null, function (runtime) {
                    context = runtime.context;
                    assert.strictEqual(context.result.bar, 42);
                    spy.push(1);
                });

                unit.run(track, null, function (runtime) {
                    assert.deepEqual(context, runtime.context);
                    context = runtime.context;
                    spy.push(2);
                });

                unit.run(track, null, function (runtime) {
                    assert.deepEqual(context, runtime.context);
                    assert.deepEqual(spy, [1, 2]);
                    assert.strictEqual(fooCallSpy, 1);
                    assert.strictEqual(barCallSpy, 1);
                    done();
                });
            });
        });

        it('unit.identify() should get track as first parameter', function (done) {
            var core = getSilentCore();
            var spy = [];
            var track = getCoresTrack(core);

            core.unit({
                name: 'foo',
                deps: [],
                maxAge: 0,
                main: function () {},
                identify: function (track1) {
                    assert.strictEqual(track1, track);
                    spy.push(1);
                    return 'same';
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');

                unit.run(track, null, function () {
                    assert.deepEqual(spy, [1]);
                    done();
                });
            });
        });

        it('unit.identify() should get an object with p() method that returns parameter, ' +
        'as second argument', function (done) {
            var core = getSilentCore();
            var spy = [];

            core.unit({
                name: 'foo',
                deps: [],
                maxAge: 0,
                main: function () {},
                identify: function (track, context) {
                    assert.ok(_.isObject(context));
                    assert.ok(_.isFunction(context.p));
                    assert.strictEqual(context.p('foo'), 42);
                    assert.strictEqual(context.p('bar'), 11);
                    spy.push(1);
                    return 'same';
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), {foo: 42, bar: 11}, function () {
                    assert.deepEqual(spy, [1]);
                    done();
                });
            });
        });

        it('Should not memorize different unit calls with same identity', function (done) {
            var core = getSilentCore();
            var spy = [];

            core.unit({
                name: 'foo',
                deps: [],
                maxAge: 0,
                main: function () {
                    spy.push(1);
                },
                identify: function () {
                    return 'same';
                }
            });

            core.unit({
                name: 'bar',
                deps: [],
                maxAge: 0,
                main: function () {
                    spy.push(2);
                },
                identify: function () {
                    return 'same';
                }
            });

            core.ready().done(function () {
                var unitFoo = core.getUnit('foo');
                var unitBar = core.getUnit('bar');
                var track = getCoresTrack(core);

                unitFoo.run(track, null, function () {
                    unitBar.run(track, null, function () {
                        assert.deepEqual(spy, [1, 2]);
                        done();
                    });
                });
            });
        });

        it('Should finish execution once, if one dependency plush parent by flush', function (done) {
            var core = getSilentCore();

            core.unit({
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
                var timeout;
                var foo = 0;
                unit.run(getCoresTrack(core), null, function (runtime) {
                    foo += 1;
                    assert.ok(!runtime.isResolved());
                    clearTimeout(timeout);
                    timeout = setTimeout(function () {
                        assert.strictEqual(foo, 1);
                        done();
                    }, 10);
                });
            });
        });
    });

    describe('Dependencies stuff', function () {

        it('Should resolve deps first, then dependant', function (done) {
            var core = getSilentCore();
            var spy = [];
            core.unit({
                name: 'bar',
                deps: [],
                maxAge: 0,
                main: function () {
                    spy.push(1);
                }
            });
            core.unit({
                name: 'baz',
                deps: [],
                maxAge: 0,
                main: function () {
                    spy.push(2);
                }
            });
            core.unit({
                name: 'foo',
                deps: ['bar', 'baz'],
                maxAge: 0,
                main: function () {
                    spy.push(3);
                }
            });
            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function () {
                    assert.strictEqual(spy[2], 3);
                    assert.deepEqual(spy.sort(), [1, 2, 3]);
                    done();
                });
            });
        });

        it('Should support same unit with different parents', function (done) {
            // u1 have different parents, we should switch it!
            var core = getSilentCore();
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
                unit.run(getCoresTrack(core), null, function () {
                    done();
                });
            });
        });

        it('Should add accepted deps results to context.result by unit.name', function (done) {
            var core = getSilentCore();
            var spy = [];
            core.unit({
                name: 'bar',
                deps: [],
                maxAge: 0,
                main: function () {
                    return 1;
                }
            });
            core.unit({
                name: 'baz',
                deps: [],
                maxAge: 0,
                main: function () {
                    return 2;
                }
            });
            core.unit({
                name: 'foo',
                deps: ['bar', 'baz'],
                maxAge: 0,
                main: function (track, context) {
                    assert.deepEqual(context.result, {
                        bar: 1,
                        baz: 2
                    });
                    spy.push(1);
                }
            });
            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function () {
                    assert.deepEqual(spy, [1]);
                    done();
                });
            });
        });

        it('Should add rejected deps errors to context.errors by unit.name', function (done) {
            var core = getSilentCore();
            var spy = [];
            core.unit({
                name: 'bar',
                deps: [],
                maxAge: 0,
                main: function () {
                    throw 1;
                }
            });
            core.unit({
                name: 'baz',
                deps: [],
                maxAge: 0,
                main: function () {
                    throw 2;
                }
            });
            core.unit({
                name: 'foo',
                deps: ['bar', 'baz'],
                maxAge: 0,
                main: function (track, context) {
                    assert.deepEqual(context.errors, {
                        bar: 1,
                        baz: 2
                    });
                    spy.push(1);
                }
            });
            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function () {
                    assert.deepEqual(spy, [1]);
                    done();
                });
            });
        });

        it('Deps can have different status', function (done) {
            var core = getSilentCore();
            var spy = [];
            core.unit({
                name: 'bar',
                deps: [],
                maxAge: 0,
                main: function () {
                    return 1;
                }
            });
            core.unit({
                name: 'baz',
                deps: [],
                maxAge: 0,
                main: function () {
                    throw 2;
                }
            });
            core.unit({
                name: 'foo',
                deps: ['bar', 'baz'],
                maxAge: 0,
                main: function (track, context) {
                    assert.deepEqual(context.result, {
                        bar: 1
                    });
                    assert.deepEqual(context.errors, {
                        baz: 2
                    });
                    spy.push(1);
                }
            });
            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function () {
                    assert.deepEqual(spy, [1]);
                    done();
                });
            });
        });

        it('Dependency unit name may be a path to add to context.result', function (done) {
            var core = getSilentCore();
            var spy = [];
            core.unit({
                name: 'bar.baz',
                deps: [],
                maxAge: 0,
                main: function () {
                    return 1;
                }
            });
            core.unit({
                name: 'foo',
                deps: ['bar.baz'],
                maxAge: 0,
                main: function (track, context) {
                    assert.deepEqual(context.result, {
                        bar: {
                            baz: 1
                        }
                    });
                    spy.push(1);
                }
            });
            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function () {
                    assert.deepEqual(spy, [1]);
                    done();
                });
            });
        });

        it('Dependency unit name may be a path to add to context.errors', function (done) {
            var core = getSilentCore();
            var spy = [];
            core.unit({
                name: 'bar.baz',
                deps: [],
                maxAge: 0,
                main: function () {
                    throw 1;
                }
            });
            core.unit({
                name: 'foo',
                deps: ['bar.baz'],
                maxAge: 0,
                main: function (track, context) {
                    assert.deepEqual(context.errors, {
                        bar: {
                            baz: 1
                        }
                    });
                    spy.push(1);
                }
            });
            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function () {
                    assert.deepEqual(spy, [1]);
                    done();
                });
            });
        });

        it('Dependencies can be mapped by unit.depsMap', function (done) {
            var core = getSilentCore();
            var spy = [];
            core.unit({
                name: 'bar.baz',
                deps: [],
                maxAge: 0,
                main: function () {
                    throw 1;
                }
            });
            core.unit({
                name: 'foo',
                deps: ['bar.baz'],
                depsMap: {
                    'bar.baz': 'bar'
                },
                maxAge: 0,
                main: function (track, context) {
                    assert.deepEqual(context.errors, {
                        bar: 1
                    });
                    spy.push(1);
                }
            });
            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function () {
                    assert.deepEqual(spy, [1]);
                    done();
                });
            });
        });

        it('Dependencies can be called with args by unit.depsArgs', function (done) {
            var core = getSilentCore();
            var spy = [];
            core.unit({
                name: 'bar',
                deps: [],
                maxAge: 0,
                main: function (track, context) {
                    assert.strictEqual(context.p('testParam'), 42);
                    return 1;
                }
            });
            core.unit({
                name: 'foo',
                deps: ['bar'],
                maxAge: 0,
                depsArgs: {
                    bar: {
                        testParam: 42
                    }
                },
                main: function (track, context) {
                    assert.deepEqual(context.result, {
                        bar: 1
                    });
                    spy.push(1);
                }
            });
            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function () {
                    assert.deepEqual(spy, [1]);
                    done();
                });
            });
        });

        it('Deps args functions should have track and context as parameters', function (done) {
            var core = getSilentCore();
            var spy = [];
            var track = getCoresTrack(core);
            core.unit({
                name: 'bar',
                deps: [],
                maxAge: 0,
                main: function (track1, context) {
                    assert.strictEqual(context.p('testParam'), 42);
                    return 1;
                }
            });
            core.unit({
                name: 'foo',
                deps: ['bar'],
                maxAge: 0,
                depsArgs: {
                    bar: function (track1, context) {
                        assert.strictEqual(track1, track);
                        assert.ok(context instanceof Context);
                        return {
                            testParam: 42
                        };
                    }
                },
                main: function (track1, context) {
                    assert.deepEqual(context.result, {
                        bar: 1
                    });
                    spy.push(1);
                }
            });
            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(track, null, function () {
                    assert.deepEqual(spy, [1]);
                    done();
                });
            });
        });
    });

    describe('Cache ability', function () {

        it('Should cache accepted execution result by identity for unit.maxAge time', function (done) {
            var core = getSilentCore();
            var spy = 0;

            core.unit({
                name: 'foo',
                maxAge: 0.05,
                cache: new Cache(0xFFFF),
                main: function () {
                    spy += 1;
                    return spy;
                },
                identify: function () {
                    return 'same';
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');

                unit.run(getCoresTrack(core), null, function (runtime1) {
                    assert.ok(runtime1.isAccepted());
                    assert.strictEqual(spy, 1);
                    assert.strictEqual(runtime1.valueOf(), spy);

                    unit.run(getCoresTrack(core), null, function (runtime2) {
                        assert.ok(runtime2.isAccepted());
                        assert.strictEqual(spy, 1);
                        assert.strictEqual(runtime2.valueOf(), spy);

                        setTimeout(function () {
                            // except cache invalidation
                            unit.run(getCoresTrack(core), null, function (runtime3) {
                                assert.ok(runtime3.isAccepted());
                                assert.strictEqual(spy, 2);
                                assert.strictEqual(runtime3.valueOf(), spy);
                                done();
                            });
                        }, 60);
                    });
                });
            });
        });

        it('Should not check cache if one of deps was rejected', function (done) {
            var core = getSilentCore();
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
                    throw 'ERR';
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');

                unit.run(getCoresTrack(core), null, function (runtime1) {
                    assert.ok(runtime1.isAccepted());
                    assert.strictEqual(spy, 1);
                    assert.strictEqual(runtime1.valueOf(), spy);
                    unit.run(getCoresTrack(core), null, function (runtime2) {
                        assert.ok(runtime2.isAccepted());
                        assert.strictEqual(spy, 2);
                        assert.strictEqual(runtime2.valueOf(), spy);
                        unit.run(getCoresTrack(core), null, function (runtime3) {
                            assert.ok(runtime3.isAccepted());
                            assert.strictEqual(spy, 3);
                            assert.strictEqual(runtime3.valueOf(), spy);
                            done();
                        });
                    });
                });
            });
        });

        it('Should not cache result if the track was flushed', function (done) {
            var core = getSilentCore();
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

                unit.run(getCoresTrack(core), null, function () {
                    assert.strictEqual(spy, 1);

                    unit.run(getCoresTrack(core), null, function () {
                        assert.strictEqual(spy, 2);
                        unit.run(getCoresTrack(core), null, function () {
                            assert.strictEqual(spy, 3);
                            done();
                        });
                    });
                });
            });
        });

        it('Should cache result if all of deps was not updated', function (done) {
            var core = getSilentCore();
            var spy = 0;

            core.unit({
                name: 'foo',
                deps: ['bar'],
                maxAge: 10,
                cache: new Cache(0xFFFF),
                main: function () {
                    spy += 1;
                    return spy;
                },
                identify: function () {
                    return 'same-1';
                }
            });

            core.unit({
                name: 'bar',
                maxAge: 10,
                identify: function () {
                    return 'same-2';
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');

                unit.run(getCoresTrack(core), null, function (runtime1) {
                    assert.ok(runtime1.isAccepted());
                    assert.strictEqual(spy, 1);
                    assert.strictEqual(runtime1.valueOf(), spy);
                    unit.run(getCoresTrack(core), null, function (runtime2) {
                        assert.ok(runtime2.isAccepted());
                        assert.strictEqual(spy, 1);
                        assert.strictEqual(runtime2.valueOf(), spy);
                        unit.run(getCoresTrack(core), null, function (runtime3) {
                            assert.ok(runtime3.isAccepted());
                            assert.strictEqual(spy, 1);
                            assert.strictEqual(runtime3.valueOf(), spy);
                            done();
                        });
                    });
                });
            });
        });

        it('Should update result if dependency was updated', function (done) {
            var core = getSilentCore();
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

                unit.run(getCoresTrack(core), null, function (runtime1) {
                    assert.ok(runtime1.isAccepted());
                    assert.strictEqual(spy, 1);
                    assert.strictEqual(runtime1.valueOf(), spy);

                    unit.run(getCoresTrack(core), null, function (runtime2) {
                        assert.ok(runtime2.isAccepted());
                        assert.strictEqual(spy, 2);
                        assert.strictEqual(runtime2.valueOf(), spy);

                        unit.run(getCoresTrack(core), null, function (runtime3) {
                            assert.ok(runtime3.isAccepted());
                            assert.strictEqual(spy, 3);
                            assert.strictEqual(runtime3.valueOf(), spy);

                            done();
                        });
                    });
                });
            });
        });

        it('Should update result if cache fetch failed', function (done) {
            var core = getSilentCore();
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

                unit.run(getCoresTrack(core), null, function (runtime1) {
                    assert.ok(runtime1.isAccepted());
                    assert.strictEqual(spy, 1);
                    assert.strictEqual(runtime1.valueOf(), spy);
                    unit.run(getCoresTrack(core), null, function (runtime2) {
                        assert.ok(runtime2.isAccepted());
                        assert.strictEqual(spy, 2);
                        assert.strictEqual(runtime2.valueOf(), spy);
                        unit.run(getCoresTrack(core), null, function (runtime3) {
                            assert.ok(runtime3.isAccepted());
                            assert.strictEqual(spy, 3);
                            assert.strictEqual(runtime3.valueOf(), spy);
                            done();
                        });
                    });
                });
            });
        });

        it('Should ignore cache setting fails', function (done) {
            var core = getSilentCore();
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

                unit.run(getCoresTrack(core), null, function (runtime1) {
                    assert.ok(runtime1.isAccepted());
                    assert.strictEqual(spy, 1);
                    assert.strictEqual(runtime1.valueOf(), spy);
                    unit.run(getCoresTrack(core), null, function (runtime2) {
                        assert.ok(runtime2.isAccepted());
                        assert.strictEqual(spy, 2);
                        assert.strictEqual(runtime2.valueOf(), spy);
                        unit.run(getCoresTrack(core), null, function (runtime3) {
                            assert.ok(runtime3.isAccepted());
                            assert.strictEqual(spy, 3);
                            assert.strictEqual(runtime3.valueOf(), spy);
                            done();
                        });
                    });
                });
            });
        });

        it('Should not set cache if maxAge <= 0', function (done) {
            var core = getSilentCore();
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

                unit.run(getCoresTrack(core), null, function () {
                    setTimeout(function () {
                        assert.strictEqual(spy, 0);
                        done();
                    }, 50);
                });
            });
        });

        it('Should cache result if deps are actual', function (done) {
            var core = getSilentCore();

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

                unit.run(getCoresTrack(core), null, function (runtime1) {
                    assert.ok(runtime1.isAccepted());
                    assert.strictEqual(runtime1.valueOf(), 1);
                    unit.run(getCoresTrack(core), null, function (runtime2) {
                        assert.ok(runtime2.isAccepted());
                        assert.strictEqual(runtime2.valueOf(), 1);
                        unit.run(getCoresTrack(core), null, function (runtime3) {
                            assert.ok(runtime3.isAccepted());
                            assert.strictEqual(runtime3.valueOf(), 1);
                            done();
                        });
                    });
                });
            });
        });

        it('Cache key should consist of application name, unit name, identity and deps identities', function (done) {
            var core = getSilentCore({
                name: 'app-name'
            });
            var cache = new Cache(0xFFFF);
            var spyCache = new Cache(0xFFFF);
            var spy = [];
            var cacheGet = spyCache.get;
            var cacheSet = spyCache.set;

            spyCache.get = function (k) {
                assert.ok(/\bapp-name\b/.test(k));
                assert.ok(/\bbar-id\b/.test(k));
                assert.ok(/\bbaz-id\b/.test(k));
                assert.ok(/\bfoo\b/.test(k));
                spy.push('got');
                return cacheGet.apply(this, arguments);
            };

            spyCache.set = function (k) {
                assert.ok(/\bapp-name\b/.test(k));
                assert.ok(/\bbar-id\b/.test(k));
                assert.ok(/\bbaz-id\b/.test(k));
                assert.ok(/\bfoo\b/.test(k));
                spy.push('set');
                return cacheSet.apply(this, arguments);
            };

            core.unit({
                name: 'base',
                cache: cache
            });

            core.unit({
                base: 'base',
                name: 'bar',
                maxAge: 1,
                main: function () {
                    return 'bar-result';
                },
                identify: function () {
                    return 'bar-id';
                }
            });

            core.unit({
                base: 'base',
                name: 'baz',
                maxAge: 1,
                main: function () {
                    return 'baz-result';
                },
                identify: function () {
                    return 'baz-id';
                }
            });

            core.unit({
                name: 'foo',
                deps: ['bar', 'baz'],
                maxAge: 0.10,
                cache: spyCache,
                main: function () {
                    return 42;
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');
                unit.run(getCoresTrack(core), null, function () {
                    assert.deepEqual(spy, ['set']);
                    unit.run(getCoresTrack(core), null, function () {
                        assert.deepEqual(spy, ['set', 'got']);
                        done();
                    });
                });
            });
        });
    });
});
