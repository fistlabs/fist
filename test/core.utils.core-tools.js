/*eslint max-nested-callbacks: 0, no-proto: 0*/
/*global describe, it*/

'use strict';

var assert = require('assert');
var inherit = require('inherit');

function Unit () {}

Unit.prototype.name = 0;

Unit.inherit = function (members, statics) {
    return inherit(this, members, statics);
};

describe('core/utils/core-tools', function () {
    var ctools = require('../core/utils/core-tools');

    describe('ctools.createUnitClasses()', function () {
        it('Should create classes object from declaration', function () {
            var core = {
                Unit: Unit,
                _decls: []
            };
            var classes = ctools.createUnitClasses(core);
            assert.ok(classes);
            assert.strictEqual(typeof classes, 'object');
            assert.ok(Object.isFrozen(classes));
        });

        it('Should implicitly inherit from base unit', function () {
            var core = {
                Unit: Unit,
                logger: {
                    debug: function () {}
                },
                params: {
                    implicitBase: 0
                },
                _decls: [
                    {
                        members: {
                            name: 'foo'
                        }
                    }
                ]
            };
            var classes = ctools.createUnitClasses(core);
            assert.strictEqual(typeof classes.foo, 'function');
            assert.ok(new classes.foo() instanceof core.Unit);
        });

        it('Should explicitly inherit from specified unit', function () {
            var core = {
                Unit: Unit,
                logger: {
                    debug: function () {}
                },
                params: {
                    implicitBase: 0
                },
                _decls: [
                    {
                        members: {
                            base: 'bar',
                            name: 'foo'
                        }
                    },
                    {
                        members: {
                            name: 'bar',
                            x: 42
                        }
                    }
                ]
            };
            var classes = ctools.createUnitClasses(core);
            assert.strictEqual(typeof classes.foo, 'function');
            assert.strictEqual(typeof classes.bar, 'function');
            assert.ok(new classes.foo() instanceof core.Unit);
            assert.ok(new classes.bar() instanceof core.Unit);
            assert.strictEqual(new classes.foo().name, 'foo');
            assert.strictEqual(new classes.bar().name, 'bar');
            assert.strictEqual(new classes.foo().x, 42);
            assert.strictEqual(new classes.bar().x, 42);

            assert.ok(new classes.foo() instanceof classes.bar);
        });

        it('Should correct create few classes with same base', function () {
            var core = {
                Unit: Unit,
                logger: {
                    debug: function () {}
                },
                params: {
                    implicitBase: 0
                },
                _decls: [
                    {
                        members: {
                            name: 'foo',
                            base: 'bar'
                        }
                    },
                    {
                        members: {
                            name: 'baz',
                            base: 'bar'
                        }
                    },
                    {
                        members: {
                            name: 'bar',
                            x: 42
                        }
                    }
                ]
            };

            var classes = ctools.createUnitClasses(core);

            assert.strictEqual(typeof classes.foo, 'function');
            assert.strictEqual(typeof classes.bar, 'function');
            assert.strictEqual(typeof classes.baz, 'function');
            assert.ok(new classes.foo() instanceof core.Unit);
            assert.ok(new classes.bar() instanceof core.Unit);
            assert.ok(new classes.baz() instanceof core.Unit);
            assert.strictEqual(new classes.foo().name, 'foo');
            assert.strictEqual(new classes.bar().name, 'bar');
            assert.strictEqual(new classes.baz().name, 'baz');
            assert.strictEqual(new classes.foo().x, 42);
            assert.strictEqual(new classes.bar().x, 42);
            assert.strictEqual(new classes.baz().x, 42);

            assert.ok(new classes.foo() instanceof classes.bar);
            assert.ok(new classes.baz() instanceof classes.bar);
        });

        it('Should be failed if no base found', function () {
            var core = {
                Unit: Unit,
                logger: {
                    debug: function () {}
                },
                params: {
                    implicitBase: 0
                },
                _decls: [
                    {
                        members: {
                            name: 'foo',
                            base: 'bar'
                        }
                    }
                ]
            };
            assert.throws(function () {
                ctools.createUnitClasses(core);
            });
        });
    });

    describe('ctools.createUnits()', function () {
        it('Should create frozen object', function () {
            var core = {
                _class: {}
            };
            var units = ctools.createUnits(core);
            assert.ok(Object.isFrozen(units));
        });

        it('Should create units from classes', function () {
            var core = {
                _class: {
                    foo: Unit
                }
            };
            var units = ctools.createUnits(core);
            assert.ok(units.foo);
            assert.ok(units.foo instanceof core._class.foo);
        });

        it('Should not instantiate abstract units', function () {
            var spy = 0;
            var core = {
                _class: {
                    _foo: function () {
                        spy = 1;
                    }
                }
            };
            ctools.createUnits(core);
            assert.strictEqual(spy, 0);
        });
    });

    describe('ctools.assertAllUnitDepsOk()', function () {

        it('Should not fail if no units installed', function () {
            var core = {_units: {}};
            ctools.assertAllUnitDepsOk(core);
        });

        it('Should not fail if one unit installed', function () {
            var core = {
                _units: {
                    foo: {
                        name: 'foo',
                        deps: []
                    }
                }
            };

            ctools.assertAllUnitDepsOk(core);
        });

        it('Should not fail if unit with deps installed', function () {
            var core = {
                _units: {
                    foo:  {
                        name: 'foo',
                        deps: ['bar']
                    },
                    bar: {
                        name: 'bar',
                        deps: []
                    }
                }
            };

            ctools.assertAllUnitDepsOk(core);
        });

        it('Should not fail on few units with same deps', function () {
            var core = {
                _units: {
                    foo: {
                        name: 'foo',
                        deps: ['bar']
                    },
                    baz: {
                        name: 'baz',
                        deps: ['bar']
                    },
                    bar: {
                        name: 'bar',
                        deps: []
                    }
                }
            };

            ctools.assertAllUnitDepsOk(core);
        });

        it('Should fail if recursive dependencies found', function () {
            var core = {
                _units: {
                    foo: {
                        name: 'foo',
                        deps: ['foo']
                    }
                }
            };

            assert.throws(function () {
                ctools.assertAllUnitDepsOk(core);
            });
        });

        it('Should fail if no dependency found', function () {
            var core = {
                _units: {
                    foo: {
                        name: 'foo',
                        deps: ['bar']
                    }
                }
            };

            assert.throws(function () {
                ctools.assertAllUnitDepsOk(core);
            });
        });
    });
});
