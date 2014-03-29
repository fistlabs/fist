'use strict';

var Tracker = require('../../../Server');
var Connect = require('../../../track/Connect');
var connect = require('../../util/connect');

var Fs = require('fs');
var Url = require('url');
var buf = Fs.readFileSync('test/util/binary.png');

module.exports = {

    '{Connect}.method': [
        function (test) {
            connect({method: 'GET'}, function (t, req, res) {
                test.strictEqual(t.method, 'GET');
                t.status(250);
                test.strictEqual(t.status(), 250);
                res.end();
            }, function (err, res) {
                test.strictEqual(res.statusCode, 250);
                test.done();
            });
        }
    ],

    'Connect.prototype.header': [
        function (test) {
            connect({
                method: 'GET',
                headers: {
                    'x-test': 'fist.io'
                }
            }, function (t, req, res) {
                test.strictEqual(t.header('x-test'), 'fist.io');
                test.strictEqual(t.header()['x-test'], 'fist.io');
                res.end();
            }, function () {
                test.done();
            });
        },
        function (test) {
            connect({method: 'GET'}, function (t, req, res) {
                t.header('x-test', 'fist.io');
                res.end();
            }, function (err, res) {
                test.strictEqual(res.headers['x-test'], 'fist.io');
                test.done();
            });
        },
        function (test) {
            connect({method: 'GET'}, function (t, req, res) {
                t.header({
                    'x-test-0': 'fist.io-0',
                    'x-test-1': 'fist.io-1'
                });
                res.end();
            }, function (err, res) {
                test.strictEqual(res.headers['x-test-0'], 'fist.io-0');
                test.strictEqual(res.headers['x-test-1'], 'fist.io-1');
                test.done();
            });
        }
    ],

    'Connect.prototype.cookie': [
        function (test) {
            connect({
                method: 'get',
                headers: {
                    host: 'www.yandex.ru:80'
                }
            }, function (t, req, res) {
                var cookie = t.cookie();

                test.deepEqual(cookie, {});
                test.strictEqual(t.cookie('name'), void 0);

                res.end();

            }, function () {
                test.done();
            });
        },
        function (test) {
            connect({
                method: 'get',
                headers: {
                    host: 'www.yandex.ru:80',
                    cookie: 'name=fist.server'
                }
            }, function (t, req, res) {
                var cookie = t.cookie();

                test.deepEqual(cookie, {
                    name: 'fist.server'
                });
                test.strictEqual(t.cookie('name'), 'fist.server');

                res.end();

            }, function () {
                test.done();
            });
        },
        function (test) {

            var d;

            connect({
                method: 'GET',
                headers: {
                    Cookie: 'first=' + encodeURIComponent('Привет1')
                }
            }, function (t, req, res) {

                d = new Date();
                t.cookie('x', 'y');
                t.cookie('x', null, {});
                t.cookie('a', 'b');
                t.cookie('a', null);

                test.strictEqual(t.cookie('first'), 'Привет1');
                t.cookie('last', 'Привет');

                res.end();
            }, function (err, data) {
                test.deepEqual(data.headers['set-cookie'], [
                    'x=y', 'x=; expires=' + (new Date(d - 1)).toUTCString(),
                    'a=b', 'a=; expires=' + (new Date(d - 1)).toUTCString(),
                    'last=' + encodeURIComponent('Привет')
                ]);
                test.done();
            });
        }
    ],

    'Connect.prototype.body': [

        function (test) {
            connect({
                method: 'post',
                headers: {
                    'content-type': 'application/x-www-form-urlencoded'
                },
                body: 'a=5'
            }, function (t, req, res) {
                t.body(function (err, body) {
                    test.ok(!err);
                    test.deepEqual(body, {
                        input: {
                            a: '5'
                        },
                        type: 'urlencoded'
                    });
                });

                t.body(function (err, body) {
                    test.ok(!err);
                    test.deepEqual(body, {
                        input: {
                            a: '5'
                        },
                        type: 'urlencoded'
                    });
                    res.end();
                });

            }, function () {
                test.done();
            });
        },

        function (test) {
            connect({
                method: 'post',
                headers: {
                    'content-type': 'application/x-www-form-urlencoded'
                },
                body: 'a=5'
            }, function (t, req, res) {
                t.body({length: 2}, function (err) {
                    test.ok(err);
                    test.strictEqual(err.code, 'ELENGTH');
                    res.end();
                });

            }, function () {
                test.done();
            });
        }
    ],

    'Connect.prototype.send': [
        function (test) {
            connect({method: 'GET'}, function (t) {
                t.send();
                test.ok(t.sent());
            }, function (err, data) {
                test.strictEqual(data.data, 'OK');
                test.done();
            });
        },
        function (test) {
            connect({method: 'GET'}, function (t) {
                t.send(200);
            }, function (err, data) {
                test.strictEqual(data.data, 'OK');
                test.done();
            });
        },
        function (test) {
            connect({method: 'GET'}, function (t) {
                t.send(200, 'FIST');
            }, function (err, data) {
                test.strictEqual(data.data, 'FIST');
                test.done();
            });
        },
        function (test) {
            connect({method: 'GET'}, function (t) {
                t.send(200, buf);
            }, function (err, data) {
                test.strictEqual(data.data, String(buf));
                test.done();
            });
        },
        function (test) {
            connect({method: 'POST', body: buf}, function (t, req) {
                t.send(200, req);
            }, function (err, data) {
                test.strictEqual(data.data, String(buf));
                test.done();
            });
        },
        function (test) {
            connect({method: 'POST', body: buf}, function (t, req) {
                req.on('data', function () {
                    req.emit('error', 'ERR');
                });
                t.send(200, req);
            }, function (err, data) {
                test.strictEqual(data.statusCode, 500);
                test.strictEqual(data.data, 'ERR');
                test.done();
            });
        },
        function (test) {
            connect({method: 'GET'}, function (t) {
                t.send(200, {a: 5});
            }, function (err, data) {
                test.strictEqual(data.data, '{"a":5}');
                test.done();
            });
        },
        function (test) {
            connect({method: 'HEAD'}, function (t) {
                t.send(200);
            }, function (err, data) {
                test.strictEqual(data.headers['content-length'], '2');
                test.strictEqual(data.data, '');
                test.done();
            });
        },
        function (test) {
            connect({method: 'GET'}, function (t) {
                t.header('x-content', 'fist.server');
                t.header('content-ok', 'boo');
                t.send(304, '123');
            }, function (err, data) {
                Object.keys(data.headers).forEach(function (name) {
                    test.ok(0 !== name.indexOf('content-'));
                });
                test.strictEqual(data.headers['x-content'], 'fist.server');
                test.strictEqual(data.data, '');
                test.done();
            });
        },
        function (test) {
            connect({method: 'GET'}, function (t) {
                t.send(200);
                t.send(500);
            }, function (err, data) {
                test.strictEqual(data.statusCode, 200);
                test.done();
            });
        },
        function (test) {
            connect({method: 'HEAD'}, function (t) {
                t.send(new Buffer('FIST-RESPONSE'));
            }, function (err, data) {
                test.strictEqual(data.statusCode, 200);
                test.strictEqual(data.data, '');
                test.done();
            });
        },
        function (test) {
            connect({method: 'HEAD'}, function (t) {
                t.send({OK: ':)'});
            }, function (err, data) {
                test.strictEqual(data.statusCode, 200);
                test.strictEqual(data.data, '');
                test.done();
            });
        },
        function (test) {
            connect({method: 'HEAD', body: 'asd'}, function (t, req) {
                t.send(req);
            }, function (err, data) {
                test.strictEqual(data.statusCode, 200);
                test.strictEqual(data.data + '', '');
                test.done();
            });
        },
        function (test) {
            connect({method: 'HEAD', body: 'asd'}, function (t, req) {
                req.on('data', function () {
                    req.emit('error', 'ERR');
                });
                t.send(req);
            }, function (err, data) {
                test.strictEqual(data.statusCode, 500);
                test.strictEqual(data.data, '');
                test.done();
            });
        },
        function (test) {
            connect({method: 'GET', body: 'asd'}, function (t, req) {
                t.header('Content-Length', '4');
                t.send(req);
            }, function (err, data) {
                test.strictEqual(data.statusCode, 200);
                test.strictEqual(data.headers['content-length'], '4');
                test.strictEqual(data.data, 'asd');
                test.done();
            });
        },
        function (test) {
            connect({method: 'GET', body: 'asd'}, function (t, req) {
                req.on('data', function () {
                    req.emit('error', 'ERR');
                });
                t.header('Content-Length', '3');
                t.send(req);
            }, function (err, data) {
                test.strictEqual(data.statusCode, 500);
                test.strictEqual(data.data, 'ERR');
                test.done();
            });
        },
        function (test) {
            var err = new Error();
            err.msg = 'ERR';
            connect({method: 'GET'}, function (t) {
                t.send(err);
            }, function (err, data) {
                test.strictEqual(data.data, '{"msg":"ERR"}');
                test.done();
            });
        }
    ],

    'Connect.host': [
        function (test) {
            test.strictEqual(Connect.host({
                headers: {
                    'x-forwarded-host': 'www.yandex.ru'
                }
            }), 'www.yandex.ru');
            test.strictEqual(Connect.host({
                headers: {
                    host: 'www.yandex.ru'
                }
            }), 'www.yandex.ru');
            test.strictEqual(Connect.host({
                headers: {}
            }), void 0);

            test.done();
        }
    ],

    'Connect.proto': [
        function (test) {
            test.strictEqual(Connect.proto({
                socket: {
                    encrypted: true
                }
            }), 'https');
            test.strictEqual(Connect.proto({
                socket: {
                    encrypted: false
                },
                headers: {
                    'x-forwarded-proto': 'fist.server'
                }
            }), 'fist.server');
            test.strictEqual(Connect.proto({
                socket: {
                    encrypted: false
                },
                headers: {}
            }), 'http');
            test.done();
        }
    ],

    'Connect.href': [
        function (test) {
            var req = {
                url: '/path/to/page?no=5',
                socket: {
                    encrypted: false
                },
                headers: {
                    host: 'fistlabs.co:80',
                    'x-forwarded-proto': 'https'
                }
            };
            test.strictEqual(Connect.href(req),
                'https://fistlabs.co:80/path/to/page?no=5');
            test.done();
        }
    ],

    'Connect.url': [
        function (test) {
            var req = {
                url: '/path/to/page?no=5',
                socket: {
                    encrypted: false
                },
                headers: {
                    host: 'fistlabs.co:80',
                    'x-forwarded-proto': 'https'
                }
            };
            test.deepEqual(Connect.url(req),
                Url.parse('https://fistlabs.co:80/path/to/page?no=5', true));
            test.done();
        }
    ]

};
