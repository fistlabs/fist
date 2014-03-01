'use strict';

var Knot = require('../Knot');
var K = Knot.extend({
    deps: ['a', 'b', 'a']
});

module.exports = {

    Knot: function (test) {

        var k = new K();

        test.deepEqual(k.deps, ['a', 'b']);
        test.ok(k.hasOwnProperty('deps'));

        test.done();
    },

    'Knot.prototype.addDeps': function (test) {

        var k = new K();

        k.addDeps('a', 'c');
        test.deepEqual(k.deps, ['a', 'b', 'c']);
        test.done();
    },

    'Knot.prototype.depDeps': function (test) {

        var k = new K();

        k.delDeps('a', 'c');
        test.deepEqual(k.deps, ['b']);
        test.done();
    }

};
