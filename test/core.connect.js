/*eslint max-nested-callbacks: 0*/
/*global describe, it*/
'use strict';

var Server = require('../core/server');

var assert = require('assert');
var supertest = require('supertest');

describe('core/connect', function () {
    var Connect = require('../core/connect');

    describe('connect.url', function () {
        it('Should be parsed request url', function (done) {
            supertest(function (req, res) {
                var connect = new Connect(new Server(), req, res);
                var url = connect.url;

                assert.ok(url);
                assert.strictEqual(typeof url, 'object');
                assert.strictEqual(url.pathname, '/');
                assert.ok(url.query);
                assert.strictEqual(typeof url.query, 'object');

                res.end();
            }).
                get('/').
                expect(200, done);
        });

        it('Should get url.hostname from Host header', function (done) {
            supertest(function (req, res) {
                var connect = new Connect(new Server(), req, res);
                var url = connect.url;
                assert.strictEqual(url.hostname, connect.header('Host'));
                assert.strictEqual(url.hostname, 'foo.bar');

                res.end();
            }).
                get('/').
                set('Host', 'foo.bar').
                expect(200, done);
        });

        it('Should get url.hostname from X-Forwarded-Host header', function (done) {
            supertest(function (req, res) {
                var connect = new Connect(new Server(), req, res);
                var url = connect.url;
                assert.strictEqual(url.hostname, connect.header('X-Forwarded-Host'));
                assert.strictEqual(connect.header('Host'), 'foo.bar');
                assert.strictEqual(url.hostname, 'foo.bar.baz');

                res.end();
            }).
                get('/').
                set('Host', 'foo.bar').
                set('x-Forwarded-Host', 'foo.bar.baz').
                expect(200, done);
        });

        it('Should get url.protocol from X-Forwarded-Proto', function (done) {
            supertest(function (req, res) {
                var connect = new Connect(new Server(), req, res);
                var url = connect.url;
                assert.strictEqual(url.protocol, connect.header('X-Forwarded-Proto') + ':');

                res.end();
            }).
                get('/').
                set('X-Forwarded-Proto', 'https').
                expect(200, done);
        });

        it('Should get url.protocol as https: if socket is encrypted', function (done) {
            supertest(function (req, res) {
                //  -__-
                req.socket.encrypted = true;
                var connect = new Connect(new Server(), req, res);
                var url = connect.url;
                assert.strictEqual(url.protocol, 'https:');
                assert.strictEqual(connect.header('X-Forwarded-Proto'), 'http');

                res.end();
            }).
                get('/').
                set('X-Forwarded-Proto', 'http').
                expect(200, done);
        });

    });

    describe('connect.header()', function () {
        it('Should return all request headers', function (done) {
            supertest(function (req, res) {
                var connect = new Connect(new Server(), req, res);
                var header = connect.header();

                assert.ok(header);
                assert.strictEqual(typeof header, 'object');
                assert.strictEqual(header['x-foo'], 'bar');
                assert.strictEqual(header['x-bar'], 'baz');

                res.end();
            }).
                get('/').
                set('X-Foo', 'bar').
                set('X-Bar', 'baz').
                expect(200, done);
        });

        it('Should return request header by name', function (done) {
            supertest(function (req, res) {
                var connect = new Connect(new Server(), req, res);

                assert.strictEqual(connect.header('x-foo'), 'bar');
                assert.strictEqual(connect.header('X-Foo'), 'bar');
                assert.strictEqual(connect.header('X-Bar'), 'baz');

                res.end();
            }).
                get('/').
                set('X-Foo', 'bar').
                set('X-Bar', 'baz').
                expect(200, done);
        });

        it('Should set header by name and value', function (done) {
            supertest(function (req, res) {
                var connect = new Connect(new Server(), req, res);

                assert.strictEqual(connect.header('X-Foo', 'bar'), connect);
                assert.strictEqual(connect.header('X-Bar', 'baz'), connect);

                res.end();
            }).
                get('/').
                expect('x-foo', 'bar').
                expect('X-Foo', 'bar').
                expect('X-Bar', 'baz').
                expect(200, done);
        });

        it('Should set header by object', function (done) {
            supertest(function (req, res) {
                var connect = new Connect(new Server(), req, res);

                assert.strictEqual(connect.header({
                    'X-Foo': 'bar',
                    'X-Bar': 'baz'
                }), connect);

                res.end();
            }).
                get('/').
                expect('x-foo', 'bar').
                expect('X-Foo', 'bar').
                expect('X-Bar', 'baz').
                expect(200, done);
        });
    });

    describe('connect.cookie()', function () {
        it('Should return all request cookies', function (done) {
            supertest(function (req, res) {
                var connect = new Connect(new Server(), req, res);
                var cookie = connect.cookie();

                assert.ok(cookie);
                assert.strictEqual(typeof cookie, 'object');
                assert.strictEqual(cookie.foo, 'bar');
                assert.strictEqual(cookie.bar, 'baz');

                res.end();
            }).
                get('/').
                set('Cookie', 'foo=bar; bar=baz').
                expect(200, done);
        });

        it('Should not fail if no Cookie header set', function (done) {
            supertest(function (req, res) {
                var connect = new Connect(new Server(), req, res);
                var cookie = connect.cookie();

                assert.ok(cookie);
                assert.strictEqual(typeof cookie, 'object');

                res.end();
            }).
                get('/').
                expect(200, done);
        });

        it('Should return request cookie by name', function (done) {
            supertest(function (req, res) {
                var connect = new Connect(new Server(), req, res);

                assert.strictEqual(connect.cookie('foo'), 'bar');
                assert.strictEqual(connect.cookie('bar'), 'baz');

                res.end();
            }).
                get('/').
                set('Cookie', 'foo=bar; bar=baz').
                expect(200, done);
        });

        it('Should set cookie by name, value and options', function (done) {
            supertest(function (req, res) {
                var connect = new Connect(new Server(), req, res);

                assert.strictEqual(connect.cookie('foo', 'bar'), connect);
                assert.strictEqual(connect.cookie('bar', 'baz', {
                    path: '/xyz/'
                }), connect);
                assert.strictEqual(connect.cookie('baz', 'zot'), connect);

                res.end();
            }).
                get('/').
                expect('Set-Cookie', /foo=bar/).
                expect('Set-Cookie', /baz=zot/).
                expect('Set-Cookie', /bar=baz;[\s\S]*path=\/xyz\//i).
                expect(200, done);
        });
    });

    describe('connect.send()', function () {

        describe('connect.send(String)', function () {

            it('Should send string and auto set headers implicit headers', function (done) {
                supertest(function (req, res) {
                    var connect = new Connect(new Server(), req, res);
                    connect.send('Foo');
                }).
                    get('/').
                    expect('Foo').
                    expect('Content-Type', /text\/plain/).
                    expect('Content-Length', Buffer.byteLength('Foo')).
                    end(done);
            });

            it('Should not overwrite explicit headers', function (done) {
                supertest(function (req, res) {
                    var connect = new Connect(new Server(), req, res);
                    connect.header({
                        'Content-Type': 'text/bar+plain',
                        'Content-Length': 42
                    });

                    connect.send('Foo');
                }).
                    get('/').
                    expect('Foo').
                    expect('Content-Type', 'text/bar+plain').
                    expect('Content-Length', '42').
                    end(done);
            });
        });

        describe('connect.send(Undefined)', function () {
            var STATUS_CODES = require('http').STATUS_CODES;

            it('Should send status text if no body passed', function (done) {
                supertest(function (req, res) {
                    var connect = new Connect(new Server(), req, res);
                    connect.send();
                }).
                    get('/').
                    expect(STATUS_CODES[200]).
                    expect('Content-Type', /text\/plain/).
                    expect('Content-Length', Buffer.byteLength(STATUS_CODES[200])).
                    end(done);
            });
        });

        describe('connect.send(Buffer)', function () {
            it('Should send buffer as application/octet-stream by default', function (done) {
                supertest(function (req, res) {
                    var connect = new Connect(new Server(), req, res);
                    connect.send(new Buffer('foo'));
                }).
                    get('/').
                    expect(new Buffer('foo').toString()).
                    expect('Content-Type', /application\/octet-stream/).
                    expect('Content-Length', new Buffer('foo').length).
                    end(done);
            });

            it('Should not overwrite explicit headers', function (done) {
                supertest(function (req, res) {
                    var connect = new Connect(new Server(), req, res);
                    connect.header({
                        'Content-Type': 'text/plain',
                        'Content-Length': '42'
                    });
                    connect.send(new Buffer('foo'));
                }).
                    get('/').
                    expect(new Buffer('foo').toString()).
                    expect('Content-Type', /text\/plain/).
                    expect('Content-Length', '42').
                    end(done);
            });
        });

        describe('connect.send(Stream.Readable)', function () {
            it('Should pipe stream to response', function (done) {
                supertest(function (req, res) {
                    var connect = new Connect(new Server(), req, res);
                    connect.send(req);
                }).
                    get('/').
                    send('foo-bar').
                    expect('foo-bar').
                    expect('Content-Type', /application\/octet-stream/).
                    expect('Transfer-Encoding', 'chunked').
                    end(done);
            });

            it('Should not overwrite explicit headers', function (done) {
                supertest(function (req, res) {
                    var connect = new Connect(new Server(), req, res);
                    connect.header('Content-Type', 'text/plain').send(req);
                }).
                    get('/').
                    send('foo-bar').
                    expect('foo-bar').
                    expect('Content-Type', /text\/plain/).
                    expect('Transfer-Encoding', 'chunked').
                    end(done);
            });
        });

        describe('connect.send(Error)', function () {
            it('Should send error stack as string', function (done) {
                var error = new Error(':)');
                supertest(function (req, res) {
                    var connect = new Connect(new Server(), req, res);
                    connect.send(error);
                }).
                    get('/').
                    expect(error.stack).
                    expect('Content-Type', /text\/plain/).
                    expect('Content-Length', Buffer.byteLength(error.stack)).
                    end(done);
            });

            it('Should stringify error if no stack exist', function (done) {
                var error = new Error(':)');
                error.stack = null;

                supertest(function (req, res) {
                    var connect = new Connect(new Server(), req, res);
                    connect.send(error);
                }).
                    get('/').
                    expect(String(error)).
                    expect('Content-Type', /text\/plain/).
                    expect('Content-Length', Buffer.byteLength(String(error))).
                    end(done);
            });

        });

        describe('connect.send(*)', function () {
            it('Should send objects as json', function (done) {
                var obj = {foo: 'bar'};

                supertest(function (req, res) {
                    var connect = new Connect(new Server(), req, res);
                    connect.send(obj);
                }).
                    get('/').
                    expect(JSON.stringify(obj)).
                    expect('Content-Type', /application\/json/).
                    expect('Content-Length', Buffer.byteLength(JSON.stringify(obj))).
                    end(done);
            });

            it('Should not overwrite explicit headers', function (done) {
                var obj = {foo: 'bar'};

                supertest(function (req, res) {
                    var connect = new Connect(new Server(), req, res);
                    connect.header({
                        'Content-Type': 'text/plain',
                        'Content-Length': 42
                    }).send(obj);
                }).
                    get('/').
                    expect(JSON.stringify(obj)).
                    expect('Content-Type', /text\/plain/).
                    expect('Content-Length', '42').
                    end(done);
            });
        });

    });

    describe('connect.status()', function () {
        it('Should set status', function (done) {
            supertest(function (req, res) {
                var connect = new Connect(new Server(), req, res);
                assert.strictEqual(connect.status(201), connect);
                connect.send();
            }).
                get('/').
                expect(201).
                end(done);
        });

        it('Should get status', function (done) {
            supertest(function (req, res) {
                var connect = new Connect(new Server(), req, res);
                assert.strictEqual(connect.status(), 200);
                connect.send();
            }).
                get('/').
                end(done);
        });
    });

    describe('connect.run()', function () {

        it('Should send 501', function (done) {
            supertest(function (req, res) {
                return new Connect(new Server(), req, res).run();
            }).
                get('/').
                expect(501, done);
        });

        it('Should send 405', function (done) {
            var agent = new Server();
            agent.route('GET /', {
                name: 'index'
            });
            agent.route('POST /upload/', {
                name: 'upload'
            });
            agent.ready().done(function () {
                supertest(function (req, res) {
                    return new Connect(agent, req, res).run();
                }).
                    post('/').
                    expect('Allow', /GET/).
                    expect(405).
                    end(done);
            });
        });

        it('Should send 404', function (done) {
            var agent = new Server();
            agent.route('GET /', {
                name: 'index'
            });
            agent.ready().done(function () {
                supertest(function (req, res) {
                    return new Connect(agent, req, res).run();
                }).
                    get('/foo/').
                    expect(404).
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
                supertest(function (req, res) {
                    var connect = new Connect(agent, req, res);
                    connect.run();
                }).
                    get('/').
                    expect(404).
                    end(function (err) {
                        assert.deepEqual(spy, ['foo', 'bar', 'baz']);
                        done(err);
                    });
            });
        });

        it('Should stop find controller if one found', function (done) {
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
                supertest(function (req, res) {
                    var connect = new Connect(agent, req, res);
                    connect.run();
                }).
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
                supertest(function (req, res) {
                    var connect = new Connect(agent, req, res);
                    connect.run();
                }).
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
                supertest(function (req, res) {
                    var connect = new Connect(agent, req, res);
                    connect.run();
                }).
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
});
