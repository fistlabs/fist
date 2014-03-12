'use strict';

var Connect = require('../../track/Connect');
var Server = require('../../Server');
var Fs = require('fs');
var Http = require('http');
var STATUS_CODES = Http.STATUS_CODES;

var http = require('../util/http');
var sock = require('../stuff/conf/sock');
var asker = require('asker');
var server = new Server();

server.decl('index', function () {
    this.send(200, 'INDEX');
});

server.decl('page', function (bundle, done) {
    done(null, this.match.pageName);
});

server.decl('error', function () {
    this.send(500, new Error('O_O'));
});

server.route('GET', '/', 'index');
server.route('GET', '/index/', 'index-2', {
    unit: 'index'
});

server.route('GET', '/error/', 'error');
server.route('GET', '/<pageName>/', 'page');
server.route('POST', '/upload/', 'upload');

module.exports = [

    function (test) {

        var s = new Server();

        s.decl('a', function (bundle, done) {
            done(null, 'a');
        });

        s.decl('b', function () {
            this.send(201, 'b');
            test.strictEqual(this.send, Connect.noop);
        });

        s.decl('c', function (bundle, done) {
            setTimeout(function () {
                done(null, 'c');
            }, 0);
        });

        s.decl('x', ['a', 'b', 'c'], function () {});

        http({method: 'GET'}, function (req, res) {

            var connect = new Connect(s, req, res);

            s.resolve(connect, 'x', function () {
                test.ok(false);
            });
        }, function (err, data) {
            test.strictEqual(data.statusCode, 201);
            test.strictEqual(data.data, 'b');
            test.done();
        });

    },

    function (test) {

        try {
            Fs.unlinkSync(sock);
        } catch (ex) {}

        Http.createServer(server.getHandler()).listen(sock);

        asker({
            method: 'GET',
            path: '/fist.io.server/',
            socketPath: sock
        }, function (err, res) {
            test.deepEqual(res.data, new Buffer('fist.io.server'));
            test.done();
        });
    },

    function (test) {

        try {
            Fs.unlinkSync(sock);
        } catch (ex) {}

        Http.createServer(server.getHandler()).listen(sock);

        asker({
            method: 'HEAD',
            path: '/',
            socketPath: sock
        }, function (err, res) {
            test.deepEqual(res.data, null);
            test.done();
        });
    },

    function (test) {

        try {
            Fs.unlinkSync(sock);
        } catch (ex) {}

        Http.createServer(server.getHandler()).listen(sock);

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
            test.deepEqual(res.data, new Buffer(STATUS_CODES[res.statusCode]));
            test.done();
        });
    },

    function (test) {

        try {
            Fs.unlinkSync(sock);
        } catch (ex) {}

        Http.createServer(server.getHandler()).listen(sock);

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
            test.strictEqual(res.headers.allow, 'GET');
            test.deepEqual(res.data, new Buffer(STATUS_CODES[res.statusCode]));
            test.done();
        });
    },

    function (test) {

        try {
            Fs.unlinkSync(sock);
        } catch (ex) {}

        Http.createServer(server.getHandler()).listen(sock);

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
            test.deepEqual(res.data, new Buffer(STATUS_CODES[res.statusCode]));
            test.done();
        });
    },

    function (test) {

        try {
            Fs.unlinkSync(sock);
        } catch (ex) {}

        Http.createServer(server.getHandler()).listen(sock);

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

        var spy = [];

        try {
            Fs.unlinkSync(sock);
        } catch (ex) {}

        Http.createServer(server.getHandler()).listen(sock);

        server.on('response', function (event) {
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
            test.deepEqual(res.data + '', 'INDEX');
            test.deepEqual(spy, [500]);
            test.done();
        });
    },

    function (test) {

        try {
            Fs.unlinkSync(sock);
        } catch (ex) {}

        Http.createServer(server.getHandler()).listen(sock);

        asker({
            method: 'GET',
            path: '/',
            socketPath: sock
        }, function (err, res) {
            test.deepEqual(res.data + '', 'INDEX');
            test.done();
        });
    },

    function (test) {

        var serv = new Server();

        try {
            Fs.unlinkSync(sock);
        } catch (ex) {}

        serv.on('request', function (track) {
            track.send(201);
        });

        Http.createServer(serv.getHandler()).listen(sock);

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

        var serv = new Server();

        try {
            Fs.unlinkSync(sock);
        } catch (ex) {}

        serv.decl('some', function (bundle, done) {
            done(1);
        });

        serv.route('GET', '/', 'some');

        Http.createServer(serv.getHandler()).listen(sock);

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
            test.deepEqual(res.data + '', '1');
            test.done();
        });
    }

];
