/*eslint max-nested-callbacks: 0*/
/*global describe, it*/
'use strict';

var assert = require('assert');
var supertest = require('supertest');
var Server = require('../core/server');

describe('Connect.prototype.acceptCharsets()', function () {
    it('Should return preferred charset', function (done) {
        var server = new Server({
            logging: {
                logLevel: 'SILENT'
            }
        });
        server.unit({
            name: 'index',
            main: function (track) {
                track.send(track.acceptCharsets(['utf-8', 'windows-1251']));
            }
        });
        server.route('/', 'index');
        supertest(server.getHandler()).
            get('/').
            set('Accept-Charset', 'utf-8').
            expect('utf-8').
            expect(200).
            end(done);
    });

    it('Should support single charset as argument', function (done) {
        var server = new Server({
            logging: {
                logLevel: 'SILENT'
            }
        });
        server.unit({
            name: 'index',
            main: function (track) {
                track.send(track.acceptCharsets('utf-8'));
            }
        });
        server.route('/', 'index');
        supertest(server.getHandler()).
            get('/').
            set('Accept-Charset', 'utf-8').
            expect('utf-8').
            expect(200).
            end(done);
    });

    it('Should have alias acceptCharset', function (done) {
        var server = new Server({
            logging: {
                logLevel: 'SILENT'
            }
        });
        server.unit({
            name: 'index',
            main: function (track) {
                assert.strictEqual(track.acceptCharset, track.acceptCharsets);
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
