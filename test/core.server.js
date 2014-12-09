/*eslint max-nested-callbacks: 0*/
/*global describe, it*/
'use strict';

var Router = require('finger/core/router');
var assert = require('assert');
var supertest = require('supertest');

describe('core/server', function () {
    var Server = require('../core/server');

    describe('new Server()', function () {
        it('Should be an instance of Server', function () {
            var server = new Server();
            assert.ok(server instanceof Server);
        });

        it('Should have a router', function () {
            var server = new Server();
            assert.ok(server.router instanceof Router);
        });

        it('Should accept params.router', function () {
            var server = new Server({
                router: {
                    foo: 'bar'
                }
            });
            assert.strictEqual(server.router.params.foo, 'bar');
        });
    });

    describe('server.route', function () {
        it('Should take ruleData from second argument', function () {
            var server = new Server();
            server.route('/', {
                name: 'foo',
                unit: 'bar'
            });
            assert.ok(server.router.getRule('foo'));
            assert.strictEqual(server.router.getRule('foo').data.name, 'foo');
            assert.strictEqual(server.router.getRule('foo').data.unit, 'bar');
        });

        it('Should set unit as name by default', function () {
            var server = new Server();
            server.route('/', {name: 'foo'});
            assert.strictEqual(server.router.getRule('foo').data.unit, 'foo');
        });

        it('Should allow use second argument as rule name', function () {
            var server = new Server();
            server.route('/', 'foo');
            assert.ok(server.router.getRule('foo'));
        });
    });

    describe('server.getHandler()', function () {
        it('Should handle request and return 501', function (done) {
            var server = new Server();
            supertest(server.getHandler()).
                get('/').
                expect(501).
                end(done);
        });

        it('Should handler request and return 404', function (done) {
            var server = new Server();
            server.route('GET /foo/');
            supertest(server.getHandler()).
                get('/').
                expect(404).
                end(done);
        });

        it('Should handler request and return 302', function (done) {
            var server = new Server();
            server.route('GET /', {
                name: 'foo',
                unit: 'foo'
            });

            server.unit({
                name: 'foo',
                main: function (track) {
                    track.status(302).header('Location', '/foo/').send();
                }
            });

            supertest(server.getHandler()).
                get('/').
                expect(302).
                end(done);
        });

        it('Should handler request and return 200', function (done) {
            var server = new Server();
            server.route('GET /', {
                name: 'foo',
                unit: 'foo'
            });

            server.unit({
                name: 'foo',
                main: function (track) {
                    track.send('foo');
                }
            });

            server.ready().done(function () {
                supertest(server.getHandler()).
                    get('/').
                    expect(200).
                    expect('foo').
                    end(done);
            });
        });
    });

    describe('server.listen()', function () {
        var asker = require('vow-asker');

        it('Should create and run http server', function (done) {
            var server = new Server();
            server.route('/', {
                name: 'foo',
                unit: 'foo'
            });

            server.unit({
                name: 'foo',
                main: function (track) {
                    track.send('foo');
                }
            });

            var port = Math.min(Number(Math.random().toString().slice(3, 8)), 65535);
            var srv = server.listen(port);

            asker({
                host: 'localhost',
                path: '/',
                port: port
            }).done(function (res) {
                assert.deepEqual(res.data, new Buffer('foo'));
                srv.close();
                done();
            }, done);

        });
    });
});
