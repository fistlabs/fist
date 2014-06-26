'use strict';

var Unit = require('../../../unit/_unit');
var inherit = require('inherit');

module.exports = {
    Unit: [
        function (test) {

            var unit = new Unit({
                a: 42
            });

            test.deepEqual(unit.params, {
                a: 42
            });

            test.done();
        },
        function (test) {

            var MyUnit = inherit(Unit, {
                deps: [1, 1, 1, 2, 2, 3, 3]
            });

            test.deepEqual(new MyUnit().deps, [1, 2, 3]);

            test.done();
        }
    ],
    'Unit.prototype.addDeps': [
        function (test) {

            var unit = new Unit();

            unit.addDeps([1, 2, 3]);

            test.deepEqual(unit.deps, [1, 2, 3]);

            unit.addDeps(1, 2, 3, 4, [5, 6]);

            test.deepEqual(unit.deps, [1, 2, 3, 4, 5, 6]);

            test.done();
        }
    ],
    'Unit.prototype.delDeps': [
        function (test) {

            var unit = new Unit();

            unit.addDeps(1, 2, 3, 4, 5, 6);

            test.deepEqual(unit.deps, [1, 2, 3, 4, 5, 6]);

            unit.delDeps(1, 2, [3, 4]);

            test.deepEqual(unit.deps, [5, 6]);

            test.done();
        }
    ]
};
