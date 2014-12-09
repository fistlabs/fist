/*eslint max-nested-callbacks: 0*/
/*global describe, it*/
'use strict';

var Logging = require('loggin/core/logging');
var Logger = require('loggin/core/logger');
var Context = require('../core/context');
var Track = require('../core/track');
var Core = require('../core/core');

var assert = require('assert');
var inherit = require('inherit');
var logger = require('loggin');

function getTrack() {
    return new Track(new Core(), logger);
}

describe('core/unit-common', function () {
    var UnitCommon = require('../core/unit-common').createClass();

    it('Should be an instance of UnitCommon', function () {
        assert.ok(new UnitCommon() instanceof UnitCommon);
    });

    it('Should have Object params property', function () {
        var unit = new UnitCommon();
        assert.ok(unit.params);
        assert.strictEqual(typeof unit.params, 'object');
    });

    it('Should have Number maxAge property', function () {
        var unit = new UnitCommon();
        assert.strictEqual(typeof unit.maxAge, 'number');

    });

    describe('UnitCommon.inherit', function () {

        it('Should have static inherit method', function () {
            assert.strictEqual(typeof UnitCommon.inherit, 'function');
        });

        it('Should inherit from self', function () {
            var MyUnit = UnitCommon.inherit();
            var unit = new MyUnit();
            assert.ok(unit instanceof UnitCommon);
            assert.ok(unit instanceof MyUnit);
            assert.strictEqual(typeof MyUnit.inherit, 'function');
        });

        it('Should support own and static members', function () {
            var MyUnit = UnitCommon.inherit({
                foo: 11
            }, {
                bar: 12
            });
            var unit = new MyUnit();
            assert.strictEqual(unit.foo, 11);
            assert.strictEqual(MyUnit.bar, 12);
        });

        it('Should support mixins', function () {
            function Mixin() {}

            Mixin.prototype.foo = function () {};

            var MyUnit = UnitCommon.inherit({
                mixins: [Mixin]
            });
            var unit = new MyUnit();

            assert.strictEqual(unit.foo, Mixin.prototype.foo);
        });
    });

    describe('UnitCommon.cache', function () {
        it('Should have "cache" property', function () {
            assert.ok(UnitCommon.cache);
            assert.ok(typeof UnitCommon.cache, 'object');
        });

        it('Should be cache-like interface', function () {
            assert.strictEqual(typeof UnitCommon.cache.set, 'function');
            assert.strictEqual(typeof UnitCommon.cache.get, 'function');
        });
    });

    describe('unit.createContext()', function () {
        it('Should have createContext method', function () {
            var unit = new UnitCommon();
            assert.strictEqual(typeof unit.createContext, 'function');
        });

        it('Should create Context', function () {
            var unit = new UnitCommon();
            assert.ok(unit.createContext(new Logger(new Logging())) instanceof Context);
        });
    });

    describe('unit.hashCall()', function () {
        it('Should have hashCall method', function () {
            var unit = new UnitCommon();
            assert.strictEqual(typeof unit.hashCall, 'function');
        });

        it('Should return empty string by default', function () {
            var Unit = inherit(UnitCommon, {
                name: 'foo'
            });

            var unit = new Unit();
            var track = getTrack();
            var context = new Context(new Logger(new Logging())).
                setup(unit.params, track.params, {foo: 'bar'});

            assert.strictEqual(unit.hashCall(track, context), '');
        });
    });

    describe('unit.call()', function () {
        it('Should have unit.call() method', function () {
            var unit = new UnitCommon();
            assert.strictEqual(typeof unit.call, 'function');
        });

        it('Should call .main() method', function (done) {
            var Unit = inherit(UnitCommon, {
                name: 'foo',
                main: function () {
                    return 42;
                }
            });

            var track = getTrack();
            var unit = new Unit();

            unit.call(track, unit.createContext(track.logger.bind(unit.name))).then(function (res) {
                assert.strictEqual(res.result, 42);
                done();
            });
        });

        it('Should setup context before calling', function (done) {
            var Unit = inherit(UnitCommon, {
                name: 'foo',
                params: {
                    foo: 'bar',
                    bar: 'baz',
                    baz: 'zot'
                },
                main: function (track, context) {

                    assert.deepEqual(context.params, {
                        foo: 'bar',
                        bar: 42,
                        baz: 12
                    });

                    return 100500;
                }
            });

            var track = getTrack();

            track.params = {
                bar: 42,
                baz: 11
            };

            var unit = new Unit();
            var context = unit.createContext(track.logger.bind(unit.name)).
                setup(unit.params, track.params, {
                    baz: 12
                });

            unit.call(track, context).done(function (res) {
                assert.strictEqual(res.result, 100500);
                done();
            });
        });

        it('Should support cache', function (done) {
            var i = 0;
            var Unit = inherit(UnitCommon, {

                name: 'foo',

                maxAge: 0.05,

                hashCall: function () {
                    return 'bar';
                },

                main: function () {
                    i += 1;
                    return i;
                }
            });

            var track = getTrack();
            var unit = new Unit();
            var context = unit.createContext(track.logger.bind(unit.name)).
                setup(unit.params, track.params);

            unit.call(track, context).done(function (res) {
                assert.strictEqual(res.result, 1);
                assert.strictEqual(res.memKey, 'foo, bar');

                unit.call(track, context).done(function (res) {
                    assert.strictEqual(res.result, 1);
                    assert.strictEqual(res.memKey, 'foo, bar');

                    setTimeout(function () {
                        unit.call(track, context).done(function (res) {
                            assert.strictEqual(res.result, 2);
                            assert.strictEqual(res.memKey, 'foo, bar');

                            done();
                        });
                    }, 70);
                });
            });
        });

        it('Should not use cache cache fetch failed', function (done) {
            var i = 0;
            var Unit = inherit(UnitCommon, {
                name: 'foo',

                maxAge: 0.05,

                hashCall: function () {
                    return 'bar';
                },

                main: function () {
                    i += 1;
                    return i;
                }

            }, {
                cache: {
                    get: function (k, fn) {
                        setTimeout(function () {
                            fn(new Error());
                        }, 0);
                    },
                    set: function (k, v, ttl, fn) {
                        setTimeout(function () {
                            fn(new Error());
                        }, 0);
                    }
                }
            });

            var track = getTrack();
            var unit = new Unit();
            var context = unit.createContext(track.logger.bind(unit.name)).
                setup(unit.params, track.params);

            unit.call(track, context).done(function (res) {
                assert.strictEqual(res.result, 1);
                assert.strictEqual(res.memKey, 'foo, bar');

                unit.call(track, context).done(function (res) {
                    assert.strictEqual(res.result, 2);
                    assert.strictEqual(res.memKey, 'foo, bar');

                    done();
                });
            });
        });

        it('Should not cache errors', function (done) {
            var i = 0;
            var Unit = inherit(UnitCommon, {
                name: 'foo',

                maxAge: 0.05,

                main: function () {
                    i += 1;
                    throw i;
                }

            });

            var track = getTrack();
            var unit = new Unit();
            var context = unit.createContext(track.logger.bind(unit.name));

            unit.call(track, context).done(null, function (err) {
                assert.strictEqual(err, 1);

                unit.call(track, context).done(null, function (err) {
                    assert.strictEqual(err, 2);
                    done();
                });
            });
        });

        it('Should not use cache if memKey is falsy', function (done) {
            var i = 0;
            var Unit = inherit(UnitCommon, {
                name: 'foo',

                _buildMemKey: function () {
                    return null;
                },

                maxAge: 0.05,

                main: function () {
                    i += 1;
                    return i;
                }

            });

            var track = getTrack();
            var unit = new Unit();

            unit.call(track, unit.createContext(track.logger.bind(unit.name))).done(function (res) {
                assert.strictEqual(res.result, 1);
                assert.strictEqual(res.memKey, null);

                unit.call(track, unit.createContext(track.logger.bind(unit.name))).done(function (res) {
                    assert.strictEqual(res.result, 2);
                    assert.strictEqual(res.memKey, null);
                    done();
                });
            });
        });

        it('Should not return result if track was flushed', function (done) {
            var Unit = inherit(UnitCommon, {
                name: 'foo',
                main: function (track) {
                    track._isFlushed = true;
                    return 42;
                }
            });

            var track = getTrack();
            var unit = new Unit();

            unit.call(track, unit.createContext(track.logger.bind(unit.name))).done(function (res) {
                assert.strictEqual(res, null);
                done();
            });
        });

        it('Should not cache if track was flushed', function (done) {
            var i = 0;
            var Unit = inherit(UnitCommon, {
                name: 'foo',
                getMemKey: function () {
                    return 'test-control';
                },

                maxAge: 0.05,

                main: function (track) {
                    i += 1;
                    track._isFlushed = true;
                    return i;
                }

            });

            var track = getTrack();
            var unit = new Unit();

            unit.call(track, unit.createContext(track.logger.bind(unit.name))).done(function (res) {
                assert.strictEqual(res, null);
                assert.strictEqual(i, 1);

                unit.call(track, unit.createContext(track.logger.bind(unit.name))).done(function (res) {
                    assert.strictEqual(res, null);
                    assert.strictEqual(i, 2);
                    done();
                });
            });
        });
    });

});
