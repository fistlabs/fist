/*eslint max-nested-callbacks: 0*/
/*global describe, it*/
'use strict';

var Agent = require('../core/core');
var Track = require('../core/track');

var assert = require('assert');

function getAgent(params) {
    var agent = new Agent(params);
    agent.install(require.resolve('../fist_plugins/units/_fist_contrib_unit_serial'));
    agent.install(require.resolve('../fist_plugins/units/_fist_contrib_unit'));
    return agent;
}

describe('fist_plugins/units/_fist_contrib_unit_serial', function () {
    it('Should run unit step by step', function (done) {
        var agent = getAgent();
        var track = new Track(agent);

        agent.unit({
            base: '_fist_contrib_unit_serial',
            name: 'serial',
            series: ['foo', 'bar'],
            foo: function () {
                return 1;
            },
            bar: function (track, context) {
                return context.prev + 1;
            }
        });

        agent.ready().done(function () {
            track.eject('serial').done(function (res) {
                assert.strictEqual(res, 2);
                done();
            });
        });
    });

    it('Should stop running series if track was flushed', function (done) {
        var agent = getAgent();
        var track = new Track(agent);

        agent.unit({
            base: '_fist_contrib_unit_serial',
            name: 'serial',
            series: ['foo', 'bar'],
            foo: function (track) {
                track._isFlushed = true;
                return 1;
            },
            bar: function (track, context) {
                return context.prev + 1;
            }
        });

        agent.ready().done(function () {
            track.eject('serial').done(function (res) {
                assert.strictEqual(res, null);
                done();
            });
        });
    });

    it('Should run fallback if step failed', function (done) {
        var agent = getAgent();
        var track = new Track(agent);

        agent.unit({
            base: '_fist_contrib_unit_serial',
            name: 'serial',
            series: ['foo', 'bar'],
            foo: function () {
                throw 1;
            },
            efoo: function (track, context) {
                assert.strictEqual(context.prev, 1);
                return 42;
            },
            bar: function (track, context) {
                return context.prev + 1;
            }
        });

        agent.ready().done(function () {
            track.eject('serial').done(function (res) {
                assert.strictEqual(res, 42);
                done();
            });
        });
    });

    it('Should be rejected if no fallback provided', function (done) {
        var agent = getAgent();
        var track = new Track(agent);

        agent.unit({
            base: '_fist_contrib_unit_serial',
            name: 'serial',
            series: ['foo', 'bar'],
            foo: function () {
                throw 1;
            },
            bar: function (track, context) {
                return context.prev + 1;
            }
        });

        agent.ready().done(function () {
            track.eject('serial').done(null, function (err) {
                assert.strictEqual(err, 1);
                done();
            });
        });
    });

    it('Should resolve unit if no series left', function (done) {
        var agent = getAgent();
        var track = new Track(agent);

        agent.unit({
            base: '_fist_contrib_unit_serial',
            name: 'serial',
            series: ['foo', 'bar'],
            foo: function (track, context) {
                context.series.clear();
                return 1;
            },
            bar: function (track, context) {
                return context.prev + 1;
            }
        });

        agent.ready().done(function () {
            track.eject('serial').done(function (res) {
                assert.strictEqual(res, 1);
                done();
            });
        });
    });
});
