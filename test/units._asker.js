/*global describe, it */
'use strict';

var _ = require('lodash-node');
var assert = require('chai').assert;
var asker = require('asker');
var fist = require('../fist');
var inherit = require('inherit');
var sock = require('./util/sock');
var fs = require('fs');

var Unit = inherit(require('../core/unit'), {
    _callMethod: function (name, context) {

        return this[name](context);
    }
});

describe('units/_asker', function () {

    it('Should respond with expected value', function (done) {

        var app = fist(null, null, {
            Unit: Unit
        });

        app.route('/', 'front');
        app.route('/backend/', 'back');

        app.unit({
            path: 'front',
            deps: ['model'],
            data: function (context) {
                assert.ok(!context.getErr('model'));

                return context.track.send(context.getRes('model'));
            }
        });

        app.unit({
            path: 'model',
            base: '_asker',
            _$options: function (context) {

                return _.extend(this.__base(context), {
                    path: '/backend/',
                    socketPath: sock
                });
            }
        });

        app.unit({
            path: 'back',
            data: function (context) {

                return context.track.send({x: 42});
            }
        });

        try {
            fs.unlinkSync(sock);
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

        var app = fist(null, null, {
            Unit: Unit
        });

        app.route('/', 'front');
        app.route('/backend/', 'back');

        app.unit({
            path: 'front',
            deps: ['model'],
            data: function (context) {
                assert.ok(!context.getErr('model'));

                return context.track.send(context.getRes('model'));
            }
        });

        app.unit({
            path: 'model',
            base: '_asker',
            _$options: function (context) {

                return _.extend(this.__base(context), {
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
            data: function (context) {

                return context.track.send({x: 42});
            }
        });

        try {
            fs.unlinkSync(sock);
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

        var app = fist(null, null, {
            Unit: Unit
        });

        app.route('/', 'front');

        app.unit({
            path: 'front',
            deps: ['model'],
            data: function (context) {

                return context.track.send(context.getErr('model'));
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
            fs.unlinkSync(sock);
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

        var app = fist(null, null, {
            Unit: Unit
        });

        app.route('/', 'front');

        app.unit({
            path: 'front',
            deps: ['model'],
            data: function (context) {

                return context.track.send(context.getErr('model'));
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
            fs.unlinkSync(sock);
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

        var app = fist(null, null, {
            Unit: Unit
        });

        app.route('/', 'front');

        app.unit({
            path: 'front',
            deps: ['model'],
            data: function (context) {
                assert.ok(context.getErr('model'));

//                console.log(context.getErr('model'));
                throw context.getErr('model');
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
            fs.unlinkSync(sock);
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
