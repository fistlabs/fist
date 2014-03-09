'use strict';

var Tracker = require('../../../Server');
var Connect = require('../../../track/Connect');
var http = require('./../../util/http');
var Fs = require('fs');
var Url = require('url');
var buf = Fs.readFileSync('test/util/binary.png');

Object.prototype.bug = 42;

module.exports = {

    '{Connect}.method': function (test) {
        http({
            method: 'get'
        }, function (req, res) {

            var tracker = new Tracker();

            var track = new Connect(tracker, req, res);

            test.strictEqual(track.method, 'GET');
            res.end();

        }, function () {
            test.done();
        });
    },

    'Connect.prototype.header-0': function (test) {
        http({
            method: 'get',
            headers: {
                host: 'www.yandex.ru:80'
            }
        }, function (req, res) {

            var tracker = new Tracker();

            var track = new Connect(tracker, req, res);

            var headers = track.header();

            test.strictEqual(headers.host, 'www.yandex.ru:80');
            test.strictEqual(track.header('Host'), 'www.yandex.ru:80');

            res.end();

        }, function () {
            test.done();
        });
    },

    'Connect.prototype.cookie (empty)': function (test) {
        http({
            method: 'get',
            headers: {
                host: 'www.yandex.ru:80'
            }
        }, function (req, res) {

            var tracker = new Tracker();

            var track = new Connect(tracker, req, res);

            var cookie = track.cookie();

            test.deepEqual(cookie, {});
            test.strictEqual(track.cookie('name'), void 0);

            res.end();

        }, function () {
            test.done();
        });
    },

    'Connect.prototype.cookie-1': function (test) {
        http({
            method: 'get',
            headers: {
                host: 'www.yandex.ru:80',
                cookie: 'name=fist.server'
            }
        }, function (req, res) {

            var tracker = new Tracker();

            var track = new Connect(tracker, req, res);

            var cookie = track.cookie();

            test.deepEqual(cookie, {
                name: 'fist.server'
            });
            test.strictEqual(track.cookie('name'), 'fist.server');

            res.end();

        }, function () {
            test.done();
        });
    },

    'Connect.prototype.body': function (test) {
        http({
            method: 'post',
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            body: 'a=5'
        }, function (req, res) {

            var tracker = new Tracker();

            var track = new Connect(tracker, req, res);

            track.body(function (err, body) {
                test.ok(!err);
                test.deepEqual(body, {
                    input: {
                        a: '5'
                    },
                    files: {}
                });
            });

            track.body(function (err, body) {
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
        http({
            method: 'GET',
            headers: {
                'x-test': 'fist.server'
            }
        }, function (req, res) {
            var tracker = new Tracker();

            var track = new Connect(tracker, req, res);

            test.strictEqual(track.header('x-test'), 'fist.server');

            track.header({
                A: 'A',
                B: 'B'
            });

            track.header('A', 'O_O', true);
            track.header('Set-Cookie', 'name1=value1');
            track.header('Set-Cookie', 'name2=value2');

            track.send(200);

        }, function (err, data) {
            test.strictEqual(data.headers.a, 'A');
            test.strictEqual(data.headers.b, 'B');
            test.deepEqual(data.headers['set-cookie'],
                ['name1=value1', 'name2=value2']);
            test.done();
        });
    },

    'Connect.prototype.cookie': function (test) {

        var d;

        http({
            method: 'GET',
            headers: {
                'Cookie': 'first=' + encodeURIComponent('Привет1')
            }
        }, function (req, res) {
            var tracker = new Tracker();

            var track = new Connect(tracker, req, res);

            d = new Date();
            track.cookie('x', 'y');
            track.cookie('x', null, {});
            track.cookie('a', 'b');
            track.cookie('a', null);

            test.strictEqual(track.cookie('first'), 'Привет1');
            track.cookie('last', 'Привет');

            track.send(200);

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

        http({ method: 'GET' }, function (req, res) {
            var tracker = new Tracker();

            var track = new Connect(tracker, req, res);

            track.send();

        }, function (err, data) {
            test.strictEqual(data.data, 'OK');
            test.done();
        });
    },

    'Connect.prototype.send-1': function (test) {

        http({ method: 'GET' }, function (req, res) {
            var tracker = new Tracker();

            var track = new Connect(tracker, req, res);

            track.send(200);

        }, function (err, data) {
            test.strictEqual(data.data, 'OK');
            test.done();
        });
    },

    'Connect.prototype.send-2': function (test) {

        http({ method: 'GET' }, function (req, res) {
            var tracker = new Tracker();

            var track = new Connect(tracker, req, res);

            track.send(200, 'FIST');

        }, function (err, data) {
            test.strictEqual(data.data, 'FIST');
            test.done();
        });
    },

    'Connect.prototype.send-3': function (test) {

        http({ method: 'GET' }, function (req, res) {
            var tracker = new Tracker();

            var track = new Connect(tracker, req, res);

            track.send(200, buf);

        }, function (err, data) {
            test.strictEqual(data.data, String(buf));
            test.done();
        });
    },

    'Connect.prototype.send-4': function (test) {

        http({
            method: 'POST',
            body: buf
        }, function (req, res) {
            var tracker = new Tracker();

            var track = new Connect(tracker, req, res);

            track.send(200, req);

        }, function (err, data) {
            test.strictEqual(data.data, String(buf));
            test.done();
        });
    },

    'Connect.prototype.send-5': function (test) {

        http({
            method: 'POST',
            body: buf
        }, function (req, res) {
            var tracker = new Tracker();

            var track = new Connect(tracker, req, res);

            req.on('data', function () {
                req.emit('error', 'ERR');
            });

            track.send(200, req);

        }, function (err, data) {
            test.strictEqual(data.statusCode, 500);
            test.strictEqual(data.data, 'ERR');
            test.done();
        });
    },

    'Connect.prototype.send-6': function (test) {

        http({ method: 'GET' }, function (req, res) {
            var tracker = new Tracker();

            var track = new Connect(tracker, req, res);

            track.send(200, {a: 5});

        }, function (err, data) {
            test.strictEqual(data.data, '{"a":5}');
            test.done();
        });
    },

    'Connect.prototype.send-7': function (test) {

        http({ method: 'HEAD' }, function (req, res) {
            var tracker = new Tracker();

            var track = new Connect(tracker, req, res);

            track.send(200);

        }, function (err, data) {
            test.strictEqual(data.headers['content-length'], '2');
            test.strictEqual(data.data, '');
            test.done();
        });
    },

    'Connect.prototype.send-8': function (test) {

        http({ method: 'GET' }, function (req, res) {
            var tracker = new Tracker();

            var track = new Connect(tracker, req, res);

            track.header('x-content', 'fist.server');
            track.header('content-ok', 'boo');
            track.send(304, '123');

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

        http({ method: 'GET' }, function (req, res) {
            var tracker = new Tracker();

            var track = new Connect(tracker, req, res);

            track.send(200);
            track.send(500);

        }, function (err, data) {
            test.strictEqual(data.statusCode, 200);
            test.done();
        });
    },

    'Connect.prototype.send-10': function (test) {

        http({ method: 'HEAD' }, function (req, res) {
            var tracker = new Tracker();

            var track = new Connect(tracker, req, res);

            track.send(new Buffer('FIST-RESPONSE'));

        }, function (err, data) {
            test.strictEqual(data.statusCode, 200);
            test.strictEqual(data.data + '', '');

            test.done();
        });
    },

    'Connect.prototype.send-11': function (test) {

        http({ method: 'HEAD' }, function (req, res) {
            var tracker = new Tracker();

            var track = new Connect(tracker, req, res);

            track.send({
                OK: ':)'
            });

        }, function (err, data) {
            test.strictEqual(data.statusCode, 200);
            test.strictEqual(data.data + '', '');

            test.done();
        });
    },

    'Connect.prototype.send-12': function (test) {

        http({
            method: 'HEAD',
            body: 'asd'
        }, function (req, res) {
            var tracker = new Tracker();

            var track = new Connect(tracker, req, res);

            track.send(req);

        }, function (err, data) {
            test.strictEqual(data.statusCode, 200);
            test.strictEqual(data.data + '', '');

            test.done();
        });
    },

    'Connect.prototype.send-13': function (test) {

        http({
            method: 'HEAD',
            body: 'asd'
        }, function (req, res) {
            var tracker = new Tracker();

            req.on('data', function () {
                req.emit('error', 'ERR');
            });

            var track = new Connect(tracker, req, res);

            track.send(req);

        }, function (err, data) {
            test.strictEqual(data.statusCode, 500);
            test.strictEqual(data.data + '', '');

            test.done();
        });
    },

    'Connect.prototype.send-14': function (test) {

        http({
            method: 'GET',
            body: 'asd'
        }, function (req, res) {
            var tracker = new Tracker();

            var track = new Connect(tracker, req, res);

            track.header('Content-Length', '4');

            track.send(req);

        }, function (err, data) {
            test.strictEqual(data.statusCode, 200);
            test.strictEqual(data.headers['content-length'],  '4');
            test.strictEqual(data.data + '', 'asd');

            test.done();
        });
    },


    'Connect.prototype.send-15': function (test) {

        http({
            method: 'GET',
            body: 'asd'
        }, function (req, res) {
            var tracker = new Tracker();

            req.on('data', function () {
                req.emit('error', 'ERR');
            });

            var track = new Connect(tracker, req, res);

            track.header('Content-Length', '3');

            track.send(req);

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
