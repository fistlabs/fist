/*global describe, it*/
'use strict';

var Framework = require('../Framework');
var assert = require('chai').assert;

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

});
