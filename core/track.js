'use strict';

var FistError = /* @type FistError */ require('./fist-error');

var f = require('util').format;
var vow = require('vow');

/**
 * @class Track
 * @param {Server} agent
 * @param {Logger} logger
 * */
function Track(agent, logger) {

    /**
     * @public
     * @memberOf {Track}
     * @property
     * @type {String}
     * */
    this.id = null;

    /**
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
     * @type {Server}
     * */
    this._agent = agent;

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
 * @public
 * @memberOf {Track}
 * @method
 *
 * @param {String} name
 * @param {*} [args]
 *
 * @returns {vow.Promise}
 * */
Track.prototype.invoke = function (name, args) {
    var defer = vow.defer();
    var unit = this._agent.getUnit(name);

    if (!(unit instanceof this._agent.Unit)) {
        return vow.reject(new FistError(FistError.NO_SUCH_UNIT, f('Can not invoke unknown unit %j', name)));
    }

    unit.run(this, args, function () {
        if (this.isRejected()) {
            defer.reject(this.valueOf());
        } else {
            defer.resolve(this.valueOf());
        }
    });

    return defer.promise();
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
