/*global describe, it*/
'use strict';

var Track = require('../track/Track');
var Tracker = require('../Tracker');

var assert = require('chai').assert;
var inherit = require('inherit');

describe('fist/unit/_unit', function () {
    var Unit = require('../unit/_unit');

    it('Should be an instance of fist/unit/_unit', function () {

        var unit = new Unit({
            a: 42
        });

        assert.instanceOf(unit, Unit);

        assert.deepEqual(unit.params, {
            a: 42
        });
    });

    it('Should coerce ._maxAge to not NaN number', function () {

        var Unit0 = inherit(Unit, {

            _maxAge: NaN,

            getMaxAge: function () {

                return this._maxAge;
            }
        });

        var unit = new Unit0();

        assert.isNumber(unit.getMaxAge());
        assert.strictEqual(unit.getMaxAge(), 0);

        var Unit1 = inherit(Unit0, {
            _maxAge: 1
        });

        unit = new Unit1();

        assert.isNumber(unit.getMaxAge());
        assert.strictEqual(unit.getMaxAge(), 1);
    });

    it('Should unique deps', function () {

        var Unit0 = inherit(Unit, {
            deps: [1, 1, 1, 2, 2, 3, 3]
        });

        assert.deepEqual(new Unit0().deps, [1, 2, 3]);
    });

    describe('.addDeps', function () {
        it('Should add unique deps', function () {

            var unit = new Unit();

            unit.addDeps([1, 2, 3]);
            assert.deepEqual(unit.deps, [1, 2, 3]);
            unit.addDeps(1, 2, 3, 4, [5, 6]);
            assert.deepEqual(unit.deps, [1, 2, 3, 4, 5, 6]);
        });
    });

    describe('.delDeps', function () {
        it('Should del deps', function () {

            var unit = new Unit();

            unit.addDeps(1, 2, 3, 4, 5, 6);
            assert.deepEqual(unit.deps, [1, 2, 3, 4, 5, 6]);
            unit.delDeps(1, 2, [3, 4]);
            assert.deepEqual(unit.deps, [5, 6]);
        });
    });

    describe('.data', function () {
        it('Should resolve data if it is not a function', function (done) {
            var tracker = new Tracker();

            tracker.unit({
                path: 'x',
                data: 42
            });

            tracker.resolve(new Track(tracker), 'x').done(function (res) {
                assert.strictEqual(res, 42);
                done();
            });
        });
    });

    describe('test caching', function () {
        var AsyncCache = require('./util/AsyncCache');
        var inherit = require('inherit');

        it('Should not cache result', function (done) {
            var tracker = new Tracker();

            tracker.unit({
                path: 'test',
                spy: [],
                _maxAge: 0,
                data: function () {
                    this.spy.push(1);

                    return this.spy;
                }
            });

            tracker.resolve(new Track(tracker), 'test').then(function (spy) {
                assert.deepEqual(spy, [1]);
            }).always(function () {
                tracker.resolve(new Track(tracker), 'test').
                    done(function (spy) {
                        assert.deepEqual(spy, [1, 1]);
                        done();
                    });
            });
        });

        it('Should cache result', function (done) {
            var tracker = new Tracker();

            tracker.unit({
                path: 'test',
                spy: [],
                _maxAge: 10000,
                data: function () {
                    this.spy.push(1);

                    throw this.spy;
                }
            });

            tracker.resolve(new Track(tracker), 'test').fail(function (spy) {
                assert.deepEqual(spy, [1]);
            }).always(function () {
                tracker.resolve(new Track(tracker), 'test').
                    fail(function (spy) {
                        assert.deepEqual(spy, [1, 1]);
                        done();
                    }).done();
            });
        });

        it('Should not cache coz of error', function (done) {

            var e = [];
            var SlyTracker = inherit(Tracker, {
                _createCache: function (p) {

                    return new (inherit(AsyncCache, {
                        broken: 42
                    }))(p);
                }
            });

            var tracker = new SlyTracker();

            tracker.on('ctx:notify', function (event) {
                e.push(event.data);
            });

            tracker.unit({
                path: 'test',
                spy: [],
                _maxAge: 10000,
                data: function () {
                    this.spy.push(1);

                    return this.spy;
                }
            });

            tracker.resolve(new Track(tracker), 'test').then(function (spy) {
                assert.deepEqual(spy, [1]);
                assert.deepEqual(e, [42, 42]);
            }).always(function () {
                tracker.resolve(new Track(tracker), 'test').
                    then(function (spy) {
                        assert.deepEqual(spy, [1, 1]);
                        assert.deepEqual(e, [42, 42, 42, 42]);

                        done();
                    }).done();
            }).done();
        });

        it('Should not cache result coz unit has resolved ' +
           'the context', function (done) {

            var e = [];
            var spy = [];
            var SlyTracker = inherit(Tracker, {
                _createCache: function (p) {

                    return new (inherit(AsyncCache, {
                        broken: 42
                    }))(p);
                }
            });

            var tracker = new SlyTracker();

            tracker.on('ctx:notify', function (event) {
                e.push(event.data);
            });

            tracker.unit({
                path: 'test',
                spy: [],
                _rsv: false,
                _hasOutsideResolved: function () {
                    return !!this._rsv;
                },
                _maxAge: 10000,
                data: function () {
                    this._rsv = true;
                    spy.push(1);

                    return 123;
                }
            });

            tracker.resolve(new Track(tracker), 'test').then(function (res) {
                assert.deepEqual(spy, [1]);
                assert.deepEqual(e.slice(0), [42]);
                assert.strictEqual(res, 123);
            }).always(function (promise) {
                assert.ok(promise.isFulfilled());
                tracker.resolve(new Track(tracker), 'test').
                    then(function (res) {
                        assert.strictEqual(res, 123);
                        assert.deepEqual(spy, [1, 1]);
                        assert.deepEqual(e.slice(0), [42, 42]);

                        done();
                    }).done();
            }).done();
        });

        it('Should cache result', function (done) {

            var tracker = new Tracker();

            tracker.unit({
                path: 'test',
                spy: [],
                _maxAge: 10000,
                data: function () {
                    this.spy.push(1);

                    return this.spy;
                }
            });

            tracker.resolve(new Track(tracker), 'test').then(function (spy) {
                assert.deepEqual(spy, [1]);
            }).always(function () {
                tracker.resolve(new Track(tracker), 'test').
                    then(function (spy) {
                        assert.deepEqual(spy, [1]);
                        done();
                    }).done();
            }).done();
        });
    });

});
