/*eslint max-nested-callbacks: 0*/
/*global describe, it*/
'use strict';

var assert = require('assert');
var errors = require('../core/errors');
var logger = require('loggin');

describe('core/track', function () {
    var Core = require('../core/core');
    var Track = require('../core/track');
    var agent = new Core();

    it('Should be an instance of Track', function () {
        var track = new Track(agent, logger);
        assert.ok(track instanceof Track);
    });

    it('Should take a logger', function () {
        var track = new Track(agent, logger);
        assert.strictEqual(track.logger, logger);
    });

    describe('track.invoke()', function () {
        it('Should call unit by name and return only result', function (done) {
            var core = new Core();
            core.unit({
                name: 'foo',
                main: function () {
                    return 42;
                }
            });

            core.ready().done(function () {
                var track = new Track(core, logger);
                track.invoke('foo').done(function (res) {
                    assert.strictEqual(res, 42);
                    done();
                });
            });
        });

        it('Should call unit by name and return only error', function (done) {
            var core = new Core();
            core.unit({
                name: 'foo',
                main: function () {
                    throw 42;
                }
            });

            core.ready().done(function () {
                var track = new Track(core, logger);
                track.invoke('foo').done(null, function (err) {
                    assert.strictEqual(err, 42);
                    done();
                });
            });
        });

        it('Should be rejected coz no such unit', function () {
            var core = new Core();
            return core.ready().then(function () {
                var track = new Track(core, logger);
                return track.invoke('foo').then(function () {
                    throw 0;
                }, function (err) {
                    assert.ok(err instanceof errors.NoSuchUnitError);
                });
            });
        });
    });
});
