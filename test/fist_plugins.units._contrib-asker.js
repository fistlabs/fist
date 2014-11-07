/*global describe, it */
'use strict';

var _ = require('lodash-node');
var assert = require('chai').assert;
var vowAsker = require('vow-asker');
var fist = require('../fist');
var sock = require('./util/sock');
var fs = require('fs');
var Rule = require('finger/core/rule');

function unlink() {

    try {
        fs.unlinkSync(sock);

        return true;
    } catch (err) {

        return false;
    }
}

describe('fist_plugins/units/_contrib-asker', function () {

    it('Should respond with expected value (0)', function (done) {
        var app = fist();
        var origServer;

        app.route('/', 'front');
        app.route('/backend/', 'back');

        app.unit({
            name: 'front',
            deps: ['model'],
            data: function (track, context) {
                assert.ok(!context.errors.get('model'));

                return context.track.send(context.result.get('model'));
            }
        });

        app.unit({
            name: 'model',
            base: '_contrib-asker',
            _$options: function (context) {

                return _.extend(this.__base(context), {
                    path: '/backend/',
                    socketPath: sock
                });
            }
        });

        app.unit({
            name: 'back',
            data: function (track, context) {

                return context.track.send({x: 42});
            }
        });

        unlink();

        origServer = app.listen(sock);

        vowAsker({
            path: '/',
            socketPath: sock
        }).done(function (res) {
            assert.deepEqual(res.data, new Buffer('{"x":42}'));
            origServer.close();
            done();
        });
    });

    it('Should respond with expected value (1)', function (done) {

        var app = fist();
        var origServer;

        app.route('/', 'front');
        app.route('/backend/', 'back');

        app.unit({
            name: 'front',
            deps: ['model'],
            data: function (track, context) {
                assert.ok(!context.errors.get('model'));

                return context.track.send(context.result.get('model'));
            }
        });

        app.unit({
            name: 'model',
            base: '_contrib-asker',
            _$options: function (context) {

                return _.extend(this.__base(context), {
                    path: new Rule('/<token>/'),
                    socketPath: sock,
                    vars: {
                        token: 'backend'
                    }
                });
            }
        });

        app.unit({
            name: 'back',
            data: function (track, context) {

                return context.track.send({x: 42});
            }
        });

        unlink();

        origServer = app.listen(sock);

        vowAsker({
            path: '/',
            socketPath: sock
        }).done(function (res) {
            assert.deepEqual(res.data, new Buffer('{"x":42}'));
            origServer.close();
            done();
        });
    });

    it('Should respond with expected value (2)', function (done) {
        var app = fist();
        var origServer;

        app.route('/', 'front');

        app.unit({
            name: 'front',
            deps: ['model'],
            data: function (track, context) {

                return context.track.send(context.errors.get('model'));
            }
        });

        app.unit({
            name: 'model',
            base: '_contrib-asker',
            _$request: function () {

                throw 42;
            }
        });

        unlink();

        origServer = app.listen(sock);

        vowAsker({
            path: '/',
            socketPath: sock,
            statusFilter: function () {

                return {
                    accept: true
                };
            }

        }).done(function (res) {
            assert.deepEqual(res.data, new Buffer('42'));
            origServer.close();
            done();
        });
    });

    it('Should respond with expected value (3)', function (done) {

        var app = fist();
        var origServer;

        app.route('/', 'front');

        app.unit({
            name: 'front',
            deps: ['model'],
            data: function (track, context) {

                return context.track.send(context.errors.get('model'));
            }
        });

        app.unit({
            name: 'model',
            base: '_contrib-asker',
            _$request: function () {

                throw 42;
            }
        });

        unlink();

        origServer = app.listen(sock);

        vowAsker({
            path: '/',
            socketPath: sock,
            statusFilter: function () {

                return {
                    accept: true
                };
            }

        }).done(function (res) {
            assert.deepEqual(res.data, new Buffer('42'));
            origServer.close();
            done();
        });
    });

    it('Should respond with expected value (4)', function (done) {

        var app = fist();
        var origServer;

        app.route('/', 'front');

        app.unit({
            name: 'front',
            deps: ['model'],
            data: function (track, context) {
                assert.ok(context.getErr('model'));

                throw context.getErr('model');
            }
        });

        app.unit({
            name: 'model',
            base: '_contrib-asker',
            _$options: function () {

                return {
                    path: '/foo-bar/',
                    sock: sock
                };
            }
        });

        unlink();

        origServer = app.listen(sock);

        vowAsker({
            path: '/',
            socketPath: sock
        }).done(null, function (err) {
            assert.ok(err);
            origServer.close();
            done();
        });
    });

});
