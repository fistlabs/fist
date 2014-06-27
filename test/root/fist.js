'use strict';

var fist = require('../../');
var Framework = require('../../Framework');

module.exports = [
    function (test) {
        var app = fist({a: 42});
        test.ok(app instanceof Framework);
        test.deepEqual(app.params, {a: 42});
        test.done();
    },
    function (test) {
        var app = fist({a: 42}, {oO: 'test'});
        test.ok(app instanceof Framework);
        test.deepEqual(app.params, {a: 42});
        test.strictEqual(app.oO, 'test');
        test.done();
    }
];
