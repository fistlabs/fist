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
});
