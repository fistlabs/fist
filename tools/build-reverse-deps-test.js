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

function buildDeps(unitsCount, onInit) {
    var app = new Core({
        logging: {
            logLevel: 'SILENT'
        }
    });
    var deps;
    var currentDepsCount = 1;
    var n = String(unitsCount).length;
    var unitName = f('u%s', pad(currentDepsCount, n));
    var i;

    unitsCount = Math.ceil(unitsCount / 2);

    while (unitsCount >= currentDepsCount) {
        deps = [];

        for (i = 0; i < currentDepsCount; i += 1) {
            deps[deps.length] = f('u%s', pad(currentDepsCount + i + 1, n));
        }

        console.log('%s (%s)', f('u%s', pad(currentDepsCount, n)), deps.join(', '));

        app.unit({
            base: 0,
            name: f('u%s', pad(currentDepsCount, n)),
            deps: deps,
            main: noop
        });

        currentDepsCount += 1;
    }

    for (i = 0; i < deps.length; i += 1) {
        console.log('%s ()', deps[i]);

        app.unit({
            base: 0,
            name: deps[i],
            deps: [],
            main: noop
        });
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
