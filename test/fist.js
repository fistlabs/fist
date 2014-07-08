/*global describe, it*/
'use strict';

var assert = require('chai').assert;
var Framework = require('../Framework');

describe('fist', function () {

    var fist = require('../fist');

    it('Should be a function', function () {
        assert.isFunction(fist);
    });

    it('Should return a Framework instance', function () {
        var app = fist({a: 42}, {test: 'str'}, {st: 0});

        assert.instanceOf(app, Framework);
        assert.property(app, 'params');
        assert.isObject(app.params);
        assert.strictEqual(app.params.a, 42);

        assert.property(app, 'test');
        assert.isString(app.test);
        assert.strictEqual(app.test, 'str');

        assert.property(app.__self, 'st');
        assert.isNumber(app.__self.st);
        assert.strictEqual(app.__self.st, 0);
    });
});
