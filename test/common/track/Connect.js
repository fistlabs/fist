'use strict';

var Tracker = require('../../../Framework');
var Connect = require('../../../track/Connect');
var connect = require('../../util/connect');
var ContentType = require('../../../util/ContentType');

var Fs = require('fs');
var Url = require('url');
var buf = Fs.readFileSync('test/util/binary.png');
var asker = require('asker');
var sock = require('../../stuff/sock');

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
                t.body(function (err) {
                    test.ok(err);
                    test.strictEqual(err.code, 'ELIMIT');
                    res.end();
                });
            }, function () {
                test.done();
            }, {
                body: {
                    limit: 2
                }
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
                t.send(200);
                t.send(500);
            }, function (err, data) {
                test.strictEqual(data.statusCode, 200);
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
//                TODO
//                test.strictEqual(data.headers['content-type'], 'text/plain');
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
        },
        function (test) {

            var fist = new Tracker();
            var er = new Error();

            fist.route('GET', '/', 'index');

            fist.decl('index', function (track) {
                track.send(500, er);
            });

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            fist.listen(sock);

            asker({
                method: 'GET',
                socketPath: sock,
                path: '/',
                statusFilter: function () {

                    return {
                        accept: true
                    };
                }
            }, function (err, data) {
                test.strictEqual(data.data + '', er.stack);
                test.strictEqual(data.statusCode, 500);
                test.done();
            });
        },
        function (test) {

            var fist = new Tracker({
                staging: true
            });
            var er = new Error();

            fist.route('GET', '/', 'index');

            fist.decl('index', function (track) {
                track.send(500, er);
            });

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            fist.listen(sock);

            asker({
                method: 'GET',
                socketPath: sock,
                path: '/',
                statusFilter: function () {

                    return {
                        accept: true
                    };
                }
            }, function (err, data) {
                test.strictEqual(data.data + '', 'Internal Server Error');
                test.strictEqual(data.statusCode, 500);
                test.done();
            });
        },
        function (test) {

            var fist = new Tracker();
            var er = new Error();

            fist.route('GET', '/', 'index');

            fist.decl('index', function (track) {
                track.send(200, er);
            });

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            fist.listen(sock);

            asker({
                method: 'GET',
                socketPath: sock,
                path: '/',
                statusFilter: function () {

                    return {
                        accept: true
                    };
                }
            }, function (err, data) {
                test.strictEqual(data.data + '', '{}');
                test.strictEqual(data.statusCode, 200);
                test.done();
            });
        }
    ],

    'Connect.prototype.mime': [
        function (test) {
            connect({
                headers: {
                    'Content-Type': 'text/plain; param=42;'
                },
                method: 'get'
            }, function (t, req, res) {
                var mime = t.mime();
                test.strictEqual(mime, t.mime());
                test.strictEqual(mime.toString(), 'text/plain;param=42');
                t.mime('text/html; charset=UTF-8', {
                    charset: 'UTF-16'
                });
                res.end();
            }, function (err, res) {
                test.strictEqual(res.headers['content-type'],
                    'text/html;charset=UTF-16');
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
    ],

    'Connect.prototype.arg': [
        function (test) {

            var fist = new Tracker();

            fist.route('GET', '/<page=about>/(<sub>)', 'index');

            fist.decl('index', function (track) {
                test.strictEqual(track.arg('page', true), 'about');
                test.strictEqual(track.arg('sub'), '80');
                track.send(200);
            });

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            fist.listen(sock);

            asker({
                method: 'GET',
                socketPath: sock,
                path: '/about/?page=index&sub=80'
            }, function (err, data) {
                test.ok(data);
                test.strictEqual(data.statusCode, 200);
                test.done();
            });
        }
    ],

    'Connect.prototype.buildPath': [
        function (test) {

            var fist = new Tracker();

            fist.route('GET', '/(<pageName>/)', 'url');

            fist.decl('url', function (track, errors, result, done) {
                done(null, track.buildPath('url', {
                    pageName: 'about',
                    text: 'test'
                }));
            });

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            fist.listen(sock);

            asker({
                method: 'GET',
                socketPath: sock,
                path: '/'
            }, function (err, data) {
                test.strictEqual(data.data + '', '/about/?text=test');
                test.done();
            });
        }
    ],

    'Connect.prototype.render': [
        function (test) {

            var fist = new Tracker();

            fist.plug(function (done) {
                this.renderers.index = function () {
                    return [].slice.call(arguments, 0).map(function (v) {

                        return v * 2;
                    });
                };

                done(null, null);
            });

            fist.decl('index', function (track) {
                track.status(300);
                track.render('index', 1, 2, 3);
            });

            fist.route('GET', '/', 'index');

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            fist.listen(sock);

            asker({
                method: 'GET',
                socketPath: sock,
                path: '/',
                statusFilter: function () {

                    return {
                        accept: true
                    };
                }
            }, function (err, data) {
                test.deepEqual(data.data, new Buffer('[2,4,6]'));
                test.strictEqual(data.statusCode, 300);
                test.done();
            });
        },
        function (test) {

            var fist = new Tracker();

            fist.plug(function (done) {
                this.renderers.index = function () {
                    return [].slice.call(arguments, 0).map(function (v) {

                        return v * 2;
                    });
                };

                done(null, null);
            });

            fist.decl('index', function (track) {
                track.render(201, 'index', 1, 2, 3);
            });

            fist.route('GET', '/', 'index');

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            fist.listen(sock);

            asker({
                method: 'GET',
                socketPath: sock,
                path: '/',
                statusFilter: function () {

                    return {
                        accept: true
                    };
                }
            }, function (err, data) {
                test.deepEqual(data.data, new Buffer('[2,4,6]'));
                test.strictEqual(data.statusCode, 201);
                test.done();
            });
        }
    ],

    'Connect.prototype.redirect': [
        function (test) {
            var fist = new Tracker();

            fist.decl('index', function (track) {
                track.redirect('/about/');
            });

            fist.route('GET', '/', 'index');

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            fist.listen(sock);

            asker({
                method: 'GET',
                socketPath: sock,
                path: '/',
                statusFilter: function () {

                    return {
                        accept: true
                    };
                }
            }, function (err, data) {
                test.deepEqual(data.data, new Buffer('/about/'));
                test.strictEqual(data.statusCode, 302);
                test.strictEqual(data.headers.location, '/about/');
                test.done();
            });
        },
        function (test) {
            var fist = new Tracker();

            fist.decl('index', function (track) {
                track.header('Content-Type', 'text/html; charset=UTF-8');
                track.redirect('/test/?a=5&b=6');
            });

            fist.route('GET', '/', 'index');

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            fist.listen(sock);

            asker({
                method: 'GET',
                socketPath: sock,
                path: '/',
                statusFilter: function () {

                    return {
                        accept: true
                    };
                }
            }, function (err, data) {
                test.deepEqual(data.data, new Buffer('<a href="' +
                    '/test/?a=5&amp;b=6">/test/?a=5&amp;b=6</a>'));
                test.strictEqual(data.statusCode, 302);
                test.strictEqual(data.headers.location, '/test/?a=5&b=6');
                test.done();
            });
        },

        function (test) {
            var fist = new Tracker();

            fist.decl('index', function (track) {
                track.redirect(301, '/about/');
            });

            fist.route('GET', '/', 'index');

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            fist.listen(sock);

            asker({
                method: 'GET',
                socketPath: sock,
                path: '/',
                statusFilter: function () {

                    return {
                        accept: true
                    };
                }
            }, function (err, data) {
                test.deepEqual(data.data, new Buffer('/about/'));
                test.strictEqual(data.statusCode, 301);
                test.strictEqual(data.headers.location, '/about/');
                test.done();
            });
        },

        function (test) {
            var fist = new Tracker();

            fist.decl('index', function (track) {
                track.redirect(333, '/about/');
            });

            fist.route('GET', '/', 'index');

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            fist.listen(sock);

            asker({
                method: 'GET',
                socketPath: sock,
                path: '/',
                statusFilter: function () {

                    return {
                        accept: true
                    };
                }
            }, function (err, data) {
                test.deepEqual(data.data, new Buffer('/about/'));
                test.strictEqual(data.statusCode, 302);
                test.strictEqual(data.headers.location, '/about/');
                test.done();
            });
        }
    ],
    'Connect.prototype.goToPath': [
        function (test) {
            var fist = new Tracker();

            fist.decl('index', function (track) {
                track.goToPath('post', {
                    postId: 666
                });
            });

            fist.route('GET', '/', 'index');
            fist.route('GET', '/post/<postId>/', 'post');

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            fist.listen(sock);

            asker({
                method: 'GET',
                socketPath: sock,
                path: '/',
                statusFilter: function () {

                    return {
                        accept: true
                    };
                }
            }, function (err, data) {
                test.deepEqual(data.data, new Buffer('/post/666/'));
                test.strictEqual(data.statusCode, 302);
                test.strictEqual(data.headers.location, '/post/666/');
                test.done();
            });
        }
    ]

};
