//  TODO move to core.Unit tests
/*eslint max-nested-callbacks: 0, no-proto: 0*/
/*global describe, it*/
'use strict';

var Agent = require('../core/core');
var Track = require('../core/track');
var Obus = require('obus');

var assert = require('assert');
var logger = require('loggin');
var vow = require('vow');

function getAgent(params) {
    return new Agent(params);
}

describe('fist_plugins/units/_fistlabs_unit_depends', function () {

    it('Should create context', function (done) {
        var agent = getAgent({});

        agent.unit({
            base: 0,
            name: 'foo',
            main: function (track, context) {
                assert.ok(context);
                assert.ok(context.errors instanceof Obus);
                assert.ok(context.result instanceof Obus);
                assert.strictEqual(typeof context.r, 'function');
                assert.strictEqual(typeof context.e, 'function');

                context.result.set('foo.bar', 42);
                context.errors.set('bar.zot', 43);

                assert.strictEqual(context.r('foo.bar'), 42);
                assert.strictEqual(context.e('bar.zot'), 43);

                assert.strictEqual(context.r('foo.bar.baz'), void 0);
                assert.strictEqual(context.e('foo.bar.baz'), void 0);

                assert.strictEqual(context.r('foo.bar.baz', 42), 42);
                assert.strictEqual(context.e('foo.bar.baz', 42), 42);
                return 42;
            }
        });

        agent.ready().done(function () {
            new Track(agent, logger).eject('foo').done(function (res) {
                assert.strictEqual(res, 42);
                done();
            });
        });
    });

    it('Should support deps', function (done) {
        var agent = getAgent({});

        agent.unit({
            base: 0,
            name: 'foo',
            deps: ['bar'],
            main: function (track, context) {
                assert.strictEqual(context.result.get('bar'), 'baz');
                return 42;
            }
        });

        agent.unit({
            name: 'bar',
            main: function () {
                return 'baz';
            }
        });

        agent.ready().done(function () {
            new Track(agent, logger).eject('foo').done(function (res) {
                assert.strictEqual(res, 42);
                done();
            });
        });
    });

    it('Deps can be rejected', function (done) {
        var agent = getAgent({});

        agent.unit({
            base: 0,
            name: 'foo',
            deps: ['bar'],
            main: function (track, context) {
                assert.strictEqual(context.errors.get('bar'), 'baz');
                return 42;
            }
        });

        agent.unit({
            name: 'bar',
            main: function () {
                throw 'baz';
            }
        });

        agent.ready().done(function () {
            new Track(agent, logger).eject('foo').done(function (res) {
                assert.strictEqual(res, 42);
                done();
            });
        });
    });

    it('Should automatically add base deps', function (done) {
        var agent = getAgent({});

        agent.unit({
            base: 0,
            name: 'base',
            deps: ['bar']
        });

        agent.unit({
            base: 'base',
            name: 'foo',
            deps: ['baz'],
            main: function (track, context) {
                assert.strictEqual(context.result.get('bar'), 'baz');
                assert.strictEqual(context.result.get('baz'), 'zot');
                return 42;
            }
        });

        agent.unit({
            name: 'bar',
            main: function () {
                return 'baz';
            }
        });

        agent.unit({
            name: 'baz',
            main: function () {
                return 'zot';
            }
        });

        agent.ready().done(function () {
            new Track(agent, logger).eject('foo').done(function (res) {
                assert.strictEqual(res, 42);
                done();
            });
        });
    });

    it('Should add mixins deps', function (done) {
        var agent = getAgent({});

        function Mix0() {}
        function Mix1() {}

        agent.unit({
            base: 0,
            name: 'a'
        });

        agent.unit({
            base: 0,
            name: 'b'
        });

        agent.unit({
            base: 0,
            name: 'c'
        });

        agent.unit({
            base: 0,
            name: 'd'
        });

        agent.unit({
            base: 0,
            name: 'e'
        });

        Mix0.prototype.deps = ['c', 'd'];
        Mix1.prototype.deps = ['e'];

        agent.unit({
            base: 0,
            name: 'foo',
            mixins: [null, Mix0, {}, null],
            deps: ['a']
        });

        agent.unit({
            base: 'foo',
            name: 'bar',
            mixins: [Mix1],
            deps: ['b'],
            __constructor: function () {
                this.__base();
                assert.deepEqual(this.deps, ['a', 'c', 'd', 'b', 'e']);
                done();
            }
        });

        agent.ready();
    });

    it('Should support deps as no-array', function (done) {
        var agent = getAgent({});

        agent.unit({
            base: 0,
            name: 'base',
            deps: 'bar'
        });

        agent.unit({
            base: 'base',
            name: 'foo',
            deps: 'baz',
            main: function (track, context) {
                assert.strictEqual(context.result.get('bar'), 'baz');
                assert.strictEqual(context.result.get('baz'), 'zot');
                return 42;
            }
        });

        agent.unit({
            name: 'bar',
            main: function () {
                return 'baz';
            }
        });

        agent.unit({
            name: 'baz',
            main: function () {
                return 'zot';
            }
        });

        agent.ready().done(function () {
            new Track(agent, logger).eject('foo').done(function (res) {
                assert.strictEqual(res, 42);
                done();
            });
        });
    });

    it('Should support deps map', function (done) {
        var agent = getAgent({});

        agent.unit({
            base: 0,
            name: 'foo',
            deps: ['bar'],
            depsMap: {
                bar: 'xyz'
            },
            main: function (track, context) {
                assert.strictEqual(context.result.get('xyz'), 'baz');
                return 42;
            }
        });

        agent.unit({
            name: 'bar',
            main: function () {
                return 'baz';
            }
        });

        agent.ready().done(function () {
            new Track(agent, logger).eject('foo').done(function (res) {
                assert.strictEqual(res, 42);
                done();
            });
        });
    });

    it('Should support static deps args', function (done) {
        var agent = getAgent({});

        agent.unit({
            base: 0,
            name: 'foo',
            deps: ['bar'],
            depsArgs: {
                bar: {
                    x: 'baz'
                }
            },
            main: function (track, context) {
                assert.strictEqual(context.result.get('bar'), 'baz');
                return 42;
            }
        });

        agent.unit({
            name: 'bar',
            main: function (track, context) {
                return context.param('x');
            }
        });

        agent.ready().done(function () {
            new Track(agent, logger).eject('foo').done(function (res) {
                assert.strictEqual(res, 42);
                done();
            });
        });
    });

    it('Should support deps args as function', function (done) {
        var agent = getAgent({});

        agent.unit({
            base: 0,
            name: 'foo',
            deps: ['bar'],
            depsArgs: {
                bar: function (track, context) {
                    return {
                        x: context.param('x') + 1
                    };
                }
            },
            main: function (track, context) {
                assert.strictEqual(context.result.get('bar'), 2);
                return 42;
            }
        });

        agent.unit({
            name: 'bar',
            main: function (track, context) {
                return context.param('x');
            }
        });

        agent.ready().done(function () {
            new Track(agent, logger).eject('foo', {
                x: 1
            }).done(function (res) {
                assert.strictEqual(res, 42);
                done();
            });
        });
    });

    it('Should use cache if deps is cacheable', function (done) {
        var agent = getAgent({});
        var foo = 0;
        var bar = 0;

        agent.unit({
            base: 0,
            name: 'foo',
            deps: ['bar'],
            main: function (track, context) {
                assert.strictEqual(context.result.get('bar'), 'baz');
                foo += 1;
                return 42;
            },
            maxAge: 0.05
        });

        agent.unit({
            name: 'bar',
            maxAge: 0.05,
            main: function () {
                bar += 1;
                return 'baz';
            }
        });

        agent.ready().done(function () {
            new Track(agent, logger).eject('foo').done(function (res) {
                assert.strictEqual(res, 42);
                assert.strictEqual(foo, 1);
                assert.strictEqual(bar, 1);

                new Track(agent, logger).eject('foo').done(function () {
                    assert.strictEqual(res, 42);
                    assert.strictEqual(foo, 1);
                    assert.strictEqual(bar, 1);

                    setTimeout(function () {
                        new Track(agent, logger).eject('foo').done(function () {
                            assert.strictEqual(res, 42);
                            assert.strictEqual(foo, 2);
                            assert.strictEqual(bar, 2);
                            done();
                        });
                    }, 55);
                });
            });
        });
    });

    it('Should not cache result if one of deps is rejected', function (done) {
        var agent = getAgent({});
        var foo = 0;
        var bar = 0;

        agent.unit({
            base: 0,
            name: 'foo',
            deps: ['bar'],
            main: function (track, context) {
                assert.strictEqual(context.errors.get('bar'), 'baz');
                foo += 1;
                return 42;
            },
            maxAge: 0.05
        });

        agent.unit({
            name: 'bar',
            maxAge: 0.05,
            main: function () {
                bar += 1;
                throw 'baz';
            }
        });

        agent.ready().done(function () {
            new Track(agent, logger).eject('foo').done(function (res) {
                assert.strictEqual(res, 42);
                assert.strictEqual(foo, 1);
                assert.strictEqual(bar, 1);

                new Track(agent, logger).eject('foo').done(function (res) {
                    assert.strictEqual(res, 42);
                    assert.strictEqual(foo, 2);
                    assert.strictEqual(bar, 2);

                    new Track(agent, logger).eject('foo').done(function (res) {
                        assert.strictEqual(res, 42);
                        assert.strictEqual(foo, 3);
                        assert.strictEqual(bar, 3);
                        done();
                    });
                });
            });
        });
    });

    it('Should not call unit if one of deps flushes track', function (done) {
        var agent = getAgent({});
        var foo = 0;

        agent.unit({
            base: 0,
            name: 'foo',
            deps: ['bar'],
            main: function () {
                foo += 1;
                return 42;
            }
        });

        agent.unit({
            name: 'bar',
            main: function (track) {
                track._isFlushed = true;
                assert.ok(track.isFlushed());
                return 146;
            }
        });

        agent.ready().done(function () {

            new Track(agent, logger).eject('foo').done(function (res) {
                assert.strictEqual(res, null);
                assert.strictEqual(foo, 0);
                done();
            });
        });
    });

    it('Should not call unit if one of deps flushes track and rejects', function (done) {
        var agent = getAgent({});
        var foo = 0;

        agent.unit({
            base: 0,
            name: 'foo',
            deps: ['bar'],
            main: function () {
                foo += 1;
                return 42;
            }
        });

        agent.unit({
            name: 'bar',
            main: function (track) {
                track._isFlushed = true;
                throw new Error();
            }
        });

        agent.ready().done(function () {

            new Track(agent, logger).eject('foo').done(function () {
                assert.strictEqual(foo, 0);
                done();
            });
        });
    });

    it('Should fail initialization if dependency is undefined', function (done) {
        var agent = getAgent();

        agent.unit({
            base: 0,
            name: 'foo',
            deps: ['bar']
        });

        agent.ready().done(null, function (err) {
            assert.ok(err);
            done();
        });
    });

    it('Should fail initialization one of deps is self', function (done) {
        var agent = getAgent();

        agent.unit({
            base: 0,
            name: 'foo',
            deps: ['foo']
        });

        agent.ready().done(null, function (err) {
            assert.ok(err);
            done();
        });
    });

    it('Should fail initialization if recursive deps found', function (done) {
        var agent = getAgent();

        agent.unit({
            base: 0,
            name: 'foo',
            deps: ['bar']
        });

        agent.unit({
            base: 0,
            name: 'bar',
            deps: ['foo']
        });

        agent.ready().done(null, function (err) {
            assert.ok(err);
            done();
        });
    });

    it('Can stop resolve next deps if one of them flushes the track', function (done) {
        var agent = getAgent();
        var spy = [];

        agent.unit({
            base: 0,
            name: 'foo',
            deps: ['bar', 'moo', 'zot', 'xyz'],
            main: function () {
                spy.push(0);
            }
        });

        agent.unit({
            base: 0,
            name: 'bar',
            main: function () {
                var defer = vow.defer();
                spy.push(this.name);
                setTimeout(function () {
                    defer.resolve(42);
                }, 10);
                return defer.promise();
            }
        });

        agent.unit({
            base: 0,
            name: 'moo',
            main: function () {
                var defer = vow.defer();
                spy.push(this.name);
                setTimeout(function () {
                    defer.resolve(42);
                }, 20);
                return defer.promise();
            }
        });

        agent.unit({
            base: 0,
            name: 'zot',
            main: function (track) {
                track._isFlushed = true;
                spy.push(this.name);
            }
        });

        agent.unit({
            base: 0,
            name: 'xyz',
            main: function () {
                spy.push(this.name);
            }
        });

        agent.ready().done(function () {
            new Track(agent, logger).eject('foo').done(function (res) {
                assert.strictEqual(res, null);
                setTimeout(function () {
                    assert.deepEqual(spy, ['bar', 'moo', 'zot']);
                    done();
                }, 50);
            });
        });
    });
});
