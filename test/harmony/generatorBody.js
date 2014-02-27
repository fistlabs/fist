'use strict';

var Fist = require('../../Fist');
var Track = require('../../Runtime');
var Promise = require('fist.util.promise/Promise');
var Fs = require('fs');
var asker = require('asker');

module.exports = {

    Fist0: function (test) {

        var fist = new Fist();

        fist.decl('gen', function * (track, errors, result, done) {

            var res;

            test.deepEqual(errors, {});
            test.deepEqual(result, {});
            test.ok('function' === typeof done);
            test.ok(track instanceof Track);

            res = yield 5;

            test.strictEqual(res, 5);

            res = yield Promise.resolve(42);

            test.strictEqual(res, 42);

            res = yield function (done) {
                done(null, 100500);
            };

            test.strictEqual(res, 100500);
//
            res = yield function * () {

                return yield 777;
            };

            test.strictEqual(res, 777);

            res = yield [Promise.resolve(146), function (done) {
                setTimeout(function () {
                    done(null, 99);
                }, 0);
            }];

            test.deepEqual(res, [146, 99]);

            res = yield ({ a: track._req, b: 24 });

            test.deepEqual(res, {
                a: new Buffer('!!!'),
                b: 24
            });

            return 25;
        });

        fist.route('POST', '/', 'gen');

        try {
            Fs.unlinkSync('test/fist.sock');
        } catch (ex) {}

        fist.listen('test/fist.sock');

        asker({
            path: '/',
            method: 'POST',
            body: '!!!',
            socketPath: 'test/fist.sock'
        }, function (err, res) {
            test.strictEqual(res.data + '', '25');
            test.done();
        });
    },

    Fist1: function (test) {

        var fist = new Fist();

        fist.decl('gen', function * () {

            throw yield 25;
        });

        fist.route('POST', '/', 'gen');

        try {
            Fs.unlinkSync('test/fist.sock');
        } catch (ex) {}

        fist.listen('test/fist.sock');

        asker({
            path: '/',
            method: 'POST',
            body: '!!!',
            socketPath: 'test/fist.sock',
            statusFilter: function () {

                return {
                    accept: true
                };
            }

        }, function (err, res) {
            test.strictEqual(res.statusCode, 500);
            test.strictEqual(res.data + '', '25');

            test.done();
        });
    },

    Fist2: function (test) {

        var fist = new Fist();

        fist.decl('gen', function * (track, errors, result, done) {
            done(null, 54);

            return yield 45;
        });

        fist.route('POST', '/', 'gen');

        try {
            Fs.unlinkSync('test/fist.sock');
        } catch (ex) {}

        fist.listen('test/fist.sock');

        asker({
            path: '/',
            method: 'POST',
            body: '!!!',
            socketPath: 'test/fist.sock',
            statusFilter: function () {

                return {
                    accept: true
                };
            }

        }, function (err, res) {
            test.strictEqual(res.statusCode, 200);
            test.strictEqual(res.data + '', '54');

            test.done();
        });
    },

    Fist3: function (test) {

        var fist = new Fist();

        fist.decl('gen', function * (track, errors, result, done) {
            track.send('!');

            return yield 45;
        });

        fist.route('POST', '/', 'gen');

        try {
            Fs.unlinkSync('test/fist.sock');
        } catch (ex) {}

        fist.listen('test/fist.sock');

        asker({
            path: '/',
            method: 'POST',
            socketPath: 'test/fist.sock',
            statusFilter: function () {

                return {
                    accept: true
                };
            }

        }, function (err, res) {
            test.strictEqual(res.statusCode, 200);
            test.strictEqual(res.data + '', '!');

            test.done();
        });
    }

};
