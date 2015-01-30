/*eslint max-nested-callbacks: 0*/
/*global describe, it*/
'use strict';

var assert = require('assert');
var supertest = require('supertest');
var Server = require('../core/server');

describe('Connect.prototype.acceptLanguages()', function () {
    it('Should return preferred language', function (done) {
        var server = new Server({
            logging: {
                logLevel: 'SILENT'
            }
        });
        server.unit({
            name: 'index',
            main: function (track) {
                track.send(track.acceptLanguages(['ru', 'en']));
            }
        });
        server.route('/', 'index');
        supertest(server.getHandler()).
            get('/').
            set('Accept-Language', 'ru').
            expect('ru').
            expect(200).
            end(done);
    });

    it('Should support single language as argument', function (done) {
        var server = new Server({
            logging: {
                logLevel: 'SILENT'
            }
        });
        server.unit({
            name: 'index',
            main: function (track) {
                track.send(track.acceptLanguages('ru'));
            }
        });
        server.route('/', 'index');
        supertest(server.getHandler()).
            get('/').
            set('Accept-Language', 'ru').
            expect('ru').
            expect(200).
            end(done);
    });

    it('Should have alias acceptLanguage', function (done) {
        var server = new Server({
            logging: {
                logLevel: 'SILENT'
            }
        });
        server.unit({
            name: 'index',
            main: function (track) {
                assert.strictEqual(track.acceptLanguage, track.acceptLanguages);
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
