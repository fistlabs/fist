/*eslint max-nested-callbacks: 0*/
/*global describe, it*/
'use strict';

var assert = require('assert');
var supertest = require('supertest');
var Server = require('../core/server');

describe('Connect.prototype.acceptTypes()', function () {
    it('Should return preferred type', function (done) {
        var server = new Server({
            logging: {
                logLevel: 'SILENT'
            }
        });
        server.unit({
            name: 'index',
            main: function (track) {
                track.send(track.acceptTypes(['text/html', 'text/plain']));
            }
        });
        server.route('/', 'index');
        supertest(server.getHandler()).
            get('/').
            set('Accept', 'text/html').
            expect('text/html').
            expect(200).
            end(done);
    });

    it('Should support single type as argument', function (done) {
        var server = new Server({
            logging: {
                logLevel: 'SILENT'
            }
        });
        server.unit({
            name: 'index',
            main: function (track) {
                track.send(track.acceptTypes('text/html'));
            }
        });
        server.route('/', 'index');
        supertest(server.getHandler()).
            get('/').
            set('Accept', 'text/html').
            expect('text/html').
            expect(200).
            end(done);
    });

    it('Should have alias acceptType', function (done) {
        var server = new Server({
            logging: {
                logLevel: 'SILENT'
            }
        });
        server.unit({
            name: 'index',
            main: function (track) {
                assert.strictEqual(track.acceptType, track.acceptTypes);
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
