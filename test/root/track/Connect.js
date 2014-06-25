'use strict';

var Req = require('../../../req/Req');
var Res = require('../../../res/Res');
var Tracker = require('../../../Framework');
var Connect = require('../../../track/Connect');
var doConnect = require('../../util/connect');

var _ = require('lodash-node');

module.exports = {
    Connect: [
        function (test) {
            doConnect({
                method: 'POST'
            }, function (track, req, res) {
                test.ok(track.req instanceof Req);
                test.ok(track.res instanceof Res);
                test.strictEqual(track.method, 'POST');
                test.deepEqual(track.match, {});
                test.strictEqual(track.route, null);
                test.deepEqual(track.req.getUrl(), track.url);
                res.end();
            }, function (err) {
                test.ok(!err);
                test.done();
            });
        }
    ],
    'Connect.prototype.arg': [
        function (test) {
            doConnect({
                path: '/',
                query: {
                    a: '5'
                }
            }, function (track, req, res) {
                test.strictEqual(track.arg('a'), '5');
                test.strictEqual(track.arg('a', true), void 0);
                track.match.a = '6';
                test.strictEqual(track.arg('a'), '6');
                res.end();
            }, function (err) {
                test.ok(!err);
                test.done();
            });
        }
    ],
    'Connect.prototype.send': [
        function (test) {
            doConnect({}, function (track) {
                track.send(201);
            }, function (err, res) {
                test.ok(!err);
                test.strictEqual(res.statusCode, 201);
                test.done();
            });
        },
        function (test) {
            doConnect({}, function (track) {
                track.send(':)');
            }, function (err, res) {
                test.ok(!err);
                test.strictEqual(res.statusCode, 200);
                test.deepEqual(res.data, new Buffer(':)'));
                test.done();
            });
        }
    ],
    'Connect.prototype.body': [
        function (test) {
            doConnect({
                path: '/',
                body: 'TEST',
                method: 'POST'
            }, function (track, req, res) {

                track.body().then(function (body) {
                    test.deepEqual(body.input, new Buffer('TEST'));
                    res.end();
                });

            }, function (err) {
                test.ok(!err);
                test.done();
            });
        },
        function (test) {
            doConnect({}, function (track) {
                track.body(':)');
            }, function (err, res) {
                test.ok(!err);
                test.deepEqual(res.data, new Buffer(':)'));
                test.done();
            });
        }
    ],
    'Connect.prototype.buildPath': [
        function (test) {
            var tracker = /** @type Framework */ doConnect({
                path: '/test/'
            }, function (track, req, res) {
                test.strictEqual(track.buildPath('page', {
                    page: 'test2'
                }), '/test2/');
                res.end();
            }, function (err) {
                test.ok(!err);
                test.done();
            });
            tracker.route('/<page>/', 'page');
        }
    ],
    'Connect.prototype.header': [
        function (test) {
            doConnect({
                headers: {
                    foo: 'bar'
                }
            }, function (track, req, res) {
                test.strictEqual(track.header('foo'), 'bar');
                test.strictEqual(track.header().foo, 'bar');
                track.header('test', 'ok');
                track.header({
                    test: 'ok2',
                    bar: 'zot'
                }, true);
                res.end();
            }, function (err, res) {
                test.ok(!err);
                test.strictEqual(res.headers.test, 'ok');
                test.strictEqual(res.headers.bar, 'zot');
                test.done();
            });
        }
    ],
    'Connect.prototype.cookie': [
        function (test) {
            doConnect({
                headers: {
                    Cookie: 'name=value'
                }
            }, function (track, req, res) {
                test.strictEqual(track.cookie().name, 'value');
                test.strictEqual(track.cookie('name'), 'value');
                track.cookie('name', 'value');
                res.end();
            }, function (err, res) {
                test.ok(!err);
                test.deepEqual(res.headers['set-cookie'], ['name=value']);
                test.done();
            });
        }
    ],
    'Connect.prototype.status': [
        function (test) {
            doConnect({}, function (track, req, res) {
                track.status(201);
                test.strictEqual(track.status(), 201);
                res.end();
            }, function (err, res) {
                test.ok(!err);
                test.strictEqual(res.statusCode, 201);
                test.done();
            });
        }
    ],
    'Connect.prototype.redirect': [
        function (test) {
            doConnect({}, function (track) {
                track.redirect(301, '/test/');
            }, function (err, res) {
                test.ok(!err);
                test.strictEqual(res.statusCode, 301);
                test.strictEqual(res.headers.location, '/test/');
                test.deepEqual(res.data, new Buffer('/test/'));
                test.done();
            });
        },
        function (test) {
            doConnect({}, function (track) {
                track.redirect(1, '/test/');
            }, function (err, res) {
                test.ok(!err);
                test.strictEqual(res.statusCode, 302);
                test.strictEqual(res.headers.location, '/test/');
                test.deepEqual(res.data, new Buffer('/test/'));
                test.done();
            });
        },
        function (test) {
            doConnect({}, function (track) {
                track.redirect('/test/');
            }, function (err, res) {
                test.ok(!err);
                test.strictEqual(res.statusCode, 302);
                test.strictEqual(res.headers.location, '/test/');
                test.deepEqual(res.data, new Buffer('/test/'));
                test.done();
            });
        },
        function (test) {
            doConnect({}, function (track) {
                track.header('Content-Type', 'text/html');
                track.redirect('/test/');
            }, function (err, res) {

                var url;

                test.ok(!err);
                test.strictEqual(res.statusCode, 302);
                test.strictEqual(res.headers.location, '/test/');
                url = _.escape('/test/');
                test.deepEqual(res.data, new Buffer('<a href="' + url + '">' +
                    url + '</a>'));
                test.done();
            });
        },
        function (test) {
            doConnect({}, function (track) {
                track.header('Content-Type', 'text/plain');
                track.redirect('/test/');
            }, function (err, res) {
                test.ok(!err);
                test.strictEqual(res.statusCode, 302);
                test.strictEqual(res.headers.location, '/test/');
                test.deepEqual(res.data, new Buffer('/test/'));
                test.done();
            });
        }
    ],
    'Connect.prototype.goToPath': [
        function (test) {
            var tracker = /** @type {Framework}*/ doConnect({

            }, function (track) {
                track.goToPath('page', {
                    page: 'test'
                });
            }, function (err, res) {
                test.ok(!err);
                test.strictEqual(res.headers.location, '/test/');
                test.deepEqual(res.data, new Buffer('/test/'));
                test.done();
            });
            tracker.route('/<page>/', 'page');
        }
    ],
    'Connect.prototype.render': [
        function (test) {
            var tracker = /** @type {Framework} */ doConnect({

            }, function (track) {
                track.render('test', {
                    name: 'spacy'
                });
            }, function (err, res) {
                test.ok(!err);
                test.deepEqual(res.data, new Buffer('Name spacy'));
                test.strictEqual(res.statusCode, 200);
                test.done();
            });
            tracker.renderers.test = function (data) {

                return 'Name ' + data.name;
            };
        },
        function (test) {
            var tracker = /** @type {Framework} */ doConnect({

            }, function (track) {
                track.render(201, 'test', {
                    name: 'spacy'
                });
            }, function (err, res) {
                test.ok(!err);
                test.deepEqual(res.data, new Buffer('Name spacy'));
                test.strictEqual(res.statusCode, 201);
                test.done();
            });
            tracker.renderers.test = function (data) {

                return 'Name ' + data.name;
            };
        }
    ]
};
