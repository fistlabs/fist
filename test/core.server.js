/*eslint max-nested-callbacks: 0*/
/*global describe, it*/
'use strict';

var Router = require('finger/core/router');
var assert = require('assert');
var supertest = require('supertest');
var STATUS_CODES = require('http').STATUS_CODES;

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
                expect(STATUS_CODES[501]).
                end(done);
        });

        it('Should handle request and return 405', function (done) {
            var server = new Server();
            server.route('GET /', 'index');
            server.route('POST /foo/', 'foo');
            supertest(server.getHandler()).
                get('/foo/').
                expect('Allow', 'POST').
                expect(405).
                expect(STATUS_CODES[405]).
                end(done);
        });

        it('Should handle request and return 404', function (done) {
            var server = new Server();
            server.route('GET /foo/');
            supertest(server.getHandler()).
                get('/').
                expect(404).
                expect(STATUS_CODES[404]).
                end(done);
        });

        it('Should handle request and return 302', function (done) {
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

        it('Should handle request and return 200', function (done) {
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

        it('Should run controllers one by one', function (done) {
            var spy = [];
            var agent = new Server();
            agent.unit({
                name: 'foo',
                main: function () {
                    spy.push(this.name);
                }
            });
            agent.unit({
                name: 'bar',
                main: function () {
                    spy.push(this.name);
                }
            });
            agent.unit({
                name: 'baz',
                main: function () {
                    spy.push(this.name);
                }
            });

            agent.route('GET /', 'foo');
            agent.route('GET /', 'bar');
            agent.route('GET /', 'baz');

            agent.ready().done(function () {
                supertest(agent.getHandler()).
                    get('/').
                    expect(404).
                    end(function (err) {
                        assert.deepEqual(spy, ['foo', 'bar', 'baz']);
                        done(err);
                    });
            });
        });

        it('Should stop finding controller if one found', function (done) {
            var spy = [];
            var agent = new Server();
            agent.unit({
                name: 'foo',
                main: function () {
                    spy.push(this.name);
                }
            });
            agent.unit({
                name: 'bar',
                main: function (track) {
                    track.send(this.name);
                }
            });
            agent.unit({
                name: 'baz',
                main: function () {
                    spy.push(this.name);
                }
            });

            agent.route('GET /', 'foo');
            agent.route('GET /', 'bar');
            agent.route('GET /', 'baz');

            agent.ready().done(function () {
                supertest(agent.getHandler()).
                    get('/').
                    expect(200).
                    expect('bar').
                    end(function (err) {
                        assert.deepEqual(spy, ['foo']);
                        done(err);
                    });
            });
        });

        it('Should send 500 if controller was rejected', function (done) {
            var spy = [];
            var agent = new Server();
            agent.unit({
                name: 'foo',
                main: function () {
                    spy.push(this.name);
                }
            });
            agent.unit({
                name: 'bar',
                main: function () {
                    spy.push(this.name);
                }
            });
            agent.unit({
                name: 'baz',
                main: function () {
                    throw this.name;
                }
            });

            agent.route('GET /', 'foo');
            agent.route('GET /', 'bar');
            agent.route('GET /', 'baz');

            agent.ready().done(function () {
                supertest(agent.getHandler()).
                    get('/').
                    expect(500).
                    expect('baz').
                    end(function (err) {
                        assert.deepEqual(spy, ['foo', 'bar']);
                        done(err);
                    });
            });
        });

        it('Should not overwrite explicit head if controller was rejected', function (done) {
            var spy = [];
            var agent = new Server();
            agent.unit({
                name: 'foo',
                main: function () {
                    spy.push(this.name);
                }
            });
            agent.unit({
                name: 'bar',
                main: function () {
                    spy.push(this.name);
                }
            });
            agent.unit({
                name: 'baz',
                main: function (track) {
                    track.status(502).send('o_O');
                    throw this.name;
                }
            });

            agent.route('GET /', 'foo');
            agent.route('GET /', 'bar');
            agent.route('GET /', 'baz');

            agent.ready().done(function () {
                supertest(agent.getHandler()).
                    get('/').
                    expect(502).
                    expect('o_O').
                    end(function (err) {
                        assert.deepEqual(spy, ['foo', 'bar']);
                        done(err);
                    });
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
