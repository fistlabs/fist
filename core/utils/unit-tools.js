'use strict';

var _ = require('lodash-node');

function buildDeps(unit) {
    return Object.freeze(_.uniq(unit.deps));
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

function buildDepsIndexMap(unit) {
    var depsIndexMap = {};
    _.forEach(unit.deps, function (name, i) {
        depsIndexMap[name] = i;
    });
    return Object.freeze(depsIndexMap);
}

exports.buildDeps = buildDeps;

exports.buildDepsArgs = buildDepsArgs;

exports.buildDepsMap = buildDepsMap;

exports.buildDepsIndexMap = buildDepsIndexMap;
