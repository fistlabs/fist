/*eslint max-nested-callbacks: 0*/
/*global describe, it*/
'use strict';

var assert = require('assert');
var supertest = require('supertest');
var Server = require('../core/server');

describe('Connect.prototype.acceptEncodings()', function () {
    it('Should return preferred encoding', function (done) {
        var server = new Server({
            logging: {
                logLevel: 'SILENT'
            }
        });
        server.unit({
            name: 'index',
            main: function (track) {
                track.send(track.acceptEncodings(['gzip', 'binary']));
            }
        });
        server.route('/', 'index');
        supertest(server.getHandler()).
            get('/').
            set('Accept-Encoding', 'gzip').
            expect('gzip').
            expect(200).
            end(done);
    });

    it('Should support single encoding as argument', function (done) {
        var server = new Server({
            logging: {
                logLevel: 'SILENT'
            }
        });
        server.unit({
            name: 'index',
            main: function (track) {
                track.send(track.acceptEncodings('gzip'));
            }
        });
        server.route('/', 'index');
        supertest(server.getHandler()).
            get('/').
            set('Accept-Encoding', 'gzip').
            expect('gzip').
            expect(200).
            end(done);
    });

    it('Should have alias acceptEncoding', function (done) {
        var server = new Server({
            logging: {
                logLevel: 'SILENT'
            }
        });
        server.unit({
            name: 'index',
            main: function (track) {
                assert.strictEqual(track.acceptEncoding, track.acceptEncodings);
                track.send();
            }
        });
        server.route('/', 'index');
        supertest(server.getHandler()).
            get('/').
            expect(200).
            end(done);
    });
});
