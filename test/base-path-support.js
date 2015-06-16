'use strict';

var Server = require('../core/server');
var supertest = require('supertest');

describe('base-path-support', function () {
    it('Should support base path', function (done) {
        var server = new Server({
            logging: {
                logLevel: 'SILENT'
            },
            router: {
                basePath: '/site'
            }
        });

        server.route('GET /page/', 'index');

        server.unit({
            name: 'index',
            main: function (track) {
                track.status(200).send('Okay');
            }
        });

        server.ready().done(function () {
            supertest(server.getHandler()).
                get('/site/page/').
                expect('Okay').
                end(done);
        });
    });

    it('Should respond 404', function (done) {
        var server = new Server({
            logging: {
                logLevel: 'SILENT'
            },
            router: {
                basePath: '/site'
            }
        });

        server.route('GET /page/', 'index');

        server.unit({
            name: 'index',
            main: function (track) {
                track.status(200).send('Okay');
            }
        });

        server.ready().done(function () {
            supertest(server.getHandler()).
                get('/page/').
                expect(404).
                end(done);
        });
    });

    it('Should autocomplete redirect urls with base path', function (done) {
        var server = new Server({
            logging: {
                logLevel: 'SILENT'
            },
            router: {
                basePath: '/site'
            }
        });

        server.route('GET /page/', 'index');

        server.unit({
            name: 'index',
            main: function (track) {
                track.redirect('/dest-page', 302);
            }
        });

        server.ready().done(function () {
            supertest(server.getHandler()).
                get('/site/page/').
                expect(302).
                expect('Location', /\/site\/dest-page/).
                end(done);
        });
    });

    it('Should not autocomplete redirect url pathname if the url is absolute', function (done) {
        var server = new Server({
            logging: {
                logLevel: 'SILENT'
            },
            router: {
                basePath: '/site'
            }
        });

        server.route('GET /page/', 'index');

        server.unit({
            name: 'index',
            main: function (track) {
                track.redirect('//example.com/dest-page', 302);
            }
        });

        server.ready().done(function () {
            supertest(server.getHandler()).
                get('/site/page/').
                expect(302).
                expect('Location', /\/example\.com\/dest-page/).
                end(done);
        });
    });
});
