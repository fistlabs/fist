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
Track.prototype.invoke = function (unit, args, done) {
    var context = unit.createContext(this, args);
    var logger = context.logger;
    //  TODO prevent throwing user code!
    var hash = unit.name + '-' + unit.hashArgs(this, context);
    var calls = this._calls;
    var next;

    logger.debug('Starting invocation, args %(params)j hashed as "%s"', hash, context);

    if (hasProperty.call(calls, hash)) {
        logger.debug('Using memorized call %(params)j "%s"', hash, context);
        next = calls[hash];
        if (next.done) {
            done.apply(null, next.args);
        } else {
            next.func.push(done);
        }

        return;
    }

    next = calls[hash] = {
        done: false,
        args: [],
        func: [done]
    };

    unit.call(this, context, function () {
        var i;
        var l;
        var func = next.func;

        next.done = true;
        next.args = arguments;

        for (i = 0, l = func.length; i < l; i += 1) {
            func[i].apply(null, next.args);
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
Track.prototype.eject = function (name, args) {
    var defer = vow.defer();
    this._agent.callUnit(this, name, args, function (err, res) {
        if (arguments.length < 2) {
            defer.reject(err);
            return;
        }

        defer.resolve(res && res.result);
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
