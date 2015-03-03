'use strict';

var _ = require('lodash-node');
var assert = require('assert');
var inherit = require('inherit');

describe('core/unit', function () {
    var Unit = require('../core/unit');

    function getUnit(app, members, statics) {
        var Unit2 = inherit(Unit, members, statics);
        return new Unit2(app);
    }

    it('Should be a function', function () {
        assert.strictEqual(typeof Unit, 'function');
    });

    describe('unit.params', function () {
        it('Should be an empty object in Unit\'s prototype', function () {
            assert.ok(_.isObject(Unit.prototype.params));
            assert.ok(_.isEmpty(Unit.prototype.params));
        });
        it('Should have a property "params"', function () {
            var unit = getUnit({}, {
                createLogger: function () {},
                createCache: function () {},
                freezeDepsList: function () {},
                freezeDepsMap: function () {},
                freezeDepsIndex: function () {},
                freezeDepsArgs: function () {}
            });
            assert.ok(_.has(unit, 'params'));
        });
        it('Should be an object', function () {
            var unit = getUnit({}, {
                createLogger: function () {},
                createCache: function () {},
                freezeDepsList: function () {},
                freezeDepsMap: function () {},
                freezeDepsIndex: function () {},
                freezeDepsArgs: function () {}
            });
            assert.ok(_.isObject(unit.params));
        });
        it('Should clone prototype\'s params to instance', function () {
            var params = {foo: 'bar'};
            var unit = getUnit({}, {
                createCache: function () {},
                createLogger: function () {},
                freezeDepsList: function () {},
                params: params,
                freezeDepsMap: function () {},
                freezeDepsIndex: function () {},
                freezeDepsArgs: function () {}
            });
            assert.deepEqual(unit.params, params);
            assert.notStrictEqual(unit.params, params);
        });
    });

    describe('unit.app', function () {
        it('Should be just a link to argument', function () {
            var app = {};
            var unit = getUnit(app, {
                createLogger: function () {},
                createCache: function () {},
                freezeDepsList: function () {},
                freezeDepsMap: function () {},
                freezeDepsIndex: function () {},
                freezeDepsArgs: function () {}
            });
            assert.strictEqual(unit.app, app);
        });
    });

    describe('app.cache', function () {
        it('Should be a cache object in Unit\'s prototype', function () {
            assert.ok(_.isObject(Unit.prototype.cache));
            assert.strictEqual(typeof Unit.prototype.cache.get, 'function');
            assert.strictEqual(typeof Unit.prototype.cache.set, 'function');
        });
    });

    describe('app.logger', function () {
        it('Should be a result of unit.createLogger()', function () {
            var logger = {};
            var unit = getUnit({}, {
                createLogger: function () {
                    return logger;
                },
                createCache: function () {},
                freezeDepsList: function () {},
                freezeDepsMap: function () {},
                freezeDepsIndex: function () {},
                freezeDepsArgs: function () {}
            });
            assert.strictEqual(unit.logger, logger);
        });
    });

    describe('unit.deps', function () {
        it('Should be an empty array in Unit\'s prototype', function () {
            assert.ok(_.isArray(Unit.prototype.deps));
            assert.ok(_.isEmpty(Unit.prototype.deps));
        });
        it('Should be a result of unit.freezeDepsList()', function () {
            var deps = [];
            var unit = getUnit({}, {
                createLogger: function () {},
                createCache: function () {},
                freezeDepsList: function () {
                    return deps;
                },
                freezeDepsMap: function () {},
                freezeDepsIndex: function () {},
                freezeDepsArgs: function () {}
            });
            assert.strictEqual(unit.deps, deps);
        });
    });

    describe('unit.depsMap', function () {
        it('Should be an empty object in Unit\'s prototype', function () {
            assert.ok(_.isObject(Unit.prototype.depsMap));
            assert.ok(_.isEmpty(Unit.prototype.depsMap));
        });
        it('Should be a result of unit.freezeDepsMap()', function () {
            var depsMap = {};
            var unit = getUnit({}, {
                createLogger: function () {},
                createCache: function () {},
                freezeDepsMap: function () {
                    return depsMap;
                },
                freezeDepsList: function () {},
                freezeDepsIndex: function () {},
                freezeDepsArgs: function () {}
            });
            assert.strictEqual(unit.depsMap, depsMap);
        });
    });

    describe('unit.depsIndex', function () {
        it('Should be a result of unit.freezeDepsIndex()', function () {
            var depsIndex = {};
            var unit = getUnit({}, {
                createLogger: function () {},
                createCache: function () {},
                freezeDepsMap: function () {},
                freezeDepsList: function () {},
                freezeDepsIndex: function () {
                    return depsIndex;
                },
                freezeDepsArgs: function () {}
            });
            assert.strictEqual(unit.depsIndex, depsIndex);
        });
    });

    describe('unit.depsArgs', function () {
        it('Should be an empty object in Unit\'s prototype', function () {
            assert.ok(_.isObject(Unit.prototype.depsArgs));
            assert.ok(_.isEmpty(Unit.prototype.depsArgs));
        });
        it('Should be a result of unit.freezeDepsArgs()', function () {
            var depsArgs = {};
            var unit = getUnit({}, {
                createLogger: function () {},
                createCache: function () {},
                freezeDepsMap: function () {},
                freezeDepsList: function () {},
                freezeDepsIndex: function () {},
                freezeDepsArgs: function () {
                    return depsArgs;
                }
            });
            assert.strictEqual(unit.depsArgs, depsArgs);
        });
    });

    describe('unit.name', function () {
        it('Should be 0 in Unit\'s prototype', function () {
            assert.strictEqual(Unit.prototype.name, 0);
        });
    });

    describe('unit.freezeDepsList()', function () {
        it('Should be a function', function () {
            var unit = getUnit({}, {
                createLogger: function () {},
                createCache: function () {},
                freezeDepsMap: function () {},
                freezeDepsIndex: function () {},
                freezeDepsArgs: function () {}
            });
            assert.strictEqual(typeof unit.freezeDepsList, 'function');
        });
        it('Should return an array', function () {
            var unit = getUnit({}, {
                deps: [],
                createLogger: function () {},
                createCache: function () {},
                freezeDepsMap: function () {},
                freezeDepsIndex: function () {},
                freezeDepsArgs: function () {}
            });
            assert.ok(_.isArray(unit.deps));
        });
        it('Should return an array of unique values', function () {
            var unit = getUnit({}, {
                deps: ['a', 'b', 'c', 'a', 'c', 'b'],
                createLogger: function () {},
                createCache: function () {},
                freezeDepsMap: function () {},
                freezeDepsIndex: function () {},
                freezeDepsArgs: function () {}
            });
            assert.deepEqual(unit.deps, ['a', 'b', 'c']);
        });
        it('Should return frozen array', function () {
            var unit = getUnit({}, {
                deps: [],
                createLogger: function () {},
                createCache: function () {},
                freezeDepsMap: function () {},
                freezeDepsIndex: function () {},
                freezeDepsArgs: function () {}
            });
            assert.ok(Object.isFrozen(unit.deps));
        });
    });

    describe('unit.freezeDepsMap()', function () {
        it('Should be a function', function () {
            var unit = getUnit({}, {
                freezeDepsList: function () {
                    return [];
                },
                createLogger: function () {},
                createCache: function () {},
                freezeDepsIndex: function () {},
                freezeDepsArgs: function () {}
            });
            assert.strictEqual(typeof unit.freezeDepsMap, 'function');
        });
        it('Should return an object', function () {
            var unit = getUnit({}, {
                freezeDepsList: function () {
                    return [];
                },
                createLogger: function () {},
                createCache: function () {},
                freezeDepsIndex: function () {},
                freezeDepsArgs: function () {}
            });
            assert.ok(_.isObject(unit.depsMap));
        });
        it('Should return a map unitName to resultPath', function () {
            var unit = getUnit({}, {
                freezeDepsList: function () {
                    return ['a', 'b'];
                },
                depsMap: {
                    a: 'foo.a',
                    b: 'foo.b'
                },
                createLogger: function () {},
                createCache: function () {},
                freezeDepsIndex: function () {},
                freezeDepsArgs: function () {}
            });
            assert.deepEqual(unit.depsMap, {
                a: 'foo.a',
                b: 'foo.b'
            });
        });
        it('Should use unit name as resuilt path if no mapping provided', function () {
            var unit = getUnit({}, {
                freezeDepsList: function () {
                    return ['a', 'b'];
                },
                depsMap: {
                    a: 'foo.a'
                },
                createLogger: function () {},
                createCache: function () {},
                freezeDepsIndex: function () {},
                freezeDepsArgs: function () {}
            });
            assert.deepEqual(unit.depsMap, {
                a: 'foo.a',
                b: 'b'
            });
        });
        it('Should skip extra mappings', function () {
            var unit = getUnit({}, {
                freezeDepsList: function () {
                    return ['a', 'b'];
                },
                depsMap: {
                    a: 'foo.a',
                    b: 'foo.b',
                    c: 'foo.c'
                },
                createLogger: function () {},
                createCache: function () {},
                freezeDepsIndex: function () {},
                freezeDepsArgs: function () {}
            });
            assert.deepEqual(unit.depsMap, {
                a: 'foo.a',
                b: 'foo.b'
            });
        });
        it('Should return frozen object', function () {
            var unit = getUnit({}, {
                freezeDepsList: function () {
                    return [];
                },
                depsMap: {},
                createLogger: function () {},
                createCache: function () {},
                freezeDepsIndex: function () {},
                freezeDepsArgs: function () {}
            });
            assert.ok(Object.isFrozen(unit.depsMap));
        });
    });

    describe('unit.freezeDepsArgs()', function () {
        it('Should be a function', function () {
            var unit = getUnit({}, {
                freezeDepsList: function () {
                    return [];
                },
                createLogger: function () {},
                createCache: function () {},
                freezeDepsMap: function () {},
                freezeDepsIndex: function () {}
            });
            assert.strictEqual(typeof unit.freezeDepsArgs, 'function');
        });
        it('Should return an object', function () {
            var unit = getUnit({}, {
                freezeDepsList: function () {
                    return [];
                },
                createLogger: function () {},
                createCache: function () {},
                freezeDepsMap: function () {},
                freezeDepsIndex: function () {}
            });
            assert.ok(_.isObject(unit.depsArgs));
        });
        it('Should return an object that is set of function by unit name', function () {
            var unit = getUnit({}, {
                freezeDepsList: function () {
                    return ['a', 'b'];
                },
                createLogger: function () {},
                createCache: function () {},
                freezeDepsMap: function () {},
                freezeDepsIndex: function () {}
            });
            assert.strictEqual(typeof unit.depsArgs.a, 'function');
            assert.strictEqual(typeof unit.depsArgs.b, 'function');
        });
        it('Should use functions, defined in unit.depsArgs bound to unit', function () {
            var spy = [];
            var unit = getUnit({}, {
                freezeDepsList: function () {
                    return ['a', 'b'];
                },
                depsArgs: {
                    a: argsA,
                    b: argsB
                },
                createLogger: function () {},
                createCache: function () {},
                freezeDepsMap: function () {},
                freezeDepsIndex: function () {}
            });
            function argsA() {
                assert.strictEqual(this, unit);
                spy.push('a');
            }
            function argsB() {
                assert.strictEqual(this, unit);
                spy.push('b');
            }
            assert.strictEqual(typeof unit.depsArgs.a, 'function');
            assert.strictEqual(typeof unit.depsArgs.b, 'function');
            unit.depsArgs.a();
            unit.depsArgs.b();
            assert.deepEqual(spy, ['a', 'b']);
        });
        it('Should generate depsArgs function if not a function specified unit.depsArgs', function () {
            var argsA = {};
            var unit = getUnit({}, {
                freezeDepsList: function () {
                    return ['a'];
                },
                depsArgs: {
                    a: argsA
                },
                createLogger: function () {},
                createCache: function () {},
                freezeDepsMap: function () {},
                freezeDepsIndex: function () {}
            });
            assert.strictEqual(typeof unit.depsArgs.a, 'function');
            assert.strictEqual(unit.depsArgs.a(), argsA);
        });
        it('Should skip extra deps args declarations', function () {
            var unit = getUnit({}, {
                freezeDepsList: function () {
                    return ['a', 'b'];
                },
                depsArgs: {
                    a: {},
                    b: {},
                    c: {}
                },
                createLogger: function () {},
                createCache: function () {},
                freezeDepsMap: function () {},
                freezeDepsIndex: function () {}
            });
            assert.strictEqual(typeof unit.depsArgs.a, 'function');
            assert.strictEqual(typeof unit.depsArgs.b, 'function');
            assert.strictEqual(typeof unit.depsArgs.c, 'undefined');
            assert.deepEqual(Object.keys(unit.depsArgs), unit.deps);
        });
    });

    describe('unit.freezeDepsIndex()', function () {
        it('Should be a function', function () {
            var unit = getUnit({}, {
                freezeDepsList: function () {
                    return [];
                },
                createLogger: function () {},
                createCache: function () {},
                freezeDepsMap: function () {},
                freezeDepsArgs: function () {}
            });
            assert.strictEqual(typeof unit.freezeDepsIndex, 'function');
        });
        it('Should return an object', function () {
            var unit = getUnit({}, {
                freezeDepsList: function () {
                    return [];
                },
                createLogger: function () {},
                createCache: function () {},
                freezeDepsMap: function () {},
                freezeDepsArgs: function () {}
            });
            assert.ok(_.isObject(unit.depsIndex));
        });
        it('Should return a dict with deps items indexes', function () {
            var unit = getUnit({}, {
                freezeDepsList: function () {
                    return ['a', 'b'];
                },
                createLogger: function () {},
                createCache: function () {},
                freezeDepsMap: function () {},
                freezeDepsArgs: function () {}
            });
            assert.deepEqual(unit.depsIndex, {
                a: '0',
                b: '1'
            });
        });
        it('Should return frozen object', function () {
            var unit = getUnit({}, {
                freezeDepsList: function () {
                    return [];
                },
                createLogger: function () {},
                createCache: function () {},
                freezeDepsMap: function () {},
                freezeDepsArgs: function () {}
            });
            assert.ok(Object.isFrozen(unit.depsIndex));
        });
    });

    describe('unit.settings', function () {
        it('Should be an empty object in Unit\'s prototype', function () {
            assert.ok(_.isObject(Unit.prototype.settings));
            assert.ok(_.isEmpty(Unit.prototype.settings));
        });
    });

    describe('unit.createLogger()', function () {
        it('Should be a function', function () {
            var unit = getUnit({
                logger: {
                    bind: function () {
                        return {};
                    }
                }
            }, {
                freezeDepsList: function () {},
                createCache: function () {},
                freezeDepsMap: function () {},
                freezeDepsArgs: function () {},
                freezeDepsIndex: function () {}
            });
            assert.strictEqual(typeof unit.createLogger, 'function');
        });
        it('Should return logger, bound to unit name', function () {
            var logger = {};
            var unit = getUnit({
                logger: {
                    bind: function (name) {
                        assert.strictEqual(name, 'foo');
                        return logger;
                    }
                }
            }, {
                name: 'foo',
                freezeDepsList: function () {},
                createCache: function () {},
                freezeDepsMap: function () {},
                freezeDepsArgs: function () {},
                freezeDepsIndex: function () {}
            });
            assert.strictEqual(unit.logger, logger);
        });
    });
    describe('unit.main()', function () {
        it('Should be noop in Unit\'s prototype', function () {
            assert.strictEqual(Unit.prototype.main, Function.prototype);
        });
    });

    describe('unit.identify()', function () {
        it('Should be a function', function () {
            var unit = getUnit({}, {
                freezeDepsList: function () {},
                createCache: function () {},
                freezeDepsMap: function () {},
                freezeDepsIndex: function () {},
                createLogger: function () {},
                freezeDepsArgs: function () {}
            });
            assert.strictEqual(typeof unit.identify, 'function');
        });
        it('Should return "static" by default', function () {
            var unit = getUnit({}, {
                freezeDepsList: function () {},
                createCache: function () {},
                freezeDepsMap: function () {},
                freezeDepsIndex: function () {},
                createLogger: function () {},
                freezeDepsArgs: function () {}
            });
            assert.strictEqual(unit.identify(), 'static');
        });
    });

    describe('unit.maxAge', function () {
        it('Should be 0 in Unit\'s prototype', function () {
            assert.strictEqual(Unit.prototype.maxAge, 0);
        });
    });

    describe('Unit.inherit()', function () {
        it('Should be a function', function () {
            assert.strictEqual(typeof Unit.inherit, 'function');
        });
        it('Should create subclass of Unit', function () {
            var Unit2 = Unit.inherit();
            var unit = new Unit2({
                logger: {
                    bind: function () {}
                }
            });
            assert.ok(unit instanceof Unit);
            assert.ok(unit instanceof Unit2);

            assert.notStrictEqual(Unit, Unit2);
        });
        it('Should inherit static "inherit" method', function () {
            var Unit2 = Unit.inherit();
            assert.strictEqual(typeof Unit2.inherit, 'function');
        });
        it('Should inherit members', function () {
            var Unit2 = Unit.inherit({
                foo: 'bar',
                baz: 'zot'
            });
            assert.strictEqual(Unit2.prototype.foo, 'bar');
            assert.strictEqual(Unit2.prototype.baz, 'zot');
        });
        it('Should inherit statics', function () {
            var Unit2 = Unit.inherit(null, {
                foo: 'bar',
                baz: 'zot'
            });
            assert.strictEqual(Unit2.foo, 'bar');
            assert.strictEqual(Unit2.baz, 'zot');
        });
        it('Should merge parent\'s deps with own deps', function () {
            var Unit2 = Unit.inherit({
                deps: ['a', 'b']
            });
            var Unit3 = Unit2.inherit({
                deps: ['c', 'd']
            });
            assert.deepEqual(Unit3.prototype.deps, ['a', 'b', 'c', 'd']);
        });
        it('Should automatically add mixin\'s deps', function () {
            var Unit2;
            function Mixin0() {}
            function Mixin1() {}
            Mixin0.prototype.deps = ['c', 'd'];
            Unit2 = Unit.inherit({
                deps: ['a', 'b'],
                mixins: [Mixin0, Mixin1]
            });
            assert.deepEqual(Unit2.prototype.deps, ['a', 'b', 'c', 'd']);
        });
        it('Should extend parent\'s settings with own', function () {
            var settings1 = {foo: 'bar'};
            var settings2 = {bar: 'baz'};
            var Unit2 = Unit.inherit({
                settings: settings1
            });
            var Unit3 = Unit2.inherit({
                settings: settings2
            });
            assert.deepEqual(Unit3.prototype.settings, {
                foo: 'bar',
                bar: 'baz'
            });
        });
        it('Should not directly extend parent\'s settings', function () {
            var settings1 = {foo: 'bar'};
            var settings2 = {bar: 'baz'};
            var Unit2 = Unit.inherit({
                settings: settings1
            });
            var Unit3 = Unit2.inherit({
                settings: settings2
            });
            assert.notStrictEqual(Unit3.prototype.settings, Unit2.prototype.settings);
        });
        it('Should extend parent\'s depsMap', function () {
            var depsMap1 = {foo: 'bar'};
            var depsMap2 = {bar: 'baz'};
            var Unit2 = Unit.inherit({
                deps: ['foo'],
                depsMap: depsMap1
            });
            var Unit3 = Unit2.inherit({
                deps: ['bar'],
                depsMap: depsMap2
            });
            assert.deepEqual(Unit3.prototype.depsMap, {
                foo: 'bar',
                bar: 'baz'
            });
        });
        it('Should not directly extend parent\'s depsMap', function () {
            var depsMap1 = {foo: 'bar'};
            var depsMap2 = {bar: 'baz'};
            var Unit2 = Unit.inherit({
                deps: ['foo'],
                depsMap: depsMap1
            });
            var Unit3 = Unit2.inherit({
                deps: ['bar'],
                depsMap: depsMap2
            });
            assert.notStrictEqual(Unit3.prototype.depsMap, Unit2.prototype.depsMap);
        });
        it('Should extend parent\'s depsArgs', function () {
            var depsArgs1 = {foo: function () {}};
            var depsArgs2 = {bar: function () {}};
            var Unit2 = Unit.inherit({
                deps: ['foo'],
                depsArgs: depsArgs1
            });
            var Unit3 = Unit2.inherit({
                deps: ['bar'],
                depsArgs: depsArgs2
            });
            assert.deepEqual(_.keys(Unit3.prototype.depsArgs), ['foo', 'bar']);
        });
        it('Should not directly extend parent\'s depsArgs', function () {
            var depsArgs1 = {foo: 'bar'};
            var depsArgs2 = {bar: 'baz'};
            var Unit2 = Unit.inherit({
                deps: ['foo'],
                depsArgs: depsArgs1
            });
            var Unit3 = Unit2.inherit({
                deps: ['bar'],
                depsArgs: depsArgs2
            });
            assert.notStrictEqual(Unit3.prototype.depsArgs, Unit2.prototype.depsArgs);
        });
    });
});
