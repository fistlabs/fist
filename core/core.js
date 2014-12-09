'use strict';

var R_NAME = /^[_a-z]\w*$/;

var FistError = /** @type FistError */ require('./fist-error');
var UnitCommon = /** @type UnitCommon */ require('./unit-common');
var SemVer = /** @type SemVer */ require('semver');

var _ = require('lodash-node');
var f = require('util').format;
var fs = require('fs');
var hasProperty = Object.prototype.hasOwnProperty;
var logging = require('loggin');
var path = require('path');
var stackTrace = require('stack-trace');
var vow = require('vow');
var vowFs = require('vow-fs');

/**
 * @class Core
 * @param {Object} [params]
 * */
function Core(params) {

    /**
     * @public
     * @memberOf {Core}
     * @property
     * @type {Function}
     * */
    this.Unit = UnitCommon.createClass(this);

    params = _.extend({
        root: path.dirname(getMainFileName()),
        unitRanges: {},
        implicitBase: this.Unit.prototype.name
    }, params);

    /**
     * @public
     * @memberOf {Core}
     * @property
     * @type {Logger}
     * */
    this.logger = logging.getLogger(params.name).
        conf(params.logging);

    /**
     * @public
     * @memberOf {Core}
     * @property
     * @type {Object}
     * */
    this.params = params;

    /**
     * @protected
     * @memberOf {Core}
     * @property
     * @type {Object}
     * */
    this._class = {};

    /**
     * @protected
     * @memberOf {Core}
     * @property
     * @type {Array}
     * */
    this._decls = [];

    /**
     * @protected
     * @memberOf {Core}
     * @property
     * @type {Object}
     * */
    this._units = {};

    /**
     * @protected
     * @memberOf {Core}
     * @property
     * @type {Array}
     * */
    this._plugs = [];
}

/**
 * @private
 * @memberOf {Core}
 * @method
 *
 * @constructs
 * */
Core.prototype.constructor = Core;

/**
 * @public
 * @memberOf {Core}
 * @method
 *
 * @param {Object|String} base
 * @param {String} [name]
 *
 * @returns {Core}
 * */
Core.prototype.alias = function (base, name) {
    if (_.isObject(base)) {
        _.forOwn(base, function (name, base) {
            this.unit({
                base: base,
                name: name
            });
        }, this);

        return this;
    }

    this.unit({
        base: base,
        name: name
    });

    return this;
};

/**
 * @public
 * @memberOf {Core}
 * @method
 *
 * @param {Object} members
 * @param {Object} [statics]
 *
 * @returns {Core}
 * */
Core.prototype.unit = function (members, statics) {
    var ranges = Object(this.params.unitRanges);
    var decl;
    var version;
    var name = members.name;

    if (!(_.has(members, 'name') && _.isString(name) && R_NAME.test(name))) {
        throw new FistError(FistError.BAD_UNIT, f('Unit name %j should be identifier (%(source)s)', name, R_NAME));
    }

    members = Object(members);
    statics = Object(statics);
    name = members.name;
    version = findClosestVersion(path.resolve(stackTrace.get(this.unit)[0].getFileName())) || '0.0.0';

    this.logger.debug('Installing unit "%s@%s"...', name, version);

    if (_.has(ranges, name) && !SemVer.satisfies(version, ranges[name])) {
        this.logger.warn('The unit "%s@%s" is not satisfies the requirement (%s), skipping',
            name, version, ranges[name]);

        return this;
    }

    decl = _.find(this._decls, {members: {name: name}});

    if (decl) {
        this.logger.warn('Found the same declaration while installing unit "%s@%s"', name, version);

        if (SemVer.lte(version, decl.version)) {
            this.logger.warn('The version of unit "%s@%s" is less or equal to existing "%s@%s", skipping',
                name, version, name, decl.version);

            return this;
        }

        this.logger.warn('Replacing unit "%s@%s" by "%s@%s"', name, decl.version, name, version);

        _.pull(this._decls, decl);
    }

    this._decls.push({
        version: version,
        members: members,
        statics: statics
    });

    this.logger.debug('The unit "%s@%s" is successfully scheduled for initialization', name, version);

    return this;
};

/**
 * @public
 * @memberOf {Core}
 * @method
 *
 * @param {String} name
 *
 * @returns {UnitCommon}
 * */
Core.prototype.getUnit = function (name) {
    return this._units[name];
};

/**
 * @public
 * @memberOf {Core}
 * @method
 *
 * @param {String} name
 * @param {Track} track
 * @param {Object} [args]
 *
 * @returns {*}
 *
 * @throws {FistError}
 * */
Core.prototype.callUnit = function (name, track, args) {
    if (hasProperty.call(this._units, name)) {
        return track.invoke(this._units[name], args);
    }

    throw new FistError(FistError.NO_SUCH_UNIT, f('Can not call unknown unit "%s"', name));
};

/**
 * @public
 * @memberOf {Core}
 * @method
 *
 * @param {String} name
 *
 * @returns {Object}
 * */
