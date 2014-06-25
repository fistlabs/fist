'use strict';

var Tracker = require('../../Tracker');
var Track = require('../../track/Track');
var Unit = require('../../unit/Unit');

var vow = require('vow');

module.exports = {
    'Tracker.prototype.resolve': [
        function (test) {

            var tracker = new Tracker();
            var track = new Track(tracker);

            tracker.unit({
                path: 'a',
                data: function () {

                    var defer = vow.defer();

                    setTimeout(function () {
                        defer.resolve(42);
                    }, 0);

                    return defer.promise();
                }
            });

            tracker.resolve(track, 'a').done(function (res) {
                test.strictEqual(res, 42);
                test.done();
            });
        },
        function (test) {

            var tracker = new Tracker();
            var track = new Track(tracker);

            tracker.unit({
                path: 'a',
                data: function (track, ctx) {
                    ctx.resolve(42);
                }
            });

            tracker.resolve(track, 'a').done(function (res) {
                test.strictEqual(res, 42);
                test.done();
            });
        },
        function (test) {

            var tracker = new Tracker();
            var track = new Track(tracker);

            tracker.unit({
                path: 'a',
                data: function () {

                    return vow.resolve(42);
                }
            });

            tracker.resolve(track, 'a').done(function (res) {
                test.strictEqual(res, 42);
                test.done();
            });
        },
        function (test) {

            var tracker = new Tracker();
            var track = new Track(tracker);

            tracker.unit({
                path: 'a',
                data: 42
            });

            tracker.resolve(track, 'a').done(function (res) {
                test.strictEqual(res, 42);
                test.done();
            });
        },
        function (test) {

            var tracker = new Tracker();
            var track = new Track(tracker);

            tracker.unit({
                path: 'a',
                data: function () {

                    return 42;
                }
            });

            tracker.resolve(track, 'a').done(function (res) {
                test.strictEqual(res, 42);
                test.done();
            });
        },
        //  REJECTS
        function (test) {

            var tracker = new Tracker();
            var track = new Track(tracker);

            tracker.unit({
                path: 'a',
                data: function () {

                    var defer = vow.defer();

                    setTimeout(function () {
                        defer.reject(42);
                    }, 0);

                    return defer.promise();
                }
            });

            tracker.resolve(track, 'a').fail(function (res) {
                test.strictEqual(res, 42);
                test.done();
            }).done();
        },
        function (test) {

            var tracker = new Tracker();
            var track = new Track(tracker);

            tracker.unit({
                path: 'a',
                data: function () {

                    var defer = vow.defer();

                    setTimeout(function () {
                        defer.resolve(vow.reject(42));
                    }, 0);

                    return defer.promise();
                }
            });

            tracker.resolve(track, 'a').fail(function (res) {
                test.strictEqual(res, 42);
                test.done();
            }).done();
        },
        function (test) {

            var tracker = new Tracker();
            var track = new Track(tracker);

            tracker.unit({
                path: 'a',
                data: function () {

                    var defer = vow.defer();

                    setTimeout(function () {
                        defer.resolve(vow.reject(vow.resolve(42)));
                    }, 0);

                    return defer.promise();
                }
            });

            tracker.resolve(track, 'a').fail(function (res) {
                test.strictEqual(res, 42);
                test.done();
            }).done();
        },
        function (test) {

            var tracker = new Tracker();
            var track = new Track(tracker);

            tracker.unit({
                path: 'a',
                data: vow.reject(42)
            });

            tracker.resolve(track, 'a').fail(function (res) {
                test.strictEqual(res, 42);
                test.done();
            }).done();
        },
        function (test) {

            var tracker = new Tracker();
            var track = new Track(tracker);

            tracker.unit({
                path: 'a',
                data: function () {

                    throw 42;
                }
            });

            tracker.resolve(track, 'a').fail(function (res) {
                test.strictEqual(res, 42);
                test.done();
            }).done();
        },
        function (test) {

            var tracker = new Tracker();
            var track = new Track(tracker);

            tracker.resolve(track, 'a').fail(function (res) {
                test.strictEqual(res, void 0);
                test.done();
            });
        },
        //  DEPS
        function (test) {

            var tracker = new Tracker();
            var track = new Track(tracker);

            tracker.unit({
                path: 'a',
                deps: ['b'],
                data: function (track, ctx) {
                    test.strictEqual(ctx.res.b, 'b');

                    return 'a';
                }
            });

            tracker.unit({
                path: 'b',
                data: 'b'
            });

            tracker.resolve(track, 'a').done(function (res) {
                test.strictEqual(res, 'a');
                test.done();
            });
        },
        function (test) {

            var tracker = new Tracker();
            var track = new Track(tracker);

            tracker.unit({
                path: 'a',
                deps: ['b'],
                data: function (track, ctx) {
                    test.strictEqual(ctx.ers.b, 'b');

                    return 'a';
                }
            });

            tracker.unit({
                path: 'b',
                data: vow.reject('b')
            });

            tracker.resolve(track, 'a').done(function (res) {
                test.strictEqual(res, 'a');
                test.done();
            });
        },
        function (test) {

            var tracker = new Tracker();
            var track = new Track(tracker);
            var spy = [];

            tracker.unit({
                path: 'a',
                deps: ['b', 'c'],
                data: function (track, ctx) {
                    test.strictEqual(ctx.res.b, 'b');
                    test.strictEqual(ctx.ers.c, 'c');

                    return 'a';
                }
            });

            tracker.unit({
                path: 'b',
                deps: 'c',
                data: function (track, ctx) {
                    test.strictEqual(ctx.ers.c, 'c');

                    return 'b';
                }
            });

            tracker.unit({
                path: 'c',
                data: function () {
                    spy.push(1);

                    return vow.reject('c');
                }
            });

            tracker.resolve(track, 'a').done(function (res) {
                test.strictEqual(res, 'a');
                test.deepEqual(spy, [1]);
                test.done();
            });
        },
        //  EVENTS
        function (test) {

            var tracker = new Tracker();
            var track = new Track(tracker);
            var spy = [];

            tracker.on('ctx:pending', function (e) {
                test.strictEqual(e.trackId, track.id);
                spy.push([-1, e.path]);
            });

            tracker.on('ctx:notify', function (e) {
                test.strictEqual(e.trackId, track.id);
                spy.push([2, e.path]);
            });

            tracker.on('ctx:accept', function (e) {
                test.strictEqual(e.trackId, track.id);
                spy.push([0, e.path]);
            });

            tracker.on('ctx:reject', function (e) {
                test.strictEqual(e.trackId, track.id);
                spy.push([1, e.path]);
            });

            tracker.unit({
                path: 'a',
                deps: ['b', 'c'],
                data: function (track, ctx) {
                    ctx.notify('a');

                    return 'a';
                }
            });

            tracker.unit({
                path: 'b',
                deps: ['c'],
                data: function (track, ctx) {
                    ctx.notify('b');

                    throw 'b';
                }
            });

            tracker.unit({
                path: 'c',
                data: function (track, ctx) {
                    ctx.notify('c');

                    return 'c';
                }
            });

            tracker.resolve(track, 'a').done(function (res) {
                test.strictEqual(res, 'a');
                test.deepEqual(spy, [
                    [-1, 'a'],
                    [-1, 'b'],
                    [-1, 'c'],
                    [2, 'c'],
                    [0, 'c'],
                    [2, 'b'],
                    [1, 'b'],
                    [2, 'a'],
                    [0, 'a']
                ]);
                test.done();
            });
        }
    ],
    'Tracker.prototype.plug': [
        function (test) {
            var spy = [];
            var tracker = new Tracker();

            tracker.plug(function (done) {
                setTimeout(function () {
                    spy.push(1);
                    done();
                }, 0);
            });

            tracker.plug(function (done) {
                setTimeout(function () {
                    spy.push(2);
                    done();
                }, 10);
            });

            tracker.ready().done(function () {
                test.deepEqual(spy, [1, 2]);
                test.done();
            });
        },
        function (test) {
            var tracker = new Tracker();

            tracker.plug(function (done) {
                setTimeout(function () {
                    done();
                }, 0);
            });

            tracker.plug(function (done) {
                setTimeout(function () {
                    done('ERR');
                }, 10);
            });

            tracker.ready().fail(function (err) {
                test.strictEqual(err, 'ERR');
                test.done();
            });
        },
        function (test) {
            var tracker = new Tracker();

            tracker.plug(function (done) {
                setTimeout(function () {
                    done();
                }, 0);
            });

            tracker.plug(function () {
                throw 'ERR';
            });

            tracker.ready().fail(function (err) {
                test.strictEqual(err, 'ERR');
                test.done();
            });
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
        }
    ]
};
