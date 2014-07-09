/*global describe, it */
'use strict';

var _ = require('lodash-node');
var assert = require('chai').assert;
var asker = require('asker');
var fist = require('../fist');
var sock = require('./util/sock');
var Fs = require('fs');

describe('fist/unit/decl/_asker', function () {

    it('Should respond with expected value', function (done) {

        var app = fist({
            routes: [
                {
                    pattern: '/',
                    name: 'front'
                },
                {
                    pattern: '/backend/',
                    name: 'back'
                }
            ]
        });

        app.unit({
            path: 'front',
            deps: ['model'],
            data: function (track, ctx) {
                assert.ok(!ctx.ers.model);

                return track.send(ctx.res.model);
            }
        });

        app.unit({
            path: 'model',
            base: '_asker',
            _$options: function (track, ctx) {

                return _.extend(this.__base(track, ctx), {
                    path: '/backend/',
                    socketPath: sock
                });
            }
        });

        app.unit({
            path: 'back',
            data: function (track) {

                return track.send({x: 42});
            }
        });

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        app.listen(sock);

        asker({
            path: '/',
            socketPath: sock
        }, function (err, res) {
            assert.ok(!err);
            assert.deepEqual(res.data, new Buffer('{"x":42}'));
            done();
        });
    });

    it('Should respond with expected value', function (done) {

        var app = fist({
            routes: [
                {
                    pattern: '/',
                    name: 'front'
                },
                {
                    pattern: '/backend/',
                    name: 'back'
                }
            ]
        });

        app.unit({
            path: 'front',
            deps: ['model'],
            data: function (track, ctx) {
                assert.ok(!ctx.ers.model);

                return track.send(ctx.res.model);
            }
        });

        app.unit({
            path: 'model',
            base: '_asker',
            _$options: function (track, ctx) {

                return _.extend(this.__base(track, ctx), {
                    path: '/<token>/',
                    socketPath: sock,
                    vars: {
                        token: 'backend'
                    }
                });
            }
        });

        app.unit({
            path: 'back',
            data: function (track) {

                return track.send({x: 42});
            }
        });

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        app.listen(sock);

        asker({
            path: '/',
            socketPath: sock
        }, function (err, res) {
            assert.ok(!err);
            assert.deepEqual(res.data, new Buffer('{"x":42}'));
            done();
        });
    });

    it('Should respond with expected value', function (done) {

        var app = fist({
            routes: [
                {
                    pattern: '/',
                    name: 'front'
                }
            ]
        });

        app.unit({
            path: 'front',
            deps: ['model'],
            data: function (track, ctx) {

                return track.send(ctx.ers.model);
            }
        });

        app.unit({
            path: 'model',
            base: '_asker',
            _$request: function () {

                throw 42;
            }
        });

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        app.listen(sock);

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
            assert.deepEqual(res.data, new Buffer('42'));
            done();
        });
    });

    it('Should respond with expected value', function (done) {

        var app = fist({
            routes: [
                {
                    pattern: '/',
                    name: 'front'
                }
            ]
        });

        app.unit({
            path: 'front',
            deps: ['model'],
            data: function (track, ctx) {

                return track.send(ctx.ers.model);
            }
        });

        app.unit({
            path: 'model',
            base: '_asker',
            _$request: function () {

                throw 42;
            }
        });

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        app.listen(sock);

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
            assert.deepEqual(res.data, new Buffer('42'));
            done();
        });
    });

    it('Should respond with expected value', function (done) {

        var app = fist({
            routes: [
                {
                    pattern: '/',
                    name: 'front'
                }
            ]
        });

        app.unit({
            path: 'front',
            deps: ['model'],
            data: function (track, ctx) {
                assert.ok(ctx.ers.model);

                throw ctx.ers.model;
            }
        });

        app.unit({
            path: 'model',
            base: '_asker',
            _$options: function () {

                return {
                    path: '/foo-bar/',
                    sock: sock
                };
            }
        });

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        app.listen(sock);

        asker({
            path: '/',
            socketPath: sock
        }, function (err) {
            assert.ok(err);
            done();
        });
    });

});