Core.prototype.getUnitClass = function (name) {
    return this._class[name];
};

/**
 * @public
 * @memberOf {Core}
 * @method
 *
 * @returns {vow.Promise}
 * */
Core.prototype.ready = function () {
    if (this.__ready) {
        //  already initialized
        return this.__ready;
    }

    this.logger.debug('Pending...');

    this.__ready = this._getReady();

    /** @this {Core} */
    this.__ready.done(function () {
        this.logger.note('Ready.');
    }, function (err) {
        this.logger.fatal('Failed to start application', err);
    }, this);

    return this.__ready;
};

/**
 * @public
 * @memberOf {Core}
 * @method
 *
 * @param {*} plugin
 *
 * @returns {Core}
 * */
Core.prototype.plugin = function (plugin) {
    this._plugs.push(plugin);
    return this;
};

/**
 * @public
 * @memberOf {Core}
 * @method
 *
 * @param {String} moduleName
 * @param {*} [settings]
 *
 * @returns {Core}
 * */
Core.prototype.install = function (moduleName, settings) {

    try {
        //  is module
        moduleName = require.resolve(moduleName);

        this.plugin(createInstaller(moduleName, settings));

    } catch (err) {
        this.plugin(function (agent) {
            var opts = {silent: true, cwd: agent.params.root};
            return vowFs.glob(moduleName, opts).then(function (paths) {
                _.forEach(paths, function (fileName) {
                    agent.plugin(createInstaller(fileName, settings));
                });
            });
        });
    }

    return this;
};

/**
 * @protected
 * @memberOf {Core}
 * @method
 *
 * @returns {vow.Promise}
 * */
Core.prototype._getReady = function () {
    return shiftPlugins.call(this, vow.resolve()).
        then(createUnits, this);
};

function createInstaller(moduleName, settings) {
    return function (agent) {
        if (settings) {
            agent.logger.debug('Installing plugin %s(%j)', moduleName, settings);
            agent.plugin(require(moduleName)(settings));
        } else {
            agent.logger.debug('Installing plugin %s', moduleName);
            agent.plugin(require(moduleName));
        }
    };
}

function shiftPlugins(promise) {
    return promise.then(function () {
        //  plugins can install other plugins
        if (!_.size(this._plugs)) {
            return void 0;
        }

        return shiftPlugins.call(this, callPlugin.call(this, this._plugs.shift()));
    }, this);
}

function callPlugin(func) {
    if (!_.isFunction(func)) {
        //  is not a function, just resolve
        return vow.resolve(func);
    }

    if (func.length < 2) {
        //  synchronous plugin
        return vow.invoke(func, this);
    }

    //  asynchronous plugin
    return vow.invoke(function (self) {
        var defer = vow.defer();

        func(self, function done(err) {
            if (!arguments.length) {
                //  done();
                defer.resolve();
            } else {
                //  done(err);
                defer.reject(err);
            }
        });

        return defer.promise();
    }, this);
}

function createUnits() {

    return _.reduce(this._decls, function (promise, decl) {
        return promise.then(function () {
            return createUnitClass.call(this, decl);
        }, this);
    }, vow.resolve(), this).then(function () {
        return _.reduce(this._class, function (units, UnitClass) {
            var name = UnitClass.prototype.name;

            if (/^[a-z]/i.test(name)) {
                this._units[name] = new UnitClass();
            }

            return units;
        }, {}, this);
    }, this);
}

function createUnitClass(decl) {
    var members = decl.members;
    var statics = decl.statics;
    var name = members.name;
    var base;
    var promise;

    if (_.has(this._class, name)) {
        //  Was already created
        return vow.resolve(this._class[name]);
    }

    base = members.base;

    //  Looking for base
    if (!base) {
        base = this.params.implicitBase;
        this.logger.warn('The base for unit "%s" is implicitly defined as "%s"', name, base);
    }

    if (base === this.Unit.prototype.name) {
        promise = vow.invoke(function (self) {
            return self.Unit.inherit(members, statics);
        }, this);
    } else {
        promise = _.find(this._decls, {members: {name: base}});

        if (!promise) {
            return vow.reject(new FistError(FistError.NO_SUCH_UNIT,
                f('No base found for unit "%s" ("%s")', name, base)));
        }

        promise = createUnitClass.call(this, promise).then(function (Base) {
            return Base.inherit(members, statics);
        });
    }

    return promise.then(function (UnitClass) {
        this._class[name] = UnitClass;
        return UnitClass;
    }, this);
}

function getMainFileName() {
    var current = module;

    while (current.parent) {
        current = current.parent;
    }

    return current.filename;
}

function findClosestVersion(dirname) {
    var filename;

    do {
        dirname = path.dirname(dirname);
        filename = path.join(dirname, 'package.json');

        if (fs.existsSync(filename)) {
            return require(filename).version;
        }

    } while (dirname !== '/');

    return void 0;
}

module.exports = Core;
