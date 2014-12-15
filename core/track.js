'use strict';

var hasProperty = Object.prototype.hasOwnProperty;

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
     * @protected
     * @memberOf {Track}
     * @property
     * @type {Object}
     * */
    this._calls = {};

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
 * @param {Unit} unit
 * @param {*} [args]
 * */
Track.prototype.invoke = function (unit, args) {
    var context = unit.createContext(this, args);
    var logger = context.logger;
    var hash = unit.name + '-' + context.argsHash;
    var calls = this._calls;

    logger.debug('Starting invocation, args %(params)j hashed as "%s"', hash, context);

    if (hasProperty.call(calls, hash)) {
        logger.debug('Using memorized call with %(params)j as "%s"', hash, context);
    } else {
        calls[hash] = unit.call(this, context);
    }

    return calls[hash];
};

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
Track.prototype.eject = function (name, args) {
    return this._agent.callUnit(this, name, args).then(function (res) {
        return res && res.result;
    });
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
