/*eslint max-nested-callbacks: 0*/
/*global describe, it*/
'use strict';

var supertest = require('supertest');
var Server = require('../core/server');

describe('Connect.prototype.redirect()', function () {
    it('Should set corresponding location and status', function (done) {
        var server = new Server({
            logging: {
                logLevel: 'SILENT'
            }
        });
        server.unit({
            name: 'index',
            main: function (track) {
                track.redirect('https://ya.ru/');
            }
        });
        server.route('/', 'index');
        supertest(server.getHandler()).
            get('/').
            expect(302).
            expect('Location', 'https://ya.ru/').
            end(done);
    });

    it('Should inherit protocol from incoming request', function (done) {
        var server = new Server({
            logging: {
                logLevel: 'SILENT'
            }
        });
        server.unit({
            name: 'index',
            main: function (track) {
                track.redirect('//ya.ru/');
            }
        });
        server.route('/', 'index');
        supertest(server.getHandler()).
            get('/').
            set('X-Forwarded-Proto', 'https').
            expect(302).
            expect('Location', 'https://ya.ru/').
            end(done);
    });

    it('Should inherit host from incoming request', function (done) {
        var server = new Server({
            logging: {
                logLevel: 'SILENT'
            }
        });
        server.unit({
            name: 'index',
            main: function (track) {
                track.redirect('/');
            }
        });
        server.route('/', 'index');
        supertest(server.getHandler()).
            get('/').
            set('Host', 'ya.ru:3000').
            expect(302).
            expect('Location', /\/\/ya\.ru:3000\/$/).
            end(done);
    });

    it('Should support custom status code', function (done) {
        var server = new Server({
            logging: {
                logLevel: 'SILENT'
            }
        });
        server.unit({
            name: 'index',
            main: function (track) {
                track.redirect('/', 301);
            }
        });
        server.route('/', 'index');
        supertest(server.getHandler()).
            get('/').
            expect(301).
            end(done);
    });

    it('Should send html if accepted', function (done) {
        var server = new Server({
            logging: {
                logLevel: 'SILENT'
            }
        });
        server.unit({
            name: 'index',
            main: function (track) {
                track.redirect('/<');
            }
        });
        server.route('/', 'index');
        supertest(server.getHandler()).
            get('/').
            set('Accept', 'text/html').
            expect('Content-Type', /text\/html/).
            expect(/<a\shref="http/).
            expect(/>http/).
            expect(/&lt;/).
            end(done);
    });

    it('Should send text if not accepted', function (done) {
        var server = new Server({
            logging: {
                logLevel: 'SILENT'
            }
        });
        server.unit({
            name: 'index',
            main: function (track) {
                track.redirect('/:::');
            }
        });
        server.route('/', 'index');
        supertest(server.getHandler()).
            get('/').
            set('Accept', 'text/plain').
            expect('Content-Type', /text\/plain/).
            expect(/\/:::/).
            end(done);
    });
});
