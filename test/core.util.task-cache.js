/*global describe, it*/
'use strict';

var assert = require('chai').assert;
var vow = require('vow');

describe('core/util/task-cache', function () {
    /*eslint max-nested-callbacks: [2, 4]*/
    var TaskCache = require('../core/util/task-cache');

    it('Should set value by any key', function () {
        var m = new TaskCache();
        var p = vow.resolve();

        assert.strictEqual(m.set(42, p), m);
        assert.strictEqual(m.get(42), p);

        assert.strictEqual(m.set({a: 42}, p), m);
        assert.strictEqual(m.get({a: 42}), p);
    });

});
