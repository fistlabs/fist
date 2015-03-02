'use strict';

var FistError = /** @type FistError */ require('../fist-error');

var _ = require('lodash-node');
var f = require('util').format;

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

function buildCache(unit) {
    if (!_.has(unit.app.caches, unit.cache)) {
        throw new FistError('UNKNOWN_CACHE', f('You should define app.caches[%j] interface', unit.cache));
    }

    return unit.app.caches[unit.cache];
}

exports.buildDeps = buildDeps;

exports.buildDepsArgs = buildDepsArgs;

exports.buildDepsMap = buildDepsMap;

exports.buildDepsIndexMap = buildDepsIndexMap;

exports.buildCache = buildCache;
