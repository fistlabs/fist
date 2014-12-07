/*eslint max-nested-callbacks: 0*/
/*global describe, it*/
'use strict';

var Server = require('../core/server');

var assert = require('assert');
var supertest = require('supertest');
var fs = require('fs');
var path = require('path');

function getAgent(params) {
    var agent = new Server(params);
    agent.install(require.resolve('../fist_plugins/units/fist_contrib_unit_incoming'));
    agent.install(require.resolve('../fist_plugins/units/_fist_contrib_unit'));
    agent.alias('fist_contrib_unit_incoming', 'body');
    return agent;
}

describe('fist_plugins/units/fist_contrib_unit_incoming', function () {

    it('Should parse raw body', function (done) {
        var back = getAgent({
            name: 'uploader',
            implicitBase: '_fist_contrib_unit'
        });

        back.route('POST /upload/', {
            name: 'upload',
            unit: 'test'
        });

        back.unit({
            name: 'test',
            deps: ['body'],
            main: function (track, context) {
                var body = context.result.get('body');
                assert.strictEqual(body.type, 'raw');
                assert.deepEqual(body.input, new Buffer('foo'));

                track.send('bar');
            }
        });

        var req = supertest(back.getHandler()).post('/upload/');

        req.
            set('Content-Type', 'application/octet-stream').
            send('foo').
            expect(200).
            expect('bar').
            end(done);
    });

    it('Should parse json body', function (done) {
        var back = getAgent({
            name: 'uploader',
            implicitBase: '_fist_contrib_unit'
        });

        back.route('POST /upload/', {
            name: 'upload',
            unit: 'test'
        });

        back.unit({
            name: 'test',
            deps: ['body'],
            main: function (track, context) {
                var body = context.result.get('body');
                assert.strictEqual(body.type, 'json');
                assert.deepEqual(body.input, {foo: 'bar'});

                track.send('bar');
            }
        });

        var req = supertest(back.getHandler()).post('/upload/');

        req.
            set('Content-Type', 'application/json').
            send('{"foo": "bar"}').
            expect(200).
            expect('bar').
            end(done);
    });

    it('Should parse text body', function (done) {
        var back = getAgent({
            name: 'uploader',
            implicitBase: '_fist_contrib_unit'
        });

        back.route('POST /upload/', {
            name: 'upload',
            unit: 'test'
        });

        back.unit({
            name: 'test',
            deps: ['body'],
            main: function (track, context) {
                var body = context.result.get('body');
                assert.strictEqual(body.type, 'text');
                assert.deepEqual(body.input, 'foo');

                track.send('bar');
            }
        });

        var req = supertest(back.getHandler()).post('/upload/');

        req.
            set('Content-Type', 'text/plain').
            send('foo').
            expect(200).
            expect('bar').
            end(done);
    });

    it('Should be failed on body parsing', function (done) {
        var spy = 0;
        var back = getAgent({
            name: 'uploader',
            implicitBase: '_fist_contrib_unit'
        });

        back.route('POST /upload/', {
            name: 'upload',
            unit: 'test'
        });

        back.unit({
            name: 'test',
            deps: ['body'],
            main: function (track) {
                spy = 42;
                track.send('bar');
            }
        });

        var req = supertest(back.getHandler()).post('/upload/');

        req.
            set('Content-Type', 'application/octet-stream; charset=asdasd').
            send('foo').
            expect(415).
            end(function (err) {
                assert.strictEqual(spy, 0);
                done(err);
            });
    });

    it('Should parse urlencoded body', function (done) {
        var back = getAgent({
            name: 'uploader',
            implicitBase: '_fist_contrib_unit'
        });

        back.route('POST /upload/', {
            name: 'upload',
            unit: 'test'
        });

        back.unit({
            name: 'test',
            deps: ['body'],
            main: function (track, context) {
                var body = context.result.get('body');
                assert.strictEqual(body.type, 'urlencoded');
                assert.deepEqual(body.input, {foo: ['bar', '1', '2'], bar: 'baz'});
                track.send('bar');
            }
        });

        var req = supertest(back.getHandler()).post('/upload/');

        req.
            send('foo=bar&bar=baz&foo=1&foo=2').
            set('Content-Type', 'application/x-www-form-urlencoded').
            expect(200).
            expect('bar').
            end(done);
    });

    it('Should parse multipart body', function (done) {
        var back = getAgent({
            name: 'uploader',
            implicitBase: '_fist_contrib_unit'
        });

        back.route('POST /upload/', {
            name: 'upload',
            unit: 'test'
        });

        back.unit({
            name: 'test',
            deps: ['body'],
            main: function (track, context) {
                var body = context.result.get('body');
                assert.strictEqual(body.type, 'multipart');
                assert.deepEqual(body.input, {foo: ['1', '2', '3']});
                assert.ok(Array.isArray(body.files.file));
                assert.deepEqual(body.files.file[0].content,
                    fs.readFileSync(path.join(__dirname, 'fixtures', 'plug', 'sync-plugin.js')));
                assert.strictEqual(body.files.file[1].filename, 'sync-plugin.js');
                assert.strictEqual(body.files.file[2].mime, 'application/javascript');

                track.send('bar');
            }
        });

        var req = supertest(back.getHandler()).post('/upload/');

        req.
            set('Content-Type', 'multipart/form-data');

        req.field('foo', '1');
        req.field('foo', '2');
        req.field('foo', '3');

        req.attach('file', path.join(__dirname, 'fixtures', 'plug', 'sync-plugin.js'));
        req.attach('file', path.join(__dirname, 'fixtures', 'plug', 'sync-plugin.js'));
        req.attach('file', path.join(__dirname, 'fixtures', 'plug', 'sync-plugin.js'));

        req.
            expect(200).
            expect('bar').
            end(done);

    });

    it('Should be failed coz no boundary passed', function (done) {
        var back = getAgent({
            name: 'uploader',
            implicitBase: '_fist_contrib_unit'
        });

        back.route('POST /upload/', {
            name: 'upload',
            unit: 'test'
        });

        back.unit({
            name: 'test',
            deps: ['body'],
            main: function (track) {
                track.send('bar');
            }
        });

        supertest(back.getHandler()).post('/upload/').
            set('Content-Type', 'multipart/form-data').
            expect(400).
            end(done);
    });

    it('Should be failed while parsing multipart', function (done) {
        var back = getAgent({
            name: 'uploader',
            implicitBase: '_fist_contrib_unit'
        });

        back.route('POST /upload/', {
            name: 'upload',
            unit: 'test'
        });

        back.unit({
            name: 'test',
            deps: ['body'],
            main: function (track) {
                track.send('bar');
            }
        });

        var req = supertest(back.getHandler()).post('/upload/');
        var parts = [
            '--asdasdasdasd\r\n',
            'Content-Type: text/plain\r\n',
            'Content-Disposition: form-data; name="foo"\r\n',
            '\r\n',
            'asd\r\n',
            '--asdasdasdasd--'
        ];

        req.
            set('Content-Type', 'multipart/form-data; boundary=asdasdasdasd').
            send(parts.join(':)'));

        req.
            expect(400).
            end(done);
    });

});
