'use strict';

var R_NAME = /^[_a-z]\w*(?:\.[_a-z]\w*)*$/i;

var Bluebird = /** @type Promise */ require('bluebird');

var _ = require('lodash-node');
var errors = require('./errors');
var f = require('util').format;
var init = require('./init');
var logging = require('loggin');
var path = require('path');
var ctools = require('./utils/core-tools');
var promiseGlob = Bluebird.promisify(require('glob'));

/**
 * @class Core
 * @param {Object} [params]
 * */
function Core(params) {
    params = this._createParams(params);

    /**
     * @public
     * @memberOf {Core}
     * @property
     * @type {Object}
     * */
    this.caches = Object.create(null);

    /**
     * @public
     * @memberOf {Core}
     * @property
     * @type {Object}
     * */
    this.params = params;

    /**
     * @public
     * @memberOf {Core}
     * @property
     * @type {Logger}
     * */
    this.logger = logging.getLogger(params.name).conf(params.logging);

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

    /**
     * @protected
     * @memberOf {Core}
     * @property
     * @type {Array}
     * */
    this._installed = {};

    init(this);
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
 * @param {Object|String} aliasFrom
 * @param {String} [aliasTo]
 *
 * @returns {Core}
 * */
Core.prototype.alias = function (aliasFrom, aliasTo) {
    if (_.isObject(aliasFrom)) {
        _.forOwn(aliasFrom, function (name, base) {
            this.unit({
                base: base,
                name: name
            });
        }, this);

        return this;
    }

    this.unit({
        base: aliasFrom,
        name: aliasTo
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
    var name = members.name;

    if (!(_.has(members, 'name') && _.isString(name) && R_NAME.test(name))) {
        throw new errors.BadUnitError(f('Unit name %j should be identifier (%s)', name, R_NAME.source));
    }

    members = Object(members);
    statics = Object(statics);

    members.settings = _.extend({}, members.settings, this.params.unitSettings[members.name]);

    this._decls.push({
        members: members,
        statics: statics
    });

    return this;
};

/**
 * @public
 * @memberOf {Core}
 * @method
 *
 * @param {String} name
 *
 * @returns {Unit}
 * */
Core.prototype.getUnit = function (name) {
    return this._units[name];
};

/**
 * @public
 * @memberOf {Core}
 * @method
 *
 * @param {*} name
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
 * @returns {Promise}
 * */
Core.prototype.ready = function () {
    if (this.__readyPromise) {
        //  already initialized
        return this.__readyPromise;
    }

    this.logger.debug('Starting...');

    this.__readyPromise = this._getReady();

    /** @this {Core} */
    this.__readyPromise.bind(this).done(function () {
        this.logger.debug('Ready.');
    }, function (err) {
        this.logger.fatal(err);
    });

    return this.__readyPromise;
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
 *
 * @returns {Core}
 * */
Core.prototype.install = function (moduleName) {

    try {
        //  is module
        moduleName = require.resolve(moduleName);

        this.plugin(createInstaller(moduleName));

    } catch (err) {
        this.plugin(function (app) {
            var opts = {silent: true, cwd: app.params.root};
            return promiseGlob(moduleName, opts).then(function (paths) {
                _.forEach(paths, function (fileName) {
                    app.plugin(createInstaller(fileName));
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
 * @param {*} [params]
 *
 * @returns {Object}
 * */
Core.prototype._createParams = function (params) {
    var parent = module;

    while (parent.parent) {
        parent = parent.parent;
    }

    params = _.extend({
        root: path.dirname(parent.filename),
        implicitBase: null
    }, params);

    params.unitSettings = _.mapValues(params.unitSettings, _.clone);

    return params;
};

/**
 * @protected
 * @memberOf {Core}
 * @method
 *
 * @returns {Promise}
 * */
Core.prototype._getReady = function () {
    var noop = Function.prototype;
    /** @this {Core} */
    return this._installPlugin(noop).bind(this).
        then(function () {
            this._class = ctools.createUnitClasses(this);
            this._units = ctools.createUnits(this);

            ctools.assertAllUnitDepsOk(this);
        });
};

/**
 * @protected
 * @memberOf {Core}
 * @method
 *
 * @param {Function} plug
 *
 * @returns {Promise}
 * */
Core.prototype._installPlugin = function (plug) {
    /** @this {Core} */
    return this._callPlugin(plug).bind(this).then(function () {
        var plugs = this._plugs;
        this._plugs = [];
        //  install children plugins
        return _.reduce(plugs, function (promise, childPlug) {
            return promise.then(function () {
                return this._installPlugin(childPlug);
            });
        }, Bluebird.resolve().bind(this), this);
    });

};

/**
 * @private
 * @memberOf {Core}
 * @method
 *
 * @param {Function} func
 *
 * @returns {Promise}
 * */
Core.prototype._callPlugin = function (func) {
    if (!_.isFunction(func)) {
        //  is not a function, just resolve
        return Bluebird.resolve(func);
    }

    if (func.length < 2) {
        //  synchronous plugin
        return Bluebird.attempt(func, [this]);
    }

    //  asynchronous plugin
    return Bluebird.attempt(function (app) {
        var defer = Bluebird.defer();

        func(app, function done(err) {
            if (arguments.length) {
                //  done(err);
                defer.reject(err);
            } else {
                //  done();
                defer.resolve();
            }
        });

        return defer.promise;
    }, [this]);
};

function createInstaller(moduleName) {
    return function (app) {
        if (_.has(app._installed, moduleName)) {
            app.logger.debug('The plugin %s has already installed, skipping', moduleName);
            return;
        }

        app._installed[moduleName] = true;

        app.logger.debug('Installing plugin %s', moduleName);
        app.plugin(require(moduleName));
    };
}

module.exports = Core;
