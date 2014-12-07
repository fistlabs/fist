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

    it('Should set params.implicitBase by default', function () {
        var app = fist();
        assert.strictEqual(app.params.implicitBase, '_fist_contrib_unit');
    });

    it('Should automatically install bundled plugins', function (done) {
        var app = fist();

        app.ready().done(function () {
            var units = ['_fist_contrib_unit',
                '_fist_contrib_unit_asker',
                '_fist_contrib_unit_serial',
                'fist_contrib_unit_incoming'];

            units.forEach(function (name) {
                assert.strictEqual(typeof app.getUnitClass(name), 'function');
            });

            done();
        });
    });
});
