/*global describe, it*/
'use strict';

var Server = require('../core/server');

var assert = require('chai').assert;
var path = require('path');
var plugRoutes = require('../plugins/routes');

describe('plugins/routes', function () {

    it('Should declare routes by array', function (done) {
        var server = new Server({
            routes: [
                {
                    pattern: '/',
                    name: 'index'
                }
            ]
        });

        server.plug(plugRoutes);

        server.ready().done(function () {
            assert.strictEqual(server.router.
                getRoute('index').data.name, 'index');
            done();
        });
    });

    it('Should declare routes by one item', function (done) {
        var server = new Server({
            routes: {
                pattern: '/',
                name: 'index'
            }
        });

        server.plug(plugRoutes);

        server.ready().done(function () {
            assert.strictEqual(server.router.
                getRoute('index').data.name, 'index');
            done();
        });
    });

    it('Should not fail if routes is not declared', function (done) {
        var server = new Server();

        server.plug(plugRoutes);

        server.ready().done(function () {

            done();
        });
    });

    it('Should declare routes by file with routes', function (done) {
        var server = new Server({
            routes: path.join(__dirname, 'fixtures', 'plug', 'routes')
        });

        server.plug(plugRoutes);

        server.ready().done(function () {
            assert.ok(server.router.getRoute('index'));
            done();
        });
    });

});
