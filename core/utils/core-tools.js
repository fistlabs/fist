'use strict';

var FistError = /** @type FistError */ require('../fist-error');

var _ = require('lodash-node');
var f = require('util').format;

function createUnits(self) {
    var units = {};

    _.forOwn(self._class, function (UnitClass, name) {
        if (/^[a-z]/i.test(name)) {
            units[name] = new UnitClass();
        }
    });

    return Object.freeze(units);
}

function createUnitClasses(self) {
    var classes = {};
    _.forEach(self._decls, function (decl) {
        classes[decl.members.name] = createUnitClass(self, decl);
    });
    return Object.freeze(classes);
}

function createUnitClass(self, decl) {
    var members = decl.members;
    var statics = decl.statics;
    var name = members.name;
    var base;
    var baseDecl;
    var UnitClass;

    if (_.isFunction(decl.__class)) {
        //  Was already created
        return decl.__class;
    }

    base = members.base;

    //  Looking for base
    if (_.isUndefined(base)) {
        base = self.params.implicitBase;
        self.logger.debug('The base for unit "%s" is implicitly defined as "%s"', name, base);
    }

    if (base === self.Unit.prototype.name) {
        UnitClass = self.Unit.inherit(members, statics);
    } else {
        baseDecl = _.find(self._decls, {members: {name: base}});

        if (!baseDecl) {
            throw new FistError(FistError.NO_SUCH_UNIT, f('No base found for unit "%s" ("%s")', name, base));
        }

        //  may implicitly create
        UnitClass = createUnitClass(self, baseDecl).inherit(members, statics);
    }

    decl.__class = UnitClass;

    return UnitClass;
}

function assertAllUnitDepsOk(self) {

    _.forOwn(self._units, function (unit) {
        assertUnitDepsOk(unit, []);
    });

    function assertUnitDepsOk(unit, unitDepsPath) {
        if (unit.__valid) {
            return;
        }

        _.forEach(unit.deps, function (depName) {
            var depUnit = self._units[depName];

            if (!depUnit) {
                throw new FistError(FistError.NO_SUCH_UNIT,
                    f('There is no dependency %j for unit %j', depName, unit.name));
            }

            if (_.contains(unitDepsPath, depName)) {
                throw new FistError(FistError.DEPS_CONFLICT,
                    f('Recursive dependencies found: "%s" < "%s"', unitDepsPath.join('" < "'), depName));
            }

            assertUnitDepsOk(depUnit, unitDepsPath.concat(depName));
        });

        unit.__valid = true;
    }
}

exports.createUnitClasses = createUnitClasses;

exports.createUnits = createUnits;

exports.assertAllUnitDepsOk = assertAllUnitDepsOk;
