/*global describe, it*/
'use strict';

var Path = require('path');
var Tracker = require('../Tracker');
var assert = require('chai').assert;

describe('fist/plug/units', function () {
    it('Should declare units', function (done) {
        var FIXTURES_PATH = Path.join(__dirname,
            'fixtures', 'units', 'u', '**', '*.js');

        var tracker = new Tracker({
            units: FIXTURES_PATH
        });

        assert.deepEqual(tracker.params.units, [
            Tracker.BUNDLED_UNITS_PATH,
            FIXTURES_PATH
        ]);

        tracker.ready().done(function () {
            assert.isDefined(tracker.getUnit('u0'));
            assert.isDefined(tracker.getUnit('u1'));
            done();
        });
    });

    it('Should reject init', function (done) {

        var FIXTURES_PATH = Path.join(__dirname,
            'fixtures', 'units', 'e0', '**', '*.js');

        var tracker = new Tracker({
            units: FIXTURES_PATH
        });

        assert.deepEqual(tracker.params.units, [
            Tracker.BUNDLED_UNITS_PATH,
            FIXTURES_PATH
        ]);

        tracker.ready().done(null, function (err) {
            assert.strictEqual(err, 'e0');
            done();
        });
    });

    it('Should reject init coz params.units is wrong', function (done) {

        var tracker = new Tracker({
            units: [null]
        });

        tracker.ready().done(null, function (err) {
            assert.instanceOf(err, Error);
            done();
        });
    });
});
