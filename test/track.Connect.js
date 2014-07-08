/*global describe, it*/
'use strict';

var Req = require('../req/Req');
var Res = require('../res/Res');
var doConnect = require('./util/connect');

var _ = require('lodash-node');
var assert = require('chai').assert;

describe('fist/track/Connect', function () {
    /*eslint max-nested-callbacks: [2, 5]*/
    it('Should be an instance of Connect', function (done) {
        doConnect({
            method: 'POST'
        }, function (track, req, res) {
            assert.instanceOf(track.req, Req);
            assert.instanceOf(track.res, Res);
            assert.strictEqual(track.method, 'POST');
            assert.deepEqual(track.match, {});
            assert.strictEqual(track.route, null);
            assert.deepEqual(track.req.getUrl(), track.url);
            res.end();
        }, function (err) {
            assert.ok(!err);

            done();
        });
    });

    describe('.arg', function () {
        it('Should return request argument value', function (done) {
            doConnect({
                path: '/',
                query: {
                    a: '5'
                }
            }, function (track, req, res) {
                assert.strictEqual(track.arg('a'), '5');
                assert.isUndefined(track.arg('a', true));
                track.match.a = '6';
                assert.strictEqual(track.arg('a'), '6');
                res.end();
            }, function (err) {
                assert.ok(!err);
                done();
            });
        });
    });

    describe('.buildPath', function () {
        it('Should build route url', function (done) {
            var tracker = /** @type Framework */ doConnect({
                path: '/test/'
            }, function (track, req, res) {
                assert.strictEqual(track.buildPath('page', {
                    page: 'test2'
                }), '/test2/');
                res.end();
            }, function (err) {
                assert.ok(!err);
                done();
            });
            tracker.route('/<page>/', 'page');
        });
    });

    describe('.header', function () {
        it('Should set res header and get req header', function (done) {
            doConnect({
                headers: {
                    foo: 'bar'
                }
            }, function (track, req, res) {
                assert.strictEqual(track.header('foo'), 'bar');
                assert.strictEqual(track.header().foo, 'bar');
                track.header('test', 'ok');
                track.header({
                    test: 'ok2',
                    bar: 'zot'
                }, true);
                res.end();
            }, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.headers.test, 'ok');
                assert.strictEqual(res.headers.bar, 'zot');
                done();
            });
        });
    });

    describe('.cookie', function () {
        it('Should set res cookie and get req cookie', function (done) {
            doConnect({
                headers: {
                    Cookie: 'name=value'
                }
            }, function (track, req, res) {
                assert.strictEqual(track.cookie().name, 'value');
                assert.strictEqual(track.cookie('name'), 'value');
                track.cookie('name', 'value');
                res.end();
            }, function (err, res) {
                assert.ok(!err);
                assert.deepEqual(res.headers['set-cookie'], ['name=value']);
                done();
            });
        });
    });

    describe('.send', function () {
        it('Should set status automatically', function (done) {
            doConnect({}, function (track) {
                track.send(':)');
            }, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.statusCode, 200);
                assert.deepEqual(res.data, new Buffer(':)'));
                done();
            });
        });

        it('Should send body with status', function (done) {
            doConnect({}, function (track) {
                track.send(201);
            }, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.statusCode, 201);
                done();
            });
        });
    });

    describe('.body', function () {
        it('Should download body', function (done) {
            doConnect({
                path: '/',
                body: 'TEST',
                method: 'POST'
            }, function (track, req, res) {

                track.body().then(function (body) {
                    assert.deepEqual(body.input, new Buffer('TEST'));
                    res.end();
                });

            }, function (err) {
                assert.ok(!err);
                done();
            });
        });

        it('Should send body', function (done) {
            doConnect({}, function (track) {
                track.body(':)');
            }, function (err, res) {
                assert.ok(!err);
                assert.deepEqual(res.data, new Buffer(':)'));
                done();
            });
        });
    });

    describe('.redirect', function () {
        it('Should redirect with code', function (done) {
            doConnect({
                headers: {
                    accept: 'text/plain'
                }
            }, function (track) {
                track.header('content-type', 'text/plain');
                track.redirect(301, '/test/');
            }, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.statusCode, 301);
                assert.strictEqual(res.headers.location, '/test/');
                assert.deepEqual(res.data, new Buffer('/test/'));
                done();
            });
        });

        it('Should apply default redirect code if wrong', function (done) {
            doConnect({}, function (track) {
                track.redirect(1, '/test/');
            }, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.statusCode, 302);
                assert.strictEqual(res.headers.location, '/test/');
                done();
            });
        });

        it('Should apply default redirect code if omitted', function (done) {
            doConnect({}, function (track) {
                track.redirect('/test/');
            }, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.statusCode, 302);
                assert.strictEqual(res.headers.location, '/test/');
                done();
            });
        });

        it('Should render hyperlink if accepts', function (done) {
            doConnect({
                headers: {
                    accept: 'text/html'
                }
            }, function (track) {
                track.redirect('/test/');
            }, function (err, res) {

                var url;

                assert.ok(!err);
                assert.strictEqual(res.statusCode, 302);
                assert.strictEqual(res.headers.location, '/test/');
                url = _.escape('/test/');
                assert.deepEqual(res.data, new Buffer('<a href="' + url + '">' +
                    url + '</a>'));

                done();
            });
        });
    });

    describe('.goToPath', function () {
        it('Should go to route path', function (done) {
            var tracker = /** @type {Framework}*/ doConnect({

            }, function (track) {
                track.goToPath('page', {
                    page: 'test'
                });
            }, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.headers.location, '/test/');
                done();
            });
            tracker.route('/<page>/', 'page');
        });
    });

    describe('.render', function () {

        it('Should render response by template', function (done) {
            var tracker = /** @type {Framework} */ doConnect({

            }, function (track) {
                track.render('test', {
                    name: 'spacy'
                });
            }, function (err, res) {
                assert.ok(!err);
                assert.deepEqual(res.data, new Buffer('Name spacy'));
                assert.strictEqual(res.statusCode, 200);

                done();
            });
            tracker.renderers.test = function (data) {

                return 'Name ' + data.name;
            };
        });

        it('Should render response by template with code', function (done) {
            var tracker = /** @type {Framework} */ doConnect({

            }, function (track) {
                track.render(201, 'test', {
                    name: 'spacy'
                });
            }, function (err, res) {
                assert.ok(!err);
                assert.deepEqual(res.data, new Buffer('Name spacy'));
                assert.strictEqual(res.statusCode, 201);

                done();
            });
            tracker.renderers.test = function (data) {

                return 'Name ' + data.name;
            };
        });
    });
});
