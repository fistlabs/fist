'use strict';

var Req = require('../../../req/Req');

var _ = require('lodash-node');
var http = require('../../util/http');

module.exports = {
    Req: [
        function (test) {
            http({}, function (req, res) {
                req = new Req(req, {a: 5});
                test.deepEqual(req.params, {a: 5});
                res.end();
            }, function (err) {
                test.ok(!err);
                test.done();
            });
        }
    ],
    'Req.prototype.getUrl': [
        function (test) {
            http({
                path: '/test/'
            }, function (req, res) {
                req = new Req(req);

                test.deepEqual(req.getUrl(), {
                    protocol: 'http:',
                    slashes: true,
                    auth: null,
                    host: 'localhost',
                    port: null,
                    hostname: 'localhost',
                    hash: null,
                    search: '',
                    query: {},
                    pathname: '/test/',
                    path: '/test/',
                    href: 'http://localhost/test/'
                });

                res.end();
            }, function (err) {
                test.ok(!err);
                test.done();
            });
        },
        function (test) {
            http({
                path: '/test/',
                headers: {
                    host: 'fist.io'
                }
            }, function (req, res) {
                req = new Req(req);

                test.deepEqual(req.getUrl(), {
                    protocol: 'http:',
                    slashes: true,
                    auth: null,
                    host: 'fist.io',
                    port: null,
                    hostname: 'fist.io',
                    hash: null,
                    search: '',
                    query: {},
                    pathname: '/test/',
                    path: '/test/',
                    href: 'http://fist.io/test/'
                });

                res.end();
            }, function (err) {
                test.ok(!err);
                test.done();
            });
        },
        function (test) {
            http({
                path: '/test/',
                headers: {
                    'x-forwarded-host': 'fist.io'
                }
            }, function (req, res) {
                req = new Req(req);

                test.deepEqual(req.getUrl(), {
                    protocol: 'http:',
                    slashes: true,
                    auth: null,
                    host: 'fist.io',
                    port: null,
                    hostname: 'fist.io',
                    hash: null,
                    search: '',
                    query: {},
                    pathname: '/test/',
                    path: '/test/',
                    href: 'http://fist.io/test/'
                });

                res.end();
            }, function (err) {
                test.ok(!err);
                test.done();
            });
        },
        function (test) {
            http({
                path: '/test/',
                headers: {
                    'x-forwarded-host': 'fist.io'
                }
            }, function (req, res) {
                //  test hack
                req.socket.encrypted = true;

                req = new Req(req);

                test.deepEqual(req.getUrl(), {
                    protocol: 'https:',
                    slashes: true,
                    auth: null,
                    host: 'fist.io',
                    port: null,
                    hostname: 'fist.io',
                    hash: null,
                    search: '',
                    query: {},
                    pathname: '/test/',
                    path: '/test/',
                    href: 'https://fist.io/test/'
                });

                res.end();
            }, function (err) {
                test.ok(!err);
                test.done();
            });
        }
    ],
    'Req.prototype.getHeaders': [
        function (test) {
            http({
                headers: {
                    test: 'ok'
                },
                path: '/test/'
            }, function (req, res) {

                var headers;

                req = new Req(req);
                headers = req.getHeaders();
                test.strictEqual(headers.test, 'ok');

                res.end();

            }, function (err) {
                test.ok(!err);
                test.done();
            });
        }
    ],
    'Req.prototype.getHeader': [
        function (test) {
            http({
                headers: {
                    test: 'ok'
                },
                path: '/test/'
            }, function (req, res) {
                req = new Req(req);

                test.strictEqual(req.getHeader('TEST'), 'ok');
                test.strictEqual(req.getHeader('Test'), 'ok');
                test.strictEqual(req.getHeader('test'), 'ok');

                res.end();

            }, function (err) {
                test.ok(!err);
                test.done();
            });
        }
    ],
    'Req.prototype.getCookies': [
        function (test) {
            http({
                Cookies: null
            }, function (req, res) {

                var cookies;

                req = new Req(req);
                cookies = req.getCookies();

                test.ok(_.isEmpty(cookies));

                res.end();
            }, function (err) {
                test.ok(!err);
                test.done();
            });
        },
        function (test) {
            http({
                headers: {
                    Cookie: 'name=value; x=5'
                }
            }, function (req, res) {

                var cookies;

                req = new Req(req);
                cookies = req.getCookies();

                test.strictEqual(cookies, req.getCookies());
                test.strictEqual(cookies.name, 'value');
                test.strictEqual(cookies.x, '5');

                res.end();
            }, function (err) {
                test.ok(!err);
                test.done();
            });
        }
    ],
    'Req.prototype.getCookie': [
        function (test) {
            http({
                headers: {
                    Cookie: 'name=value; x=5'
                }
            }, function (req, res) {
                req = new Req(req);

                test.strictEqual(req.getCookie('name'), 'value');

                res.end();
            }, function (err) {
                test.ok(!err);
                test.done();
            });
        }
    ],
    'Req.prototype.getBody': [
        function (test) {
            http({
                method: 'POST',
                body: 'TEST'
            }, function (req, res) {

                var promise;

                req = new Req(req);

                promise = req.getBody();

                test.strictEqual(promise, req.getBody());

                promise.then(function (body) {
                    test.deepEqual(body.input, new Buffer('TEST'));
                    res.end();
                });

            }, function (err) {
                test.ok(!err);
                test.done();
            });
        },
        function (test) {
            http({}, function (req, res) {

                var promise;

                req = new Req(req);

                promise = req.getBody();

                test.strictEqual(promise, req.getBody());

                promise.then(function (body) {
                    test.strictEqual(body.type, void 0);
                    test.deepEqual(body.input, {});
                    res.end();
                });

            }, function (err) {
                test.ok(!err);
                test.done();
            });
        }
    ]
};
