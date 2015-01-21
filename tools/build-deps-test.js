'use strict';

var Core = require('../core/core');
var Track = require('../core/track');

var f = require('util').format;
var uniqueId = require('unique-id');

function noop() {
    return this.name;
}

function buildDeps(unitsCount, depsPerUnit, onInit) {
    var app = new Core({
        logging: {
            logLevel: 'NOTSET'
        }
    });
    var deps;
    var depsCount;
    var unitName = f('unit_%s', unitsCount);

    while (unitsCount) {
        deps = [];
        depsCount = Math.min(unitsCount - 1, depsPerUnit);

        while (depsCount) {
            depsCount -= 1;
            deps[deps.length] = f('unit_%s', unitsCount - depsCount - 1);
        }

        app.unit({
            base: 0,
            name: f('unit_%s', unitsCount),
            deps: deps,
            main: noop
        });
        unitsCount -= 1;
    }

    app.ready().done(function () {
        onInit(function run(done) {
            var logger = app.logger.bind(uniqueId());
            var track = new Track(app, logger);
            app.callUnit(track, unitName, null, function () {
                done();
            });
        });
    });
}

module.exports = buildDeps;
