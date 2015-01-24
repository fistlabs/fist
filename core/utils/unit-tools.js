'use strict';

var _ = require('lodash-node');

function buildDeps(unit) {
    return Object.freeze(_.uniq(unit.deps));
}

function buildDepsMap(unit) {
    var depsMap = {};

    _.forEach(unit.deps, function (name) {
        if (_.has(unit.depsMap, name)) {
            depsMap[name] = unit.depsMap[name];
        } else {
            depsMap[name] = name;
        }
    });

    return Object.freeze(depsMap);
}

function buildDepsArgs(unit) {
    var depsArgs = {};

    _.forEach(unit.deps, function (name) {
        var args = unit.depsArgs[name];
        if (_.isFunction(args)) {
            depsArgs[name] = args.bind(unit);
        } else {
            depsArgs[name] = function () {
                return args;
            };
        }
    });

    return Object.freeze(depsArgs);
}

function buildDepsIndexMap(unit) {
    var depsIndexMap = {};
    _.forEach(unit.deps, function (name, i) {
        depsIndexMap[name] = i;
    });
    return Object.freeze(depsIndexMap);
}

function buildRuntimeInitBits(unit) {
    if (!(unit.maxAge > 0)) {
        return parseInt('00000010', 2);
    }

    return 0;
}

exports.buildDeps = buildDeps;

exports.buildDepsArgs = buildDepsArgs;

exports.buildDepsMap = buildDepsMap;

exports.buildDepsIndexMap = buildDepsIndexMap;

exports.buildRuntimeInitBits = buildRuntimeInitBits;
