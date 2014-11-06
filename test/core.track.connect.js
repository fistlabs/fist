/*global describe, it*/
'use strict';

var STATUS_CODES = require('http').STATUS_CODES;

var Request = require('../core/track/request');
var Response = require('../core/track/response');

var _ = require('lodash-node');
var assert = require('chai').assert;
var doConnect = require('./util/connect');
var vow = require('vow');

describe('core/track/connect', function () {
    /*eslint max-nested-callbacks: [2, 5]*/
    it('Should be an instance of core/track/connect', function (done) {
        doConnect({
            method: 'POST'
        }, function (track, req, res) {
            assert.instanceOf(track.request, Request);
            assert.instanceOf(track.response, Response);
            assert.strictEqual(track.method, 'POST');
            assert.deepEqual(track.args, {});
            assert.strictEqual(track.route, null);
            assert.deepEqual(track.request.createUrl(req.url), track.url);
            res.end();
        }, function (err) {
            assert.ok(!err);
            done();
        });
    });

    describe('.buildPath', function () {
        it('Should build route url', function (done) {
            var tracker = /** @type Server */ doConnect({
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
        it('Should respond with default message and status', function (done) {
            doConnect({}, function (track, req, res) {
                vow.when(track.send(), function (resp) {
                    Response.end(res, resp);
                });
            }, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.statusCode, 200);
                assert.deepEqual(res.data, new Buffer(STATUS_CODES[200]));
                done();
            });
        });

        it('Should set status automatically', function (done) {
            doConnect({}, function (track, req, res) {
                vow.when(track.send(':)'), function (resp) {
                    Response.end(res, resp);
                });
            }, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.statusCode, 200);
                assert.deepEqual(res.data, new Buffer(':)'));
                done();
            });
        });

        it('Should send body with status', function (done) {
            doConnect({}, function (track, req, res) {
                vow.when(track.send(201), function (resp) {
                    Response.end(res, resp);
                });
            }, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.statusCode, 201);
                done();
            });
        });

        it('Should not overwrite status code', function (done) {
            doConnect({}, function (track, req, res) {
                var resp = track.send(201);
                vow.when(track.send(resp), function (resp) {
                    Response.end(res, resp);
                });
            }, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.statusCode, 201);
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
            }, function (track, req, res) {
                vow.when(track.redirect(301, '/test/'), function (resp) {
                    Response.end(res, resp);
                });
            }, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.statusCode, 301);
                assert.strictEqual(res.headers.location, '/test/');
                assert.deepEqual(res.data, new Buffer('/test/'));
                done();
            });
        });

        it('Should apply default redirect code if wrong', function (done) {
            doConnect({}, function (track, req, res) {
                vow.when(track.redirect(1, '/test/'), function (resp) {
                    Response.end(res, resp);
                });
            }, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.statusCode, 302);
                assert.strictEqual(res.headers.location, '/test/');
                done();
            });
        });

        it('Should apply default redirect code if omitted', function (done) {
            doConnect({}, function (track, req, res) {
                vow.when(track.redirect('/test/'), function (resp) {
                    Response.end(res, resp);
                });
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
            }, function (track, req, res) {
                vow.when(track.redirect('/test/'), function (resp) {
                    Response.end(res, resp);
                });
            }, function (err, res) {
                var url = _.escape('/test/');

                assert.ok(!err);
                assert.strictEqual(res.statusCode, 302);
                assert.strictEqual(res.headers.location, '/test/');
                assert.deepEqual(res.data, new Buffer('<a href="' + url + '">' +
                    url + '</a>'));

                done();
            });
        });
    });

    describe('.goToPath', function () {
        it('Should go to route path', function (done) {
            var tracker = /** @type {Server}*/ doConnect({

            }, function (track, req, res) {
                vow.when(track.goToPath('page', {
                    page: 'test'
                }), function (resp) {
                    Response.end(res, resp);
                });
            }, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.headers.location, '/test/');
                done();
            });
            tracker.route('/<page>/', 'page');
        });
    });
});
