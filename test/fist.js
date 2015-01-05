/*eslint max-nested-callbacks: 0*/
/*global describe, it*/
'use strict';

var assert = require('assert');

describe('fist', function () {
    var Server = require('../core/server');
    var fist = require('../fist');

    it('Should be an instance of Server', function () {
        var app = fist();
        assert.ok(app instanceof Server);
    });
});
