'use strict';

var hasProperty = Object.prototype.hasOwnProperty;
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
 * @param {*} args
 * @param {Function} done
 * */
Track.prototype.eject = function (unit, args, done) {
    var context = unit.createContext(this, args);
    var identity = context.identity = unit.identify(this, context);
    var logger = this.logger;
    var name = unit.name;
    var hash = name + '-' + identity;
    var calls = this._calls;

    logger.debug('Starting "%s" as "%s"', name, hash);

    if (hasProperty.call(calls, hash)) {
        logger.debug('Identity "%s" found for "%s"', hash, name);
    } else {
        calls[hash] = {
            done: false,
            onOk: [],
            args: []
        };
    }

    calls = calls[hash];

    if (calls.done) {
        if (calls.args[0]) {
            done(calls.args[0]);
        } else {
            done(calls.args[0], calls.args[1]);
        }
        return;
    }

    calls.onOk.push(done);

    if (calls.onOk.length > 1) {
        return;
    }

    unit.call(this, context, function (err, val) {
        var i = 0;
        var l = calls.onOk.length;

        calls.done = true;
        calls.args = arguments;

        if (err) {
            for (; i < l; i += 1) {
                calls.onOk[i](err);
            }
        } else {
            for (; i < l; i += 1) {
                calls.onOk[i](null, val);
            }
        }
    });
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
Track.prototype.invoke = function (name, args) {
    var defer = vow.defer();

    this._agent.callUnit(this, name, args, function (err, res) {
        if (err) {
            defer.reject(err);
        } else {
            defer.resolve(res && res.result);
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
