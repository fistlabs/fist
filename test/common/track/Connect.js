'use strict';

var Tracker = require('../../../Server');
var Connect = require('../../../track/Connect');
var track = require('../../util/track');

var Fs = require('fs');
var Url = require('url');
var buf = Fs.readFileSync('test/util/binary.png');

Object.prototype.bug = 42;

module.exports = {

    '{Connect}.method': function (test) {
        track({
            method: 'get'
        }, function (t, req, res) {
            test.strictEqual(t.method, 'GET');
            res.end();
        }, function () {
            test.done();
        });
    },

    'Connect.prototype.header-0': function (test) {
        track({
            method: 'get',
            headers: {
                host: 'www.yandex.ru:80'
            }
        }, function (t, req, res) {
            var headers = t.header();

            test.strictEqual(headers.host, 'www.yandex.ru:80');
            test.strictEqual(t.header('Host'), 'www.yandex.ru:80');
            res.end();

        }, function () {
            test.done();
        });
    },

    'Connect.prototype.cookie (empty)': function (test) {
        track({
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

    'Connect.prototype.cookie-1': function (test) {
        track({
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

    'Connect.prototype.body': function (test) {
        track({
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
                    files: {}
                });
            });

            t.body(function (err, body) {
                test.ok(!err);
                test.deepEqual(body, {
                    input: {
                        a: '5'
                    },
                    files: {}
                });
                res.end();
            });

        }, function () {
            test.done();
        });
    },

    'Connect.prototype.header': function (test) {
        track({
            method: 'GET',
            headers: {
                'x-test': 'fist.server'
            }
        }, function (t, req, res) {

            test.strictEqual(t.header('x-test'), 'fist.server');

            t.header({
                A: 'A',
                B: 'B'
            });

            t.header('A', 'O_O', true);
            t.header('Set-Cookie', 'name1=value1');
            t.header('Set-Cookie', 'name2=value2');

            res.end();

        }, function (err, data) {
            test.ok(!err);
            test.strictEqual(data.headers.a, 'A');
            test.strictEqual(data.headers.b, 'B');
            test.deepEqual(data.headers['set-cookie'],
                ['name1=value1', 'name2=value2']);
            test.done();
        });
    },

    'Connect.prototype.cookie': function (test) {

        var d;

        track({
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
    },

    'Connect.prototype.send-0': function (test) {
        track({method: 'GET'}, function (t, req, res) {
            t.send();
        }, function (err, data) {
            test.strictEqual(data.data, 'OK');
            test.done();
        });
    },

    'Connect.prototype.send-1': function (test) {
        track({method: 'GET'}, function (t, req, res) {
            t.send(200);
        }, function (err, data) {
            test.strictEqual(data.data, 'OK');
            test.done();
        });
    },

    'Connect.prototype.send-2': function (test) {
        track({method: 'GET'}, function (t, req, res) {
            t.send(200, 'FIST');
        }, function (err, data) {
            test.strictEqual(data.data, 'FIST');
            test.done();
        });
    },

    'Connect.prototype.send-3': function (test) {
        track({method: 'GET'}, function (t, req, res) {
            t.send(200, buf);
        }, function (err, data) {
            test.strictEqual(data.data, String(buf));
            test.done();
        });
    },

    'Connect.prototype.send-4': function (test) {
        track({method: 'POST', body: buf}, function (t, req, res) {
            t.send(200, req);
        }, function (err, data) {
            test.strictEqual(data.data, String(buf));
            test.done();
        });
    },

    'Connect.prototype.send-5': function (test) {
        track({method: 'POST',body: buf}, function (t, req, res) {
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

    'Connect.prototype.send-6': function (test) {
        track({method: 'GET'}, function (t, req, res) {
            t.send(200, {a: 5});
        }, function (err, data) {
            test.strictEqual(data.data, '{"a":5}');
            test.done();
        });
    },

    'Connect.prototype.send-7': function (test) {
        track({method: 'HEAD'}, function (t, req, res) {
            t.send(200);
        }, function (err, data) {
            test.strictEqual(data.headers['content-length'], '2');
            test.strictEqual(data.data, '');
            test.done();
        });
    },

    'Connect.prototype.send-8': function (test) {
        track({method: 'GET'}, function (t, req, res) {
            t.header('x-content', 'fist.server');
            t.header('content-ok', 'boo');
            t.send(304, '123');
        }, function (err, data) {
            Object.keys(data.headers).forEach(function (name) {
                test.ok( 0 !== name.indexOf('content-') );
            });
            test.strictEqual(data.headers['x-content'], 'fist.server');
            test.strictEqual(data.data, '');
            test.done();
        });
    },

    'Connect.prototype.send-9': function (test) {
        track({method: 'GET'}, function (t, req, res) {
            t.send(200);
            t.send(500);
        }, function (err, data) {
            test.strictEqual(data.statusCode, 200);
            test.done();
        });
    },

    'Connect.prototype.send-10': function (test) {
        track({method: 'HEAD'}, function (t, req, res) {
            t.send(new Buffer('FIST-RESPONSE'));
        }, function (err, data) {
            test.strictEqual(data.statusCode, 200);
            test.strictEqual(data.data, '');
            test.done();
        });
    },

    'Connect.prototype.send-11': function (test) {
        track({method: 'HEAD'}, function (t, req, res) {
            t.send({OK: ':)'});
        }, function (err, data) {
            test.strictEqual(data.statusCode, 200);
            test.strictEqual(data.data, '');
            test.done();
        });
    },

    'Connect.prototype.send-12': function (test) {
        track({method: 'HEAD', body: 'asd'}, function (t, req, res) {
            t.send(req);
        }, function (err, data) {
            test.strictEqual(data.statusCode, 200);
            test.strictEqual(data.data + '', '');
            test.done();
        });
    },

    'Connect.prototype.send-13': function (test) {
        track({method: 'HEAD', body: 'asd'}, function (t, req, res) {
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

    'Connect.prototype.send-14': function (test) {
        track({method: 'GET', body: 'asd'}, function (t, req, res) {
            t.header('Content-Length', '4');
            t.send(req);
        }, function (err, data) {
            test.strictEqual(data.statusCode, 200);
            test.strictEqual(data.headers['content-length'],  '4');
            test.strictEqual(data.data, 'asd');
            test.done();
        });
    },

    'Connect.prototype.send-15': function (test) {
        track({method: 'GET', body: 'asd'}, function (t, req, res) {
            req.on('data', function () {
                req.emit('error', 'ERR');
            });
            t.header('Content-Length', '3');
            t.send(req);
        }, function (err, data) {
            test.strictEqual(data.statusCode, 500);
            test.strictEqual(data.data + '', 'ERR');
            test.done();
        });
    },

    'Connect.host': function (test) {
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
    },

    'Connect.proto': function (test) {
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
    },

    'Connect.href': function (test) {
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
    },

    'Connect.url': function (test) {
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

};
