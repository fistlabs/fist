'use strict';

var Bluebird = /** @type Promise */ require('bluebird');

var errors = require('./errors');
var f = require('util').format;
var uniqueId = require('unique-id');

/**
 * @class Track
 *
 * @param {Core} app
 * @param {Logger} logger
 * */
function Track(app, logger) {

    /**
     * @public
     * @memberOf {Track}
     * @property
     * @type {String}
     * */
    this.id = this._createId();

    /**
     * TODO Deprecate?
     *
     * @public
     * @memberOf {Track}
     * @property
     * @type {Logger}
     * */
    this.logger = logger;

    /**
     * @public
     * @memberOf {Track}
     * @property
     * @type {Object}
     * */
    this.params = {};

    /**
     * @protected
     * @memberOf {Track}
     * @property
     * @type {Core}
     * */
    this._app = app;

    /**
     * @public
     * @memberOf {Track}
     * @property
     * @type {Object}
     * */
    this.calls = {};

    /**
     * @protected
     * @memberOf {Track}
     * @property
     * @type {Boolean}
     * */
    this._isFlushed = false;
}

/**
 * @public
 * @memberOf {Track}
 * @method
 *
 * @constructs
 * */
Track.prototype.constructor = Track;

/**
 * @protected
 * @memberOf {Connect}
 * @method
 *
 * @returns {String}
 * */
Track.prototype._createId = function () {
    return uniqueId();
};

/**
 * @public
 * @memberOf {Track}
 * @method
 *
 * @param {String} name
 * @param {*} [args]
 *
 * @returns {Promise}
 * */
Track.prototype.invoke = function (name, args) {
    var defer = Bluebird.defer();
    var unit = this._app.getUnit(name);

    if (!(unit instanceof this._app.Unit)) {
        return Bluebird.reject(new errors.NoSuchUnitError(f('Can not invoke unknown unit %j', name)));
    }

    unit.run(this, args, function (runtime) {
        if (runtime.isRejected()) {
            defer.reject(runtime.valueOf());
        } else {
            defer.resolve(runtime.valueOf());
        }
    });

    return defer.promise;
};

/**
 * @public
 * @memberOf {Track}
 * @method
 *
 * @returns {Boolean}
 * */
Track.prototype.isFlushed = function () {
    return this._isFlushed;
};

module.exports = Track;
