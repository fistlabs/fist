/*global describe, it*/
'use strict';

var Parted = require('./util/Parted');

var _ = require('lodash-node');
var assert = require('chai').assert;
var http = require('./util/http');
var vow = require('vow');

describe('fist/res/Res', function () {
    /*eslint max-nested-callbacks: [2, 5]*/

    var Res = require('../res/Res');

    it('Should be an instance of fist/res/Res', function (done) {
        http({}, function (rq, rs) {

            var res = new Res(rs, {
                a: 5
            });

            assert.deepEqual(res.params, {
                a: 5
            });

            rs.end();
        }, function (err) {
            assert.ok(!err);
            done();
        });
    });

    describe('Res.getStatusMessage', function () {
        var STATUS_CODES = require('http').STATUS_CODES;

        it('Should return correct status messages', function () {
            _.forOwn(STATUS_CODES, function (msg, code) {
                assert.strictEqual(Res.getStatusMessage(code), msg);
            });
        });

        it('Should return stringifyed code', function () {
            assert.strictEqual(Res.getStatusMessage(2), '2');
        });
    });

    describe('.setHeader', function () {
        it('Should set response header', function (done) {
            http({}, function (rq, rs) {
                var res = new Res(rs);
                res.setHeader('x-test', 'ok');
                rs.end();
            }, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.headers['x-test'], 'ok');
                done();
            });
        });

        it('Should not set header if it has already exists', function (done) {
            http({}, function (rq, rs) {
                var res = new Res(rs);

                res.setHeader('x-test', 'ok');
                res.setHeader('x-test', 'foo', true);

                rs.end();
            }, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.headers['x-test'], 'ok');
                done();
            });
        });

        it('Should merge Set-Cookie header values', function (done) {
            http({}, function (rq, rs) {
                var res = new Res(rs);

                res.setHeader('Set-Cookie', 'name=value');
                res.setHeader('Set-Cookie', 'name2=value2');

                rs.end();
            }, function (err, res) {
                assert.ok(!err);
                assert.deepEqual(res.headers['set-cookie'], [
                    'name=value', 'name2=value2']);
                done();
            });
        });
    });

    describe('.setHeaders', function () {
        it('Should set response headers', function (done) {
            http({}, function (rq, rs) {
                var res = new Res(rs);

                res.setHeaders({
                    foo: 'bar',
                    baz: 'zot'
                });

                rs.end();
            }, function (err, res) {

                assert.ok(!err);
                assert.strictEqual(res.headers.foo, 'bar');
                assert.strictEqual(res.headers.baz, 'zot');

                done();
            });
        });
    });

    describe('.getHeader', function () {
        it('Should get header by name', function (done) {
            http({}, function (rq, rs) {
                var res = new Res(rs);
                res.setHeader('test', 'ok');
                assert.strictEqual(res.getHeader('Test'), 'ok');
                rs.end();
            }, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.headers.test, 'ok');
                done();
            });
        });
    });

    describe('.setStatus', function () {
        it('Should set statusCode', function (done) {
            http({

            }, function (rq, rs) {
                var res = new Res(rs);
                res.setStatus(201);
                rs.end();
            }, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.statusCode, 201);

                done();
            });
        }) ;
    });

    describe('.getStatus', function () {
        it('Should get statusCode', function (done) {
            http({

            }, function (rq, rs) {
                var res = new Res(rs);
                res.setStatus(201);
                assert.strictEqual(res.getStatus(), 201);
                rs.end();
            }, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.statusCode, 201);

                done();
            });
        });
    });

    describe('.setCookie', function () {
        it('Should set cookie', function (done) {
            http({}, function (rq, rs) {
                var res = new Res(rs);
                res.setCookie('name', 'value');
                rs.end();
            }, function (err, res) {
                assert.ok(!err);
                assert.deepEqual(res.headers['set-cookie'], ['name=value']);
                done();
            });
        });
    });

    describe('.respond', function () {
        var STATUS_CODES = require('http').STATUS_CODES;

        it('Should not affect if no returned', function (done) {
            http({}, function (req, rs) {
                var res = new Res(rs);
                var resp;

                res.setStatus(200);
                resp = res.respond(201);
                assert.strictEqual(res.getStatus(), 200);

                vow.when(resp, function (resp) {
                    Res.end(rs, resp);
                });
            }, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.statusCode, 201);
                done();
            });
        });

        it('Should respond by Undefined', function (done) {
            http({}, function (req, rs) {
                var res = new Res(rs);
                vow.when(res.respond(201), function (resp) {
                    Res.end(rs, resp);
                });
            }, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.statusCode, 201);
                assert.strictEqual(res.headers['content-type'], 'text/plain');
                assert.strictEqual(+res.headers['content-length'],
                    res.data.length);
                assert.deepEqual(res.data, new Buffer(STATUS_CODES[201]));
                done();
            });
        });

        it('Should respond by String', function (done) {
            http({}, function (req, rs) {
                var res = new Res(rs);
                vow.when(res.respond(201, 'test'), function (resp) {
                    Res.end(rs, resp);
                });
            }, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.statusCode, 201);
                assert.strictEqual(res.headers['content-type'], 'text/plain');
                assert.strictEqual(+res.headers['content-length'],
                    res.data.length);
                assert.deepEqual(res.data, new Buffer('test'));
                done();
            });
        });

        it('Should respond by Buffer', function (done) {
            http({}, function (req, rs) {
                var res = new Res(rs);
                vow.when(res.respond(201, new Buffer('test')), function (resp) {
                    Res.end(rs, resp);
                });
            }, function (err, res) {

                assert.ok(!err);
                assert.strictEqual(res.statusCode, 201);
                assert.strictEqual(res.headers['content-type'],
                    'application/octet-stream');
                assert.strictEqual(+res.headers['content-length'],
                    res.data.length);
                assert.deepEqual(res.data, new Buffer('test'));

                done();
            });
        });

        it('Should respond by Readable', function (done) {
            http({}, function (req, rs) {
                var res = new Res(rs);
                var body = new Parted([new Buffer('t'), 'e', 's', 't']);
                vow.when(res.respond(201, body), function (resp) {
                    Res.end(rs, resp);
                });
            }, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.statusCode, 201);
                assert.strictEqual(res.headers['content-type'],
                    'application/octet-stream');
                assert.strictEqual(+res.headers['content-length'],
                    res.data.length);
                assert.deepEqual(res.data, new Buffer('test'));

                done();
            });
        });

        it('Should be rejected by Readable', function (done) {
            http({
                statusFilter: function () {

                    return {
                        accept: true
                    };
                }
            }, function (req, rs) {
                var body = new Parted('test'.split(''));

                var res = new Res(rs);

                body.once('data', function () {
                    this.emit('error', 'ERR');
                });

                vow.when(res.respond(201, body), function (resp) {
                    Res.end(rs, resp);
                });
            }, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.statusCode, 500);
                assert.strictEqual(res.headers['content-type'], 'text/plain');
                assert.strictEqual(+res.headers['content-length'],
                    res.data.length);
                assert.deepEqual(res.data, new Buffer('ERR'));

                done();
            });
        });

        it('Should pause Readable on error', function (done) {
            var spy = [];

            http({
                statusFilter: function () {

                    return {
                        accept: true
                    };
                }
            }, function (req, rs) {

                var body = new Parted('test'.split(''));

                var res = new Res(rs);

                body.pause = function () {
                    spy.push(42);
                };

                body.once('data', function () {
                    this.emit('error', 'ERR');
                });

                vow.when(res.respond(201, body), function (resp) {
                    Res.end(rs, resp);
                });
            }, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.statusCode, 500);
                assert.strictEqual(res.headers['content-type'], 'text/plain');
                assert.strictEqual(+res.headers['content-length'],
                    res.data.length);
                assert.deepEqual(res.data, new Buffer('ERR'));
                assert.deepEqual(spy, [42]);
                done();
            });
        });

        it('Should respond by Error', function (done) {

            var error = new Error();

            http({}, function (req, rs) {
                var res = new Res(rs);
                vow.when(res.respond(201, error), function (resp) {
                    Res.end(rs, resp);
                });
            }, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.statusCode, 201);
                assert.strictEqual(res.headers['content-type'], 'text/plain');
                assert.strictEqual(+res.headers['content-length'],
                    res.data.length);
                assert.deepEqual(res.data, new Buffer(error.stack));

                done();
            });
        });

        it('Should show json instead of Error-trace', function (done) {

            var error = new Error();

            http({}, function (req, rs) {
                var res = new Res(rs, {
                    hideStackTrace: true
                });
                vow.when(res.respond(201, error), function (resp) {
                    Res.end(rs, resp);
                });
            }, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.statusCode, 201);
                assert.strictEqual(res.headers['content-type'],
                    'application/json');
                assert.strictEqual(+res.headers['content-length'],
                    res.data.length);

                assert.deepEqual(res.data, new Buffer(JSON.stringify(error)));
                assert.deepEqual(res.data, new Buffer('{}'));

                done();
            });
        });

        it('Should not respond by RespResolver', function (done) {
            http({}, function (req, rs) {
                var res = new Res(rs);
                var resp = res.respond(500, ':)');
                resp = res.respond(201, resp);
                vow.when(resp, function (resp) {
                    Res.end(rs, resp);
                });
            }, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.statusCode, 201);
                assert.strictEqual(res.headers['content-type'], 'text/plain');
                assert.strictEqual(+res.headers['content-length'],
                    res.data.length);
                assert.deepEqual(res.data + '', new Buffer(':)') + '');
                done();
            });
        });

        it('Should respond by Object', function (done) {
            http({}, function (req, rs) {
                var res = new Res(rs);
                vow.when(res.respond(201, {a: 42}), function (resp) {
                    Res.end(rs, resp);
                });
            }, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.statusCode, 201);
                assert.strictEqual(res.headers['content-type'],
                    'application/json');
                assert.strictEqual(+res.headers['content-length'],
                    res.data.length);
                assert.deepEqual(res.data, new Buffer('{"a":42}'));
                done();
            });
        });
    });

});
