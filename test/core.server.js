/*global describe, it*/
'use strict';

var Fs = require('fs');
var Router = require('finger/Router');

var vowAsker = require('vow-asker');
var assert = require('chai').assert;
var sock = require('./util/sock');

describe('core/server', function () {

    var Server = require('../core/server');

    it('Should be an instance of core/server', function () {
        var server = new Server();
        assert.deepEqual(server.renderers, {});
        assert.instanceOf(server.router, Router);
    });

    describe('.route', function () {
        var server = new Server();

        server.route('/', 'index');

        assert.deepEqual(server.router.getRoute('index').data, {
            name: 'index',
            unit: 'index'
        });

        server.route('/', {
            name: 'index'
        });

        assert.deepEqual(server.router.getRoute('index').data, {
            name: 'index',
            unit: 'index'
        });

        server.route('/', {
            name: 'index',
            unit: null
        });

        assert.deepEqual(server.router.getRoute('index').data, {
            name: 'index',
            unit: 'index'
        });

        server.route('/', {
            name: 'index',
            unit: 'unit'
        });

        assert.deepEqual(server.router.getRoute('index').data, {
            name: 'index',
            unit: 'unit'
        });
    });

    it('Should respond after matching', function (done) {
        var server = new Server();
        var origServer;

        server.route('/', 'index');

        server.unit({
            path: 'index',
            data: function (track, context) {

                return context.track.send(201);
            }
        });

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        origServer = server.listen(sock);

        vowAsker({
            path: '/',
            socketPath: sock
        }).done(function (res) {
            assert.strictEqual(res.statusCode, 201);
            origServer.close();
            done();
        });
    });

    it('Should respond 500 if init failed', function (done) {

        var server = new Server();
        var origServer;

        server.plug(function () {

            throw 'ERR';
        });

        server.route('/', 'index');

        server.unit({
            path: 'index',
            data: function (track, context) {

                return context.track.send(201);
            }
        });

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        origServer = server.listen(sock);

        vowAsker({
            path: '/',
            socketPath: sock,
            statusFilter: function () {

                return {
                    accept: true
                };
            }
        }).done(function (res) {
            assert.strictEqual(res.statusCode, 500);
            assert.deepEqual(res.data, new Buffer('ERR'));
            origServer.close();
            done();
        });
    });

    it('Should respond 404 if match failed', function (done) {
        var spy = [];
        var server = new Server();
        var origServer;

        server.route('/foo/');

        server.channel('sys').on('ematch', function () {
            spy.push(1);
        });

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        origServer = server.listen(sock);

        vowAsker({
            path: '/',
            socketPath: sock,
            statusFilter: function () {

                return {
                    accept: true
                };
            }
        }).done(function (res) {
            assert.strictEqual(res.statusCode, 404);
            assert.deepEqual(spy, [1]);
            origServer.close();
            done();
        });
    });

    it('Should return 501 if method handler not implemented', function (done) {

        var spy = [];
        var server = new Server();
        var origServer;

        server.channel('sys').on('ematch', function () {
            spy.push(1);
        });

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        origServer = server.listen(sock);

        vowAsker({
            path: '/',
            socketPath: sock,
            statusFilter: function () {

                return {
                    accept: true
                };
            }
        }).done(function (res) {
            assert.strictEqual(res.statusCode, 501);
            assert.deepEqual(spy, [1]);
            origServer.close();
            done();
        });
    });

    it('Should return 405 if request method is not implemented for matched ' +
        'resource', function (done) {

        var spy = [];
        var server = new Server();
        var origServer;

        server.route('GET /foo/', 'foo');
        server.route('POST /', 'upload');

        server.channel('sys').on('ematch', function () {
            spy.push(1);
        });

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        origServer = server.listen(sock);

        vowAsker({
            path: '/',
            socketPath: sock,
            statusFilter: function () {

                return {
                    accept: true
                };
            }
        }).done(function (res) {
            assert.strictEqual(res.statusCode, 405);
            assert.strictEqual(res.headers.allow, 'POST');
            assert.deepEqual(spy, [1]);
            origServer.close();
            done();
        });
    });

    it('Should continue routing if controller has not sent', function (done) {

        var server = new Server();
        var origServer;

        server.route('/', 'preset');
        server.route('/', 'index');

        server.unit({
            path: 'preset',
            data: function (track, context) {
                context.track.url.query.role = 'admin';
            }
        });

        server.unit({
            path: 'index',
            data: function (track, context) {
                assert.deepEqual(context.track.url.query, {
                    role: 'admin'
                });

                return context.track.send(201);
            }
        });

        try {
            Fs.unlinkSync(sock);

        } catch (err) {}

        origServer = server.listen(sock);

        vowAsker({
            path: '/',
            socketPath: sock
        }).done(function (res) {
            assert.strictEqual(res.statusCode, 201);
            origServer.close();
            done();
        });
    });

    describe('rewrite', function () {
        it('Should rewrite the url', function (done) {

            var server = new Server();
            var origServer;

            server.route('/x/y/z/', 'rewrite');
            server.route('/<page>/', 'control');

            server.unit({
                path: 'rewrite',
                data: function (track, context) {

                    return context.track.rewrite('/<page>/', {
                        page: 'test',
                        a: 42
                    });
                }
            });

            server.unit({
                path: 'control',
                data: function (track, context) {
                    assert.strictEqual(context.arg('page'), 'test');
                    assert.strictEqual(context.track.url.path, '/test/?a=42');

                    return context.track.send(201);
                }
            });

            try {
                Fs.unlinkSync(sock);

            } catch (err) {}

            origServer = server.listen(sock);

            vowAsker({
                path: '/x/y/z/',
                socketPath: sock
            }).done(function (res) {
                assert.strictEqual(res.statusCode, 201);
                origServer.close();
                done();
            });
        });
    });

});
