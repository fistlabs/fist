/*eslint max-nested-callbacks: 0*/
/*global describe, it*/
'use strict';

var assert = require('assert');
var logger = require('loggin');
var vow = require('vow');

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
        it('Should invoke unit', function (done) {
            var core = new Core();
            var track = new Track(core, logger);

            core.unit({
                name: 'foo',
                main: function () {
                    return 42;
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');

                track.invoke(unit, null, function (err, val) {
                    assert.ok(!err);
                    assert.strictEqual(val.result, 42);
                    done();
                });
            });
        });

        it('Should memorize unit calls', function (done) {
            var i = 0;
            var core = new Core();
            var track = new Track(core, logger);

            core.unit({
                name: 'foo',
                main: function () {
                    i += 1;
                    return 42;
                }
            });

            core.ready().done(function () {
                var unit = core.getUnit('foo');

                track.invoke(unit, null, function (err, val) {
                    assert.ok(!err);
                    assert.strictEqual(val.result, 42);
                    assert.strictEqual(i, 1);

                    track.invoke(unit, null, function (err, val) {
                        assert.ok(!err);
                        assert.strictEqual(val.result, 42);
                        assert.strictEqual(i, 1);
                        done();
                    });
                });
            });
        });

        it('Should memorize unit calls by args hash', function (done) {
            var i = 0;
            var j = 0;
            var core = new Core();
            var track = new Track(core, logger);

            core.unit({
                name: 'foo',
                main: function (track, context) {
                    i += 1;
                    assert.strictEqual(context.params.foo, 'bar');
                    var defer = vow.defer();
                    setTimeout(function () {
                        defer.resolve(42);
                    }, 10);
                    return defer.promise();
                },
                identify: function (track, args) {
                    return args.foo;
                }
            });

            var args = {
                foo: 'bar'
            };

            core.ready().done(function () {
                var unit = core.getUnit('foo');

                track.invoke(unit, args, function (err, val) {
                    assert.ok(!err);
                    assert.strictEqual(val.result, 42);
                    assert.strictEqual(i, 1);
                    j += 1;
                });

                track.invoke(unit, args, function (err, val) {
                    assert.ok(!err);
                    assert.strictEqual(val.result, 42);
                    assert.strictEqual(i, 1);
                    assert.strictEqual(j, 1);

                    track.invoke(unit, args, function (err, val) {
                        assert.ok(!err);
                        assert.strictEqual(val.result, 42);
                        assert.strictEqual(i, 1);
                        assert.strictEqual(j, 1);
                        done();
                    });
                });
            });

        });
    });

    describe('track.eject()', function () {
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
                track.eject('foo').done(function (res) {
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
                track.eject('foo').done(null, function (err) {
                    assert.strictEqual(err, 42);
                    done();
                });
            });
        });
    });
});
