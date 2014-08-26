/*global describe, it*/
'use strict';

var assert = require('chai').assert;

describe('core/util/equal-map', function () {
    /*eslint max-nested-callbacks: [2, 4]*/
    var EqualMap = require('../core/util/equal-map');

    it('Should set value by any key', function () {
        var m = new EqualMap();

        assert.strictEqual(m.set({a: 42}, 100500), m);
        assert.strictEqual(m.get({a: 42}), 100500);
        assert.strictEqual(m.set({a: 42}, 777), m);
        assert.strictEqual(m.get({a: 42}), 777);
        assert.strictEqual(m.set({a: 43}, 42), m);
        assert.strictEqual(m.get({a: 42}), 777);
        assert.strictEqual(m.get({a: 43}), 42);
        assert.strictEqual(m.get({a: 44}), void 0);
    });

});
