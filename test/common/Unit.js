'use strict';

var Unit = require('../../Unit');
var Knot = Unit.extend({
    deps: ['a', 'b', 'a']
});

module.exports = {

    Unit: function (test) {

        var k = new Knot();

        test.deepEqual(k.deps, ['a', 'b']);
        test.ok(k.hasOwnProperty('deps'));

        test.done();
    },

    'Unit.prototype.addDeps': function (test) {

        var k = new Knot();

        k.addDeps('a', 'c');
        test.deepEqual(k.deps, ['a', 'b', 'c']);
        test.done();
    },

    'Unit.prototype.delDeps': function (test) {

        var k = new Knot();

        k.delDeps('a', 'c');
        test.deepEqual(k.deps, ['b']);
        test.done();
    }

};
