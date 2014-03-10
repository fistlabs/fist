'use strict';

var Fist = require('../../Fist');
var Track = require('../../track/Runtime');
var Vow = require('vow');
var Fs = require('fs');

var asker = require('asker');
var sock = require('../stuff/conf/sock');

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

            res = yield Vow.resolve(42);

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

            res = yield [Vow.resolve(146), function (done) {
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
            Fs.unlinkSync(sock);
        } catch (ex) {}

        fist.listen(sock);

        asker({
            path: '/',
            method: 'POST',
            body: '!!!',
            socketPath: sock
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
            Fs.unlinkSync(sock);
        } catch (ex) {}

        fist.listen(sock);

        asker({
            path: '/',
            method: 'POST',
            body: '!!!',
            socketPath: sock,
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
            Fs.unlinkSync(sock);
        } catch (ex) {}

        fist.listen(sock);

        asker({
            path: '/',
            method: 'POST',
            body: '!!!',
            socketPath: sock,
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

        fist.decl('gen', function * (track) {
            track.send('!');

            return yield 45;
        });

        fist.route('POST', '/', 'gen');

        try {
            Fs.unlinkSync(sock);
        } catch (ex) {}

        fist.listen(sock);

        asker({
            path: '/',
            method: 'POST',
            socketPath: sock,
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
    },

    Fist4: function (test) {

        var fist = new Fist();
        var spy = [];

        fist.decl('a', function * (t, e, r, done) {
            spy.push(yield 1);
            done(null, 'a');
            spy.push(yield 2);
            spy.push(yield 3);
        });

        fist.decl('b', ['a'], function * (t, e, r, done) {
            test.deepEqual(spy, [1]);
            test.strictEqual(r.a, 'a');
            spy.push(4);
            done(null, 'b');
        });

        fist.route('GET', '/', 'b');

        try {
            Fs.unlinkSync(sock);
        } catch (ex) {}

        fist.listen(sock);

        asker({
            path: '/',
            method: 'GET',
            socketPath: sock
        }, function (err, res) {
            test.deepEqual(spy, [1,4,2,3]);
            test.strictEqual(res.data + '', 'b');

            test.done();
        });
    }

};
