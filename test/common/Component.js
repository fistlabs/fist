'use strict';

var Component = require('../../Component');
var Knot = Component.extend({
    deps: ['a', 'b', 'a']
});

module.exports = {

    Component: function (test) {

        var k = new Knot();

        test.deepEqual(k.deps, ['a', 'b']);
        test.ok(k.hasOwnProperty('deps'));

        test.done();
    },

    'Component.prototype.addDeps': function (test) {

        var k = new Knot();

        k.addDeps('a', 'c');
        test.deepEqual(k.deps, ['a', 'b', 'c']);
        test.done();
    },

    'Component.prototype.depDeps': function (test) {

        var k = new Knot();

        k.delDeps('a', 'c');
        test.deepEqual(k.deps, ['b']);
        test.done();
    }

};
