'use strict';

var Framework = require('../../Framework');
var Fs = require('fs');
var vow = require('vow');

var asker = require('asker');
var sock = require('../stuff/sock');

var Connect = require('../../track/Connect');
var STATUS_CODES = require('http').STATUS_CODES;
var http = require('../util/http');

module.exports = [
    function (test) {

        var framework = new Framework();

        var d = new Date();

        framework.plug(function (done) {
            setTimeout(function () {
                done();
            }, 100);
        });

        framework.unit({
            path: 'index',
            data: function fn (track) {
                test.strictEqual(this.data, fn);

                track.send({});
            }
        });

        framework.route('GET /', 'index');

        try {
            Fs.unlinkSync(sock);
        } catch (ex) {}

        framework.listen(sock);

        asker({
            method: 'GET',
            path: '/',
            socketPath: sock
        }, function (err, res) {
            test.ok(d.getTime() <= Date.now());
            test.deepEqual(res.data, new Buffer('{}'));
            test.done();
        });

    },
    function (test) {

        var framework = new Framework();

        framework.unit({path: 'index', data: 42});
        framework.route('GET /', 'index');

        try {
            Fs.unlinkSync(sock);
        } catch (ex) {}

        framework.plug(function (done) {
            done(42);
        });

        framework.listen(sock);

        asker({
            method: 'GET',
            path: '/',
            socketPath: sock,
            statusFilter: function () {

                return {
                    accept: true
                };
            }
        }, function (err, res) {
            test.strictEqual(res.statusCode, 502);
            test.done();
        });
    },
    function (test) {

        var server = new Framework();

        try {
            Fs.unlinkSync(sock);
        } catch (ex) {}

        server.route('GET /<pageName>/', 'page');

        server.on('sys:match', function (track) {
            test.strictEqual(track.route, 'page');

            test.deepEqual(track.match, {
                pageName: 'server'
            });
        });

        server.unit({
            path: 'page',
            data: function (track) {

                track.send(track.match.pageName);
            }
        });

        server.listen(sock);

        asker({
            method: 'GET',
            path: '/server/',
            socketPath: sock
        }, function (err, res) {
            test.deepEqual(res.data, new Buffer('server'));
            test.done();
        });
    },
    function (test) {

        var server = new Framework();

        server.route('GET /', 'index');
        server.unit({
            path: 'index',
            data: function (track) {
                track.send(200, 'INDEX');
            }
        });

        try {
            Fs.unlinkSync(sock);
        } catch (ex) {}

        server.listen(sock);

        asker({
            method: 'HEAD',
            path: '/',
            socketPath: sock
        }, function (err, res) {
            test.strictEqual(res.statusCode, 200);
            test.deepEqual(res.data, null);
            test.done();
        });
    },
    function (test) {

        var server = new Framework();

        server.route('GET /', 'myRoute');

        try {
            Fs.unlinkSync(sock);
        } catch (ex) {}

        server.listen(sock);

        asker({
            method: 'GET',
            path: '/asd/asd/',
            socketPath: sock,
            statusFilter: function () {
                return {
                    accept: true,
                    isRetryAllowed: false
                };
            }
        }, function (err, res) {
            test.strictEqual(res.statusCode, 404);
            test.deepEqual(res.data,
                new Buffer(STATUS_CODES[res.statusCode]));
            test.done();
        });
    },
    function (test) {

        var server = new Framework();

        server.route('GET /', 'index');
        server.route('POST /upload/', 'upload');

        try {
            Fs.unlinkSync(sock);
        } catch (ex) {}

        server.listen(sock);

        asker({
            method: 'POST',
            path: '/',
            socketPath: sock,
            statusFilter: function () {
                return {
                    accept: true,
                    isRetryAllowed: false
                };
            }
        }, function (err, res) {
            test.strictEqual(res.statusCode, 405);
            test.strictEqual(res.headers.allow, 'GET, HEAD');
            test.deepEqual(res.data,
                new Buffer(STATUS_CODES[res.statusCode]));
            test.done();
        });
    },
    function (test) {

        var server = new Framework();

        try {
            Fs.unlinkSync(sock);
        } catch (ex) {}

        server.listen(sock);

        asker({
            method: 'PUT',
            path: '/',
            socketPath: sock,
            statusFilter: function () {
                return {
                    accept: true,
                    isRetryAllowed: false
                };
            }
        }, function (err, res) {
            test.strictEqual(res.statusCode, 501);
            test.deepEqual(res.data,
                new Buffer(STATUS_CODES[res.statusCode]));
            test.done();
        });
    },
    function (test) {

        var server = new Framework();

        server.unit({
            path: 'error',
            data: function (track) {
                track.send(500, new Error('O_O'));
            }
        });

        server.route('GET /error/', 'error');

        try {
            Fs.unlinkSync(sock);
        } catch (ex) {}

        server.listen(sock);

        asker({
            method: 'GET',
            path: '/error/',
            socketPath: sock,
            statusFilter: function () {
                return {
                    accept: true,
                    isRetryAllowed: false
                };
            }
        }, function (err, res) {
            test.strictEqual(res.statusCode, 500);
            test.ok(res.data + '' !== STATUS_CODES[res.statusCode]);
            test.done();
        });
    },
    function (test) {

        var server = new Framework();
        var spy = [];

        server.route('GET /index/', 'index');
        server.unit({
            path: 'index',
            data: function (track) {
                track.send('INDEX');
            }
        });

        try {
            Fs.unlinkSync(sock);
        } catch (ex) {}

        server.listen(sock);

        server.on('sys:response', function (event) {
            event.status(500);
            test.strictEqual(typeof event.time, 'number');
            test.ok(isFinite(event.time));
            spy.push(event.status());
        });

        asker({
            method: 'GET',
            path: '/index/',
            socketPath: sock
        }, function (err, res) {
            test.deepEqual(res.data, new Buffer('INDEX'));
            test.deepEqual(spy, [500]);
            test.done();
        });
    },
    function (test) {

        var server = new Framework();

        server.route('GET /', {
            name: 'index-page',
            unit: 'index'
        });

        server.unit({
            path: 'index',
            data: function (track) {
                track.send('INDEX');
            }
        });

        try {
            Fs.unlinkSync(sock);
        } catch (ex) {}

        server.listen(sock);

        asker({
            method: 'GET',
            path: '/',
            socketPath: sock
        }, function (err, res) {
            test.deepEqual(res.data, new Buffer('INDEX'));
            test.done();
        });
    },
    function (test) {

        var server = new Framework();

        try {
            Fs.unlinkSync(sock);
        } catch (ex) {}

        server.on('sys:request', function (connect) {
            connect.send(201);
        });

        server.listen(sock);

        asker({
            method: 'GET',
            path: '/',
            socketPath: sock
        }, function (err, res) {
            test.deepEqual(res.statusCode, 201);
            test.done();
        });
    },
    function (test) {

        var server = new Framework();

        try {
            Fs.unlinkSync(sock);
        } catch (ex) {}

        server.unit({
            path: 'some',
            data: function () {

                throw 1;
            }
        });

        server.route('GET /', 'some');

        server.listen(sock);

        asker({
            method: 'GET',
            path: '/',
            socketPath: sock,
            statusFilter: function () {
                return {
                    accept: true
                };
            }
        }, function (err, res) {
            test.deepEqual(res.statusCode, 500);
            test.deepEqual(res.data, new Buffer('1'));
            test.done();
        });
    },
    function (test) {

        var server = new Framework();

        var spy = [];

        try {
            Fs.unlinkSync(sock);
        } catch (ex) {}

        server.unit({
            path: 'bunker',
            data: function () {
                spy.push(1);

                return 'BUNKER';
            }
        });

        server.unit({
            path: 'dps',
            data: function () {
                spy.push(2);

                return 'DPS';
            }
        });

        server.unit({
            path: 'local',
            data: function () {
                spy.push(3);

                return 'LOCAL';
            }
        });

        server.route('/', 'bunker');
        server.route('/', 'dps');
        server.route('/', 'local');

        server.listen(sock);

        asker({
            path: '/',
            socketPath: sock,
            statusFilter: function () {

                return {
                    accept: true
                };
            }
        }, function (err, res) {
            test.deepEqual(res.statusCode, 404);
            test.deepEqual(spy, [1, 2, 3]);
            test.done();
        });
    },
    function (test) {

        var server = new Framework();

        var spy = [];

        try {
            Fs.unlinkSync(sock);
        } catch (ex) {}

        server.unit({
            path: 'index',
            deps: ['controller'],
            data: function (track) {
                spy.push(1);
                track.send('index');
            }
        });

        server.unit({
            path: 'controller',
            data: function (track) {
                spy.push(2);
                track.send('controller');
            }
        });

        server.route('/', 'index');

        server.listen(sock);

        asker({
            path: '/',
            socketPath: sock
        }, function (err, res) {
            setTimeout(function () {
                test.deepEqual(res.statusCode, 200);
                test.deepEqual(spy, [2]);
                test.deepEqual(res.data, new Buffer('controller'));
                test.done();
            }, 100);
        });
    }
];
