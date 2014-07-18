/*global describe, it*/
'use strict';

var Framework = require('../Framework');

var assert = require('chai').assert;
var path = require('path');

describe('fist/plug/routes', function () {

    it('Should declare routes by array', function (done) {
        var tracker = new Framework({
            routes: [
                {
                    pattern: '/',
                    name: 'index'
                }
            ]
        });

        tracker.ready().done(function () {
            assert.strictEqual(tracker.router.
                getRoute('index').data.name, 'index');
            done();
        });
    });

    it('Should declare routes by one item', function (done) {
        var tracker = new Framework({
            routes: {
                pattern: '/',
                name: 'index'
            }
        });

        tracker.ready().done(function () {
            assert.strictEqual(tracker.router.
                getRoute('index').data.name, 'index');
            done();
        });
    });

    it('Should not fail if routes is not declared', function (done) {
        var tracker = new Framework();

        tracker.ready().done(function () {
            done();
        });
    });

    it('Should declare routes by file with routes', function (done) {
        var tracker = new Framework({
            routes: path.join(__dirname, 'fixtures', 'plug', 'routes')
        });

        tracker.ready().done(function () {
            assert.ok(tracker.router.getRoute('index'));
            done();
        });
    });

});
