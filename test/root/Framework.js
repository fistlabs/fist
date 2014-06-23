'use strict';

var Framework = require('../../Framework');

var asker = require('asker');
var sock = require('../stuff/sock');

var Router = require('finger/Router');
var Fs = require('fs');

module.exports = {
    Framework: [
        function (test) {
            var framework = new Framework();
            test.deepEqual(framework.renderers, {});
            test.ok(framework.router instanceof Router);
            test.done();
        }
    ],
    'Framework.prototype.route': [
        function (test) {
            var framework = new Framework();
            framework.route('/', 'index');
            test.deepEqual(framework.router.getRoute('index').data, {
                name: 'index',
                unit: 'index'
            });
            framework.route('/', {
                name: 'index'
            });
            test.deepEqual(framework.router.getRoute('index').data, {
                name: 'index',
                unit: 'index'
            });
            framework.route('/', {
                name: 'index',
                unit: null
            });
            test.deepEqual(framework.router.getRoute('index').data, {
                name: 'index',
                unit: 'index'
            });
            framework.route('/', {
                name: 'index',
                unit: 'unit'
            });
            test.deepEqual(framework.router.getRoute('index').data, {
                name: 'index',
                unit: 'unit'
            });
            test.done();
        }
    ],
    'Framework.prototype.plug': [
        function (test) {
            var spy = [];
            var framework = new Framework();

            framework.plug(function (done) {
                setTimeout(function () {
                    spy.push(1);
                    done();
                }, 0);
            });

            framework.plug(function (done) {
                setTimeout(function () {
                    spy.push(2);
                    done();
                }, 10);
            });

            framework.ready().done(function () {
                test.deepEqual(spy, [1, 2]);
                test.done();
            });
        },
        function (test) {
            var framework = new Framework();

            framework.plug(function (done) {
                setTimeout(function () {
                    done();
                }, 0);
            });

            framework.plug(function (done) {
                setTimeout(function () {
                    done('ERR');
                }, 10);
            });

            framework.ready().fail(function (err) {
                test.strictEqual(err, 'ERR');
                test.done();
            });
        }
    ],
    'Framework.prototype._handle': [
        function (test) {
            var framework = new Framework();

            framework.on('sys:request', function (track) {
                track.send(201);
            });

            try {
                Fs.unlinkSync(sock);
            } catch (err) {}

            framework.listen(sock);

            asker({
                path: '/',
                socketPath: sock
            }, function (err, res) {
                test.ok(!err);
                test.strictEqual(res.statusCode, 201);
                test.done();
            });
        },
        function (test) {
            var framework = new Framework();

            framework.plug(function (done) {
                setTimeout(function () {
                    done();
                }, 100);
            });

            framework.route('/', 'index');

            framework.unit({
                path: 'index',
                data: function (track) {
                    track.send(201);
                }
            });

            try {
                Fs.unlinkSync(sock);
            } catch (err) {}

            framework.listen(sock);

            asker({
                path: '/',
                socketPath: sock
            }, function (err, res) {
                test.ok(!err);
                test.strictEqual(res.statusCode, 201);
                test.done();
            });
        },
        function (test) {
            var framework = new Framework();

            framework.route('/', 'index');

            framework.unit({
                path: 'index',
                data: function (track) {
                    track.send(201);
                }
            });

            try {
                Fs.unlinkSync(sock);
            } catch (err) {}

            framework.listen(sock);

            asker({
                path: '/',
                socketPath: sock
            }, function (err, res) {
                test.ok(!err);
                test.strictEqual(res.statusCode, 201);
                test.done();
            });
        },
        function (test) {
            var framework = new Framework();

            framework.plug(function (done) {
                done('ERR');
            });

            framework.route('/', 'index');

            framework.unit({
                path: 'index',
                data: function (track) {
                    track.send(201);
                }
            });

            try {
                Fs.unlinkSync(sock);
            } catch (err) {}

            framework.listen(sock);

            asker({
                path: '/',
                socketPath: sock,
                statusFilter: function () {

                    return {
                        accept: true
                    };
                }
            }, function (err, res) {
                test.ok(!err);
                test.strictEqual(res.statusCode, 500);
                test.deepEqual(res.data, new Buffer('ERR'));
                test.done();
            });
        },
        function (test) {
            var spy = [];
            var framework = new Framework();

            framework.route('/foo/');

            framework.on('sys:ematch', function () {
                spy.push(1);
            });

            try {
                Fs.unlinkSync(sock);
            } catch (err) {}

            framework.listen(sock);

            asker({
                path: '/',
                socketPath: sock,
                statusFilter: function () {

                    return {
                        accept: true
                    };
                }
            }, function (err, res) {
                test.ok(!err);
                test.strictEqual(res.statusCode, 404);
                test.deepEqual(spy, [1]);
                test.done();
            });
        },
        function (test) {
            var spy = [];
            var framework = new Framework();

            framework.on('sys:ematch', function () {
                spy.push(1);
            });

            try {
                Fs.unlinkSync(sock);
            } catch (err) {}

            framework.listen(sock);

            asker({
                path: '/',
                socketPath: sock,
                statusFilter: function () {

                    return {
                        accept: true
                    };
                }
            }, function (err, res) {
                test.ok(!err);
                test.strictEqual(res.statusCode, 501);
                test.deepEqual(spy, [1]);
                test.done();
            });
        },
        function (test) {
            var spy = [];
            var framework = new Framework();

            framework.route('GET /foo/', 'foo');
            framework.route('POST /', 'upload');

            framework.on('sys:ematch', function () {
                spy.push(1);
            });

            try {
                Fs.unlinkSync(sock);
            } catch (err) {}

            framework.listen(sock);

            asker({
                path: '/',
                socketPath: sock,
                statusFilter: function () {

                    return {
                        accept: true
                    };
                }
            }, function (err, res) {
                test.ok(!err);
                test.strictEqual(res.statusCode, 405);
                test.strictEqual(res.headers.allow, 'POST');
                test.deepEqual(spy, [1]);
                test.done();
            });
        },
        function (test) {
            var framework = new Framework();

            framework.route('GET /', 'foo');

            try {
                Fs.unlinkSync(sock);
            } catch (err) {}

            framework.listen(sock);

            asker({
                path: '/',
                socketPath: sock,
                statusFilter: function () {

                    return {
                        accept: true
                    };
                }
            }, function (err, res) {
                test.ok(!err);
                test.strictEqual(res.statusCode, 500);
                test.done();
            });
        }
    ]
};
