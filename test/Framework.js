/*global describe, it*/
'use strict';

var Fs = require('fs');
var Router = require('finger/Router');

var asker = require('asker');
var assert = require('chai').assert;
var sock = require('./util/sock');

describe('fist/Framework', function () {

    var Framework = require('../Framework');

    it('Should be an instance of fist/Framework', function () {
        var framework = new Framework();
        assert.deepEqual(framework.renderers, {});
        assert.instanceOf(framework.router, Router);
    });

    describe('.route', function () {
        var framework = new Framework();

        framework.route('/', 'index');

        assert.deepEqual(framework.router.getRoute('index').data, {
            name: 'index',
            unit: 'index'
        });

        framework.route('/', {
            name: 'index'
        });

        assert.deepEqual(framework.router.getRoute('index').data, {
            name: 'index',
            unit: 'index'
        });

        framework.route('/', {
            name: 'index',
            unit: null
        });

        assert.deepEqual(framework.router.getRoute('index').data, {
            name: 'index',
            unit: 'index'
        });

        framework.route('/', {
            name: 'index',
            unit: 'unit'
        });

        assert.deepEqual(framework.router.getRoute('index').data, {
            name: 'index',
            unit: 'unit'
        });
    });

    it('Should respond after matching', function (done) {
        var framework = new Framework();

        framework.route('/', 'index');

        framework.unit({
            path: 'index',
            data: function (track) {

                return track.send(201);
            }
        });

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        framework.listen(sock);

        asker({
            path: '/',
            socketPath: sock
        }, function (err, res) {
            assert.ok(!err);
            assert.strictEqual(res.statusCode, 201);

            done();
        });
    });

    it('Should respond 500 if init failed', function (done) {

        var framework = new Framework();

        framework.plug(function () {

            throw 'ERR';
        });

        framework.route('/', 'index');

        framework.unit({
            path: 'index',
            data: function (track) {

                return track.send(201);
            }
        });

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        framework.listen(sock);

        asker({
            path: '/',
            socketPath: sock,
            statusFilter: function () {

                return {
                    accept: true
                };
            }
        }, function (err, res) {
            assert.ok(!err);
            assert.strictEqual(res.statusCode, 500);
            assert.deepEqual(res.data, new Buffer('ERR'));

            done();
        });
    });

    it('Should respond 404 if match failed', function (done) {
        var spy = [];
        var framework = new Framework();

        framework.route('/foo/');

        framework.on('sys:ematch', function () {
            spy.push(1);
        });

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        framework.listen(sock);

        asker({
            path: '/',
            socketPath: sock,
            statusFilter: function () {

                return {
                    accept: true
                };
            }
        }, function (err, res) {
            assert.ok(!err);
            assert.strictEqual(res.statusCode, 404);
            assert.deepEqual(spy, [1]);

            done();
        });
    });

    it('Should return 501 if method handler not implemented', function (done) {

        var spy = [];
        var framework = new Framework();

        framework.on('sys:ematch', function () {
            spy.push(1);
        });

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        framework.listen(sock);

        asker({
            path: '/',
            socketPath: sock,
            statusFilter: function () {

                return {
                    accept: true
                };
            }
        }, function (err, res) {
            assert.ok(!err);
            assert.strictEqual(res.statusCode, 501);
            assert.deepEqual(spy, [1]);

            done();
        });
    });

    it('Should return 405 if request method is not implemented for matched ' +
        'resource', function (done) {

        var spy = [];
        var framework = new Framework();

        framework.route('GET /foo/', 'foo');
        framework.route('POST /', 'upload');

        framework.on('sys:ematch', function () {
            spy.push(1);
        });

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        framework.listen(sock);

        asker({
            path: '/',
            socketPath: sock,
            statusFilter: function () {

                return {
                    accept: true
                };
            }
        }, function (err, res) {
            assert.ok(!err);
            assert.strictEqual(res.statusCode, 405);
            assert.strictEqual(res.headers.allow, 'POST');
            assert.deepEqual(spy, [1]);

            done();
        });
    });

    it('Should continue routing if controller has not sent', function (done) {

        var framework = new Framework();

        framework.route('/', 'preset');
        framework.route('/', 'index');

        framework.unit({
            path: 'preset',
            data: function (track) {
                track.url.query.role = 'admin';
            }
        });

        framework.unit({
            path: 'index',
            data: function (track) {
                assert.deepEqual(track.url.query, {
                    role: 'admin'
                });

                return track.send(201);
            }
        });

        try {
            Fs.unlinkSync(sock);

        } catch (err) {}

        framework.listen(sock);

        asker({
            path: '/',
            socketPath: sock
        }, function (err, res) {
            assert.ok(!err);
            assert.strictEqual(res.statusCode, 201);
            done();
        });
    });

    describe('rewrite', function () {
        it('Should rewrite the url', function (done) {

            var tracker = new Framework();

            tracker.route('/x/y/z/', 'rewrite');
            tracker.route('/<page>/', 'control');

            tracker.unit({
                path: 'rewrite',
                data: function (track) {

                    return track.rewrite('/<page>/', {
                        page: 'test',
                        a: 42
                    });
                }
            });

            tracker.unit({
                path: 'control',
                data: function (track, ctx) {
                    assert.strictEqual(ctx.arg('page'), 'test');
                    assert.strictEqual(track.url.path, '/test/?a=42');

                    return track.send(201);
                }
            });

            try {
                Fs.unlinkSync(sock);

            } catch (err) {}

            tracker.listen(sock);

            asker({
                path: '/x/y/z/',
                socketPath: sock
            }, function (err, res) {
                assert.ok(!err);
                assert.strictEqual(res.statusCode, 201);
                done();
            });
        });
    });

});
