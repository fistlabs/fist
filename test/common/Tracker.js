'use strict';

var Tracker = require('../../Tracker');
var Nested = require('../../bundle/Nested');
var Track = require('../../track/Track');

module.exports = {

    'Tracker.prototype.resolve': [
        function (test) {

            var tracker = new Tracker();
            var track = new Track(tracker);

            tracker.decl('_', function (track, errors, result, done) {
                test.strictEqual('function', typeof done);
                test.strictEqual('function', typeof done.accept);
                test.strictEqual('function', typeof done.reject);
                test.strictEqual('function', typeof done.notify);
                done(null, 'a');
            });

            tracker.decl('a_Ok', function (track, errors, result, done) {
                test.strictEqual('function', typeof done);
                test.strictEqual('function', typeof done.accept);
                test.strictEqual('function', typeof done.reject);
                test.strictEqual('function', typeof done.notify);
                track.invoke('_', done);
            });

            tracker.decl('b_Ok', [
                'a_Ok'], function (track, errors, result, done) {

                test.strictEqual('function', typeof done);
                test.strictEqual('function', typeof done.accept);
                test.strictEqual('function', typeof done.reject);
                test.strictEqual('function', typeof done.notify);

                test.deepEqual(result, {
                    a_Ok: 'a'
                });

                done(null, {
                    value: 'b'
                });
            });

            tracker.decl('c_Er', [
                'a_Ok', 'b_Ok'], function (track, errors, result, done) {
                test.strictEqual('function', typeof done);
                test.strictEqual('function', typeof done.accept);
                test.strictEqual('function', typeof done.reject);
                test.strictEqual('function', typeof done.notify);
                test.deepEqual(result, {
                    a_Ok: 'a',
                    b_Ok: {
                        value: 'b'
                    }
                });
                done.reject('c');
            });

            tracker.decl('b_Ok.ns', function (track, errors, result, done) {
                test.strictEqual('function', typeof done);
                test.strictEqual('function', typeof done.accept);
                test.strictEqual('function', typeof done.reject);
                test.strictEqual('function', typeof done.notify);

                done(null, {
                    a: 42,
                    b: 54
                });
            });

            tracker.decl('d_Ok', ['b_Ok.ns', 'b_Ok',
                'c_Er', 'z_Er'], function (track, errors, result, done) {

                test.strictEqual('function', typeof done);
                test.strictEqual('function', typeof done.accept);
                test.strictEqual('function', typeof done.reject);
                test.strictEqual('function', typeof done.notify);
                test.deepEqual(result, {
                    b_Ok: {
                        value: 'b'
                    },
                    'b_Ok.ns': {
                        a: 42,
                        b: 54
                    }
                });
                test.deepEqual(errors, {
                    c_Er: 'c',
                    z_Er: void 0
                });

                done.accept('d');
            });

            tracker.resolve(track, 'd_Ok', function (err, res) {
                test.ok(this instanceof Tracker);
                test.strictEqual(this, tracker);
                test.strictEqual(err, null);
                test.strictEqual(res, 'd');
                test.done();
            });
        },

        function (test) {

            var tracker = new Tracker();
            var track = new Track(tracker);

            var spy = [];

            tracker.on('sys:accept', function (data) {

                test.strictEqual(typeof data.path, 'string');
                test.strictEqual(typeof data.data, 'string');
                test.strictEqual(typeof data.time, 'number');

                spy.push(data.path);
            });

            tracker.on('sys:reject', function (data) {

                test.strictEqual(typeof data.path, 'string');
                test.strictEqual(typeof data.data, 'string');
                test.strictEqual(typeof data.time, 'number');

                spy.push(data.path);
            });

            tracker.on('sys:notify', function (data) {

                test.strictEqual(typeof data.path, 'string');
                test.strictEqual(typeof data.data, 'string');
                test.strictEqual(data.data, 'some happens!');
                test.strictEqual(typeof data.time, 'number');

                spy.push(data.path);
            });

            tracker.decl('a', function (track, errors, result, done) {
                done.accept('a');
            });

            tracker.decl('b', function (track, errors, result, done) {
                done.reject('b');
            });

            tracker.decl('c', [
                'a', 'b'], function (track, errors, result, done) {
                done.notify('some happens!');
                done.accept('c');
            });

            tracker.resolve(track, 'c', function (err, res) {
                test.strictEqual(res, 'c');
                test.deepEqual(spy, ['a', 'b', 'c', 'c']);
                test.done();
            });

        },

        function (test) {

            var T = Tracker.extend({
                _createBundle: function () {
                    return new Nested();
                }
            });

            var tracker = new T();
            var track = new Track(tracker);

            tracker.decl('meta\\.version',
                function (track, errors, result, done) {
                    test.strictEqual('function', typeof done);
                    test.strictEqual('function', typeof done.accept);
                    test.strictEqual('function', typeof done.reject);
                    test.strictEqual('function', typeof done.notify);

                    done(null, 42);
                });

            tracker.decl('assert', [
                'meta\\.version'], function (track, errors, result, done) {

                test.strictEqual('function', typeof done);
                test.strictEqual('function', typeof done.accept);
                test.strictEqual('function', typeof done.reject);
                test.strictEqual('function', typeof done.notify);

                test.strictEqual(result['meta.version'], 42);
                done(null, 'OK');
            });

            tracker.resolve(track, 'assert', function () {
                test.done();
            });
        },

        function (test) {

            var tracker = new Tracker();

            tracker.decl('a', ['c'], function (track, errors, result, done) {

                test.strictEqual('function', typeof done);
                test.strictEqual('function', typeof done.accept);
                test.strictEqual('function', typeof done.reject);
                test.strictEqual('function', typeof done.notify);

                done(null, null);
            });

            tracker.decl('b', ['a'], function (track, errors, result, done) {

                test.strictEqual('function', typeof done);
                test.strictEqual('function', typeof done.accept);
                test.strictEqual('function', typeof done.reject);
                test.strictEqual('function', typeof done.notify);

                done(null, null);
            });

            try {
                tracker.decl('c', [
                    'a', 'b'], function (track, errors, result, done) {

                    test.strictEqual('function', typeof done);
                    test.strictEqual('function', typeof done.accept);
                    test.strictEqual('function', typeof done.reject);
                    test.strictEqual('function', typeof done.notify);

                    done(null, null);
                });
            } catch (err) {
                test.ok(err instanceof ReferenceError);
                test.done();
            }
        },

        function (test) {

            var tracker = new Tracker();

            tracker.decl('a', ['c'], function (track, errors, result, done) {

                test.strictEqual('function', typeof done);
                test.strictEqual('function', typeof done.accept);
                test.strictEqual('function', typeof done.reject);
                test.strictEqual('function', typeof done.notify);

                done(null, null);
            });

            tracker.decl('b', ['a'], function (track, errors, result, done) {

                test.strictEqual('function', typeof done);
                test.strictEqual('function', typeof done.accept);
                test.strictEqual('function', typeof done.reject);
                test.strictEqual('function', typeof done.notify);

                done(null, null);
            });

            try {
                tracker.decl('c', [
                    'x', 'b'], function (track, errors, result, done) {

                    test.strictEqual('function', typeof done);
                    test.strictEqual('function', typeof done.accept);
                    test.strictEqual('function', typeof done.reject);
                    test.strictEqual('function', typeof done.notify);

                    done(null, null);
                });
            } catch (err) {
                test.ok(err instanceof ReferenceError);
                test.done();
            }
        },

        function (test) {

            var tracker = new Tracker();
            var track = new Track(tracker);

            tracker.decl('a', function (track, errors, result, done) {

                test.strictEqual('function', typeof done);
                test.strictEqual('function', typeof done.accept);
                test.strictEqual('function', typeof done.reject);
                test.strictEqual('function', typeof done.notify);

                done.accept('a');
            });

            tracker.decl('b', function (track, errors, result, done) {

                test.strictEqual('function', typeof done);
                test.strictEqual('function', typeof done.accept);
                test.strictEqual('function', typeof done.reject);
                test.strictEqual('function', typeof done.notify);

                done.reject('b');
            });

            tracker.decl('c', ['a'], function (track, errors, result, done) {

                test.strictEqual('function', typeof done);
                test.strictEqual('function', typeof done.accept);
                test.strictEqual('function', typeof done.reject);
                test.strictEqual('function', typeof done.notify);

                done.notify('some happens!');

                track.invoke('b', function () {
                    done.apply(this, arguments);
                });
            });

            tracker.resolve(track, 'c', function (err) {
                test.strictEqual(err, 'b');
                test.done();
            });
        }
    ]

};
