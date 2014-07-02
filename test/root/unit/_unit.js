'use strict';

var AsyncCache = require('../../util/AsyncCache');
var Tracker = require('../../../Tracker');
var Track = require('../../../track/Track');
var Unit = require('../../../unit/_unit');
var inherit = require('inherit');

module.exports = {
    Unit: [
        function (test) {

            var unit = new Unit({
                a: 42
            });

            test.deepEqual(unit.params, {
                a: 42
            });

            test.done();
        },
        function (test) {

            var MyUnit = inherit(Unit, {
                deps: [1, 1, 1, 2, 2, 3, 3]
            });

            test.deepEqual(new MyUnit().deps, [1, 2, 3]);

            test.done();
        }
    ],
    'Unit.prototype.addDeps': [
        function (test) {

            var unit = new Unit();

            unit.addDeps([1, 2, 3]);

            test.deepEqual(unit.deps, [1, 2, 3]);

            unit.addDeps(1, 2, 3, 4, [5, 6]);

            test.deepEqual(unit.deps, [1, 2, 3, 4, 5, 6]);

            test.done();
        }
    ],
    'Unit.prototype.delDeps': [
        function (test) {

            var unit = new Unit();

            unit.addDeps(1, 2, 3, 4, 5, 6);

            test.deepEqual(unit.deps, [1, 2, 3, 4, 5, 6]);

            unit.delDeps(1, 2, [3, 4]);

            test.deepEqual(unit.deps, [5, 6]);

            test.done();
        }
    ],
    'Unit\'s caching': [
        function (test) {
            var tracker = new Tracker();

            tracker.unit({
                path: 'test',
                spy: [],
                data: function () {
                    this.spy.push(1);

                    return this.spy;
                },
                _maxAge: 5000
            });

            tracker.resolve(new Track(tracker), 'test').then(function (spy) {
                test.deepEqual(spy, [1]);
            }).always(function () {
                tracker.resolve(new Track(tracker), 'test').
                    done(function (spy) {
                        test.deepEqual(spy, [1]);
                        test.done();
                    });
            });
        },
        function (test) {
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
                test.deepEqual(spy, [1]);
            }).always(function () {
                tracker.resolve(new Track(tracker), 'test').
                    done(function (spy) {
                        test.deepEqual(spy, [1, 1]);
                        test.done();
                    });
            });
        },
        function (test) {
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
                test.deepEqual(spy, [1]);
            }).always(function () {
                tracker.resolve(new Track(tracker), 'test').
                    fail(function (spy) {
                        test.deepEqual(spy, [1, 1]);
                        test.done();
                    }).done();
            });
        },
        function (test) {

            var SlyTracker = inherit(Tracker, {
                _createCache: function (p) {

                    return new AsyncCache(p);
                }
            });

            var tracker = new SlyTracker();

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
                test.deepEqual(spy, [1]);
            }).always(function () {
                tracker.resolve(new Track(tracker), 'test').
                    then(function (spy) {
                        test.deepEqual(spy, [1]);
                        test.done();
                    }).done();
            }).done();
        },
        function (test) {

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
                test.deepEqual(spy, [1]);
                test.deepEqual(e, [42, 42]);
            }).always(function () {
                tracker.resolve(new Track(tracker), 'test').
                    then(function (spy) {
                        test.deepEqual(spy, [1, 1]);
                        test.deepEqual(e, [42, 42, 42, 42]);
                        test.done();
                    }).done();
            }).done();
        },
        function (test) {

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
                _maxAge: 10000,
                data: function (track, ctx) {
                    ctx.resolve(100500);
                    spy.push(1);

                    return 123;
                }
            });

            tracker.resolve(new Track(tracker), 'test').then(function (res) {
                test.deepEqual(spy, [1]);
                test.deepEqual(e.slice(0), [42]);
                test.strictEqual(res, 100500);
            }).always(function () {
                tracker.resolve(new Track(tracker), 'test').
                    then(function (res) {
                        test.strictEqual(res, 100500);
                        test.deepEqual(spy, [1, 1]);
                        test.deepEqual(e.slice(0), [42, 42]);
                        test.done();
                    }).done();
            }).done();
        }
    ]
};
