/*eslint no-console: 0*/
'use strict';

var Core = require('../core/core');
var Track = require('../core/track');

var f = require('util').format;
var uniqueId = require('unique-id');

function noop() {
    return this.name;
}

function pad(s, n) {
    s = String(s);
    while (s.length < n) {
        s = '0' + s;
    }
    return s;
}

function buildDeps(unitsCount, depsPerUnit, onInit) {
    var app = new Core({
        logging: {
            logLevel: 'SILENT'
        }
    });
    var deps;
    var depsCount;
    var unitName = f('u%s', unitsCount);
    var i;
    var n = unitsCount.toString().length;

    while (unitsCount) {
        deps = [];
        depsCount = Math.min(unitsCount - 1, depsPerUnit);

        for (i = 0; i < depsCount; i += 1) {
            deps[deps.length] = f('u%s', pad(unitsCount - i - 1, n));
        }

        console.log('%s (%s)', f('u%s', pad(unitsCount, n)), deps.join(', '));

        app.unit({
            base: 0,
            name: f('u%s', pad(unitsCount, n)),
            deps: deps,
            main: noop
        });
        unitsCount -= 1;
    }

    app.ready().done(function () {
        onInit(function run(done) {
            var logger = app.logger.bind(uniqueId());
            var track = new Track(app, logger);
            var unit = app.getUnit(unitName);
            unit.run(track, null, function () {
                done();
            });
        });
    });
}

module.exports = buildDeps;
